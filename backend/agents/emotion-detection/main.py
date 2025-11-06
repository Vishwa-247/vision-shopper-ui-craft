from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import logging
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import torch
import torch.nn as nn

# Add utils to path
sys.path.append(str(Path(__file__).parent))
from utils.face_tracker import AdvancedFaceTracker

# Load environment variables from backend root
backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Emotion labels for FER-2013 dataset
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Initialize face tracker
face_tracker = AdvancedFaceTracker()

# Load ViT FER-2013 model (PyTorch)
MODEL_LOADED = False
# Configurable settings via env
MODEL_INPUT_SIZE = int(os.getenv("FER_INPUT_SIZE", "224"))
MODEL_PATH_ENV = os.getenv("FER_MODEL_PATH")
DEFAULT_MODEL_PATH = r"C:\\Users\\VISHWA TEJA THOUTI\\Downloads\\furniture-fusion-bazaar-main (2)\\furniture-fusion-bazaar-main\\backend\\agents\\emotion-detection\\models\\best_vit_fer2013_model.pt"
MODEL_PATH = MODEL_PATH_ENV if MODEL_PATH_ENV else DEFAULT_MODEL_PATH
MODEL_TYPE = os.getenv("FER_MODEL_TYPE", "auto").lower()  # auto|full|state_dict|script
MODEL_ARCH = os.getenv("FER_MODEL_ARCH", "vit_small_patch16_224")  # timm name
MODEL_NUM_CLASSES = int(os.getenv("FER_NUM_CLASSES", "7"))

model = None


def _build_model_for_state_dict() -> nn.Module:
    """Create a model backbone compatible with the provided state_dict.
    Attempts to use timm if available; falls back to a minimal ViT-like head.
    """
    try:
        import timm  # type: ignore
        backbone = timm.create_model(MODEL_ARCH, pretrained=False, num_classes=MODEL_NUM_CLASSES, in_chans=3)
        logger.info(f"✅ Created timm model '{MODEL_ARCH}' with num_classes={MODEL_NUM_CLASSES}")
        return backbone
    except Exception as e:
        logger.warning(f"timm unavailable or failed to create '{MODEL_ARCH}': {e}. Falling back to simple head.")
        # Fallback simple classifier over flattened features (very naive)
        class SimpleCNN(nn.Module):
            def __init__(self, num_classes: int):
                super().__init__()
                self.features = nn.Sequential(
                    nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
                    nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
                    nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d((1, 1)),
                )
                self.classifier = nn.Linear(128, num_classes)
            def forward(self, x):
                x = self.features(x)
                x = x.view(x.size(0), -1)
                return self.classifier(x)
        return SimpleCNN(MODEL_NUM_CLASSES)


def _try_load_model(path: str) -> bool:
    global model, MODEL_LOADED, MODEL_PATH
    MODEL_PATH = path
    try:
        p = Path(path)
        if not p.exists():
            logger.warning(f"FER model not found at {p}. Using mock predictions.")
            MODEL_LOADED = False
            return False

        # Auto-detect type when MODEL_TYPE=auto
        mtype = MODEL_TYPE
        if mtype == "auto":
            # Heuristics: TorchScript often loads with torch.jit.load; try that first
            try:
                scripted = torch.jit.load(str(p), map_location=torch.device('cpu'))
                if isinstance(scripted, torch.jit.ScriptModule) or isinstance(scripted, torch.jit.RecursiveScriptModule):
                    model = scripted
                    MODEL_LOADED = True
                    logger.info(f"✅ TorchScript model loaded: {p}")
                    return True
            except Exception:
                pass
            # Try full pickled nn.Module next
            try:
                full_obj = torch.load(str(p), map_location=torch.device('cpu'))
                if isinstance(full_obj, nn.Module):
                    full_obj.eval()
                    model = full_obj
                    MODEL_LOADED = True
                    logger.info(f"✅ Pickled nn.Module loaded: {p}")
                    return True
                # Not a Module, assume state_dict
                state_dict = full_obj
                if isinstance(state_dict, dict):
                    backbone = _build_model_for_state_dict()
                    missing, unexpected = backbone.load_state_dict(state_dict, strict=False)
                    if missing:
                        logger.warning(f"State dict missing keys: {list(missing)[:8]} ...")
                    if unexpected:
                        logger.warning(f"Unexpected keys in state dict: {list(unexpected)[:8]} ...")
                    backbone.eval()
                    model = backbone
                    MODEL_LOADED = True
                    logger.info(f"✅ State dict loaded into backbone: {p}")
                    return True
            except Exception as e:
                logger.error(f"Auto load failed: {e}")
                MODEL_LOADED = False
                return False
        else:
            if mtype == "script":
                scripted = torch.jit.load(str(p), map_location=torch.device('cpu'))
                model = scripted
                MODEL_LOADED = True
                logger.info(f"✅ TorchScript model loaded: {p}")
                return True
            if mtype == "full":
                full_obj = torch.load(str(p), map_location=torch.device('cpu'))
                if not isinstance(full_obj, nn.Module):
                    raise RuntimeError("Provided model is not an nn.Module; set FER_MODEL_TYPE=state_dict if it's a state dict.")
                full_obj.eval()
                model = full_obj
                MODEL_LOADED = True
                logger.info(f"✅ Pickled nn.Module loaded: {p}")
                return True
            if mtype == "state_dict":
                state_dict = torch.load(str(p), map_location=torch.device('cpu'))
                backbone = _build_model_for_state_dict()
                missing, unexpected = backbone.load_state_dict(state_dict, strict=False)
                if missing:
                    logger.warning(f"State dict missing keys: {list(missing)[:8]} ...")
                if unexpected:
                    logger.warning(f"Unexpected keys in state dict: {list(unexpected)[:8]} ...")
                backbone.eval()
                model = backbone
                MODEL_LOADED = True
                logger.info(f"✅ State dict loaded into backbone: {p}")
                return True
        
        MODEL_LOADED = False
        return False
    except Exception as e:
        logger.error(f"Failed to load FER model: {e}")
        MODEL_LOADED = False
        return False

# Initial load
_try_load_model(MODEL_PATH)

@app.route('/')
def home():
    return jsonify({
        "service": "Emotion Detection API",
        "version": "1.0.0",
        "status": "running",
        "model": "custom" if MODEL_LOADED else "mock",
        "model_loaded": MODEL_LOADED,
        "model_path": str(MODEL_PATH),
        "model_type": MODEL_TYPE,
        "model_arch": MODEL_ARCH,
        "num_classes": MODEL_NUM_CLASSES,
        "input_size": MODEL_INPUT_SIZE
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL_LOADED,
        "model_path": str(MODEL_PATH),
        "model_type": MODEL_TYPE
    })

@app.route('/reload', methods=['POST'])
def reload_model():
    """Reload model from FER_MODEL_PATH without restarting the service."""
    global MODEL_PATH, MODEL_TYPE, MODEL_ARCH, MODEL_NUM_CLASSES, MODEL_INPUT_SIZE
    # Allow override via body
    try:
        body = request.get_json(silent=True) or {}
    except Exception:
        body = {}
    if body.get('model_path'):
        MODEL_PATH = body['model_path']
    else:
        env_path_override = os.getenv('FER_MODEL_PATH')
        if env_path_override:
            MODEL_PATH = env_path_override
    if body.get('model_type'):
        MODEL_TYPE = str(body['model_type']).lower()
    if body.get('model_arch'):
        MODEL_ARCH = str(body['model_arch'])
    if body.get('num_classes'):
        MODEL_NUM_CLASSES = int(body['num_classes'])
    if body.get('input_size'):
        MODEL_INPUT_SIZE = int(body['input_size'])
    ok = _try_load_model(MODEL_PATH)
    status = 200 if ok else 500
    return jsonify({
        "model_loaded": MODEL_LOADED,
        "model_path": str(MODEL_PATH),
        "model_type": MODEL_TYPE,
        "model_arch": MODEL_ARCH,
        "num_classes": MODEL_NUM_CLASSES,
        "input_size": MODEL_INPUT_SIZE
    }), status

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze_emotion():
    """Analyze facial emotion from image"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Get image from request (base64 encoded)
        image_data = data['image']
        
        # Decode base64 image
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return jsonify({'error': 'Failed to decode image'}), 400
                
        except Exception as e:
            logger.error(f"Image decoding error: {str(e)}")
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            logger.warning("No face detected in image")
            # Return neutral values when no face detected
            return jsonify({
                'emotion': 'Neutral',
                'confidence': 0.5,
                'metrics': {
                    'confident': 0.5,
                    'nervous': 0.3,
                    'stressed': 0.2,
                    'engaged': 0.6,
                    'neutral': 0.7
                },
                'face_detected': False
            })
        
        # Advanced face tracking
        tracking_data = face_tracker.analyze_frame(img)
        
        # Get largest face
        x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
        # Crop and preprocess face for model
        face_img = img[y:y+h, x:x+w]
        face_resized = cv2.resize(face_img, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE))
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
        face_norm = face_rgb.astype(np.float32) / 255.0
        # Simple normalization; adapt if your model expects mean/std normalization
        face_tensor = torch.from_numpy(face_norm).permute(2, 0, 1).unsqueeze(0)
        
        if MODEL_LOADED and model is not None:
            try:
                with torch.no_grad():
                    logits = model(face_tensor)
                    if isinstance(logits, (list, tuple)):
                        logits = logits[0]
                    probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                    top_idx = int(np.argmax(probs))
                    # Safeguard index if label count mismatches
                    label_count = min(len(emotion_labels), probs.shape[0])
                    top_idx = int(np.argmax(probs[:label_count]))
                    emotion = emotion_labels[top_idx] if top_idx < len(emotion_labels) else 'Neutral'
                    confidence = float(probs[top_idx]) if top_idx < probs.shape[0] else 0.5
                    metrics = {
                        'confident': float(probs[emotion_labels.index('Happy')]) if 'Happy' in emotion_labels and emotion_labels.index('Happy') < probs.shape[0] else 0.6,
                        'nervous': float(probs[emotion_labels.index('Fear')]) if 'Fear' in emotion_labels and emotion_labels.index('Fear') < probs.shape[0] else 0.3,
                        'stressed': float(probs[emotion_labels.index('Angry')]) if 'Angry' in emotion_labels and emotion_labels.index('Angry') < probs.shape[0] else 0.2,
                        'engaged': 0.6,
                        'neutral': float(probs[emotion_labels.index('Neutral')]) if 'Neutral' in emotion_labels and emotion_labels.index('Neutral') < probs.shape[0] else 0.5,
                    }
            except Exception as e:
                logger.error(f"Model inference failed: {e}")
                emotion = 'Neutral'
                confidence = 0.5
                metrics = {
                    'confident': 0.6,
                    'nervous': 0.3,
                    'stressed': 0.2,
                    'engaged': 0.6,
                    'neutral': 0.5,
                }
        else:
            # Mock predictions
            emotion = 'Neutral'
            confidence = 0.55
            metrics = {
                'confident': 0.6,
                'nervous': 0.3,
                'stressed': 0.2,
                'engaged': 0.6,
                'neutral': 0.7,
            }
        
        return jsonify({
            'emotion': emotion,
            'confidence': confidence,
            'metrics': metrics,
            'face_tracking': tracking_data,
            'face_detected': True
        })
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    # Default to port 5000
    port = int(os.getenv("EMOTION_PORT", 5000))
    app.run(host="0.0.0.0", port=port)
