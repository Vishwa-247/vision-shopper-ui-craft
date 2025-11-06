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
# Default to relative path from script location
DEFAULT_MODEL_PATH = Path(__file__).parent / "models" / "best_vit_fer2013_model.pt"
# Resolve to absolute path immediately
MODEL_PATH = MODEL_PATH_ENV if MODEL_PATH_ENV else str(DEFAULT_MODEL_PATH.resolve())
MODEL_TYPE = os.getenv("FER_MODEL_TYPE", "auto").lower()  # auto|full|state_dict|script
MODEL_ARCH = os.getenv("FER_MODEL_ARCH", "google/vit-base-patch16-224-in21k")  # transformers model name or timm name
MODEL_NUM_CLASSES = int(os.getenv("FER_NUM_CLASSES", "7"))

model = None


def _build_model_for_state_dict() -> nn.Module:
    """Create a model backbone compatible with the provided state_dict.
    Uses transformers ViT model (same as training) if available, falls back to timm.
    """
    # Try to use transformers first (since that's what was used for training)
    try:
        from transformers import ViTForImageClassification
        model_name = os.getenv("FER_TRANSFORMERS_MODEL", "google/vit-base-patch16-224-in21k")
        model = ViTForImageClassification.from_pretrained(model_name, num_labels=MODEL_NUM_CLASSES)
        logger.info(f"✅ Created transformers ViT model '{model_name}' with num_classes={MODEL_NUM_CLASSES}")
        return model
    except Exception as e:
        logger.warning(f"transformers ViT unavailable: {e}. Trying timm...")
        try:
            import timm  # type: ignore
            # Map to timm architecture name
            arch_map = {
                "google/vit-base-patch16-224-in21k": "vit_base_patch16_224",
                "vit_base_patch16_224": "vit_base_patch16_224",
                "vit_small_patch16_224": "vit_small_patch16_224",
            }
            timm_arch = arch_map.get(MODEL_ARCH, MODEL_ARCH)
            backbone = timm.create_model(timm_arch, pretrained=False, num_classes=MODEL_NUM_CLASSES, in_chans=3)
            logger.info(f"✅ Created timm model '{timm_arch}' with num_classes={MODEL_NUM_CLASSES}")
            return backbone
        except Exception as e2:
            logger.warning(f"timm unavailable or failed: {e2}. Falling back to simple head.")
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
        # Sanitize incoming path from env/user (handle quotes and backslashes)
        raw = str(path).strip().strip('"').strip("'")
        # First attempt: as-is
        p = Path(raw)
        # If relative, make it relative to script directory
        if not p.is_absolute():
            p = Path(__file__).parent / p
        p = p.resolve()
        
        # Second attempt: convert backslashes to forward slashes (avoids \f issues)
        if not p.exists():
            alt = Path(raw.replace('\\', '/'))
            if not alt.is_absolute():
                alt = Path(__file__).parent / alt
            alt = alt.resolve()
            logger.info(f"Trying alternate normalized path: {alt}")
            if alt.exists():
                p = alt
        
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
                full_obj = torch.load(str(p), map_location=torch.device('cpu'), weights_only=False)
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
            except (AttributeError, RuntimeError, ImportError) as e:
                error_msg = str(e)
                if "Can't get attribute" in error_msg or "ViTSdpaAttention" in error_msg:
                    logger.warning(f"Model has missing class attributes (likely transformers version mismatch). Extracting state_dict...")
                    # Try to extract state_dict from the pickled file
                    try:
                        import pickle
                        import sys
                        
                        # Create a dummy module for missing classes
                        class DummyModule:
                            def __init__(self, *args, **kwargs):
                                pass
                        
                        # Patch sys.modules to handle missing classes
                        original_import = __import__
                        def patched_import(name, *args, **kwargs):
                            if 'ViTSdpaAttention' in name or 'transformers.models.vit.modeling_vit' in name:
                                return DummyModule()
                            return original_import(name, *args, **kwargs)
                        
                        # Try loading with error handling
                        try:
                            with open(str(p), 'rb') as f:
                                # Load the pickled object
                                obj = pickle.load(f)
                            
                            # Extract state_dict
                            if hasattr(obj, 'state_dict'):
                                state_dict = obj.state_dict()
                                logger.info("✅ Extracted state_dict from model object")
                            elif isinstance(obj, dict):
                                if 'state_dict' in obj:
                                    state_dict = obj['state_dict']
                                elif any(key.startswith(('vit.', 'model.', 'encoder.', 'classifier.', 'head.')) for key in obj.keys()):
                                    state_dict = obj
                                else:
                                    raise ValueError("Could not identify state_dict in loaded object")
                            else:
                                raise ValueError("Loaded object is neither a model nor a state_dict")
                            
                            # Load into compatible model
                            backbone = _build_model_for_state_dict()
                            
                            # Handle transformers model structure (may have 'vit.' prefix or be nested)
                            if hasattr(backbone, 'vit') and any(not k.startswith('vit.') for k in state_dict.keys()):
                                # Need to add 'vit.' prefix
                                new_state_dict = {}
                                for k, v in state_dict.items():
                                    if k.startswith('classifier.'):
                                        new_state_dict[k] = v
                                    else:
                                        new_state_dict[f'vit.{k}'] = v
                                state_dict = new_state_dict
                            elif not hasattr(backbone, 'vit') and any(k.startswith('vit.') for k in state_dict.keys()):
                                # Need to remove 'vit.' prefix
                                new_state_dict = {}
                                for k, v in state_dict.items():
                                    if k.startswith('vit.'):
                                        new_state_dict[k[4:]] = v
                                    else:
                                        new_state_dict[k] = v
                                state_dict = new_state_dict
                            
                            missing, unexpected = backbone.load_state_dict(state_dict, strict=False)
                            if missing:
                                logger.warning(f"State dict missing keys: {list(missing)[:8]} ...")
                            if unexpected:
                                logger.warning(f"Unexpected keys in state dict: {list(unexpected)[:8]} ...")
                            backbone.eval()
                            model = backbone
                            MODEL_LOADED = True
                            logger.info(f"✅ State dict extracted and loaded into compatible model: {p}")
                            return True
                        except Exception as e2:
                            logger.error(f"Failed to extract state_dict: {e2}")
                            MODEL_LOADED = False
                            return False
                    except Exception as e3:
                        logger.error(f"Failed to extract state_dict with pickle: {e3}")
                        MODEL_LOADED = False
                        return False
                else:
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
                try:
                    full_obj = torch.load(str(p), map_location=torch.device('cpu'), weights_only=False)
                    if not isinstance(full_obj, nn.Module):
                        raise RuntimeError("Provided model is not an nn.Module; set FER_MODEL_TYPE=state_dict if it's a state dict.")
                    full_obj.eval()
                    model = full_obj
                    MODEL_LOADED = True
                    logger.info(f"✅ Pickled nn.Module loaded: {p}")
                    return True
                except (AttributeError, RuntimeError) as e:
                    if "Can't get attribute" in str(e) or "ViTSdpaAttention" in str(e):
                        logger.warning(f"Model has missing class attributes. Switching to state_dict extraction...")
                        # Extract and load as state_dict
                        import pickle
                        try:
                            with open(str(p), 'rb') as f:
                                obj = pickle.load(f)
                            if hasattr(obj, 'state_dict'):
                                state_dict = obj.state_dict()
                            elif isinstance(obj, dict):
                                state_dict = obj.get('state_dict', obj)
                            else:
                                raise ValueError("Could not extract state_dict")
                            
                            backbone = _build_model_for_state_dict()
                            # Handle transformers model structure
                            if hasattr(backbone, 'vit') and any(not k.startswith('vit.') for k in state_dict.keys()):
                                new_state_dict = {}
                                for k, v in state_dict.items():
                                    if k.startswith('classifier.'):
                                        new_state_dict[k] = v
                                    else:
                                        new_state_dict[f'vit.{k}'] = v
                                state_dict = new_state_dict
                            
                            missing, unexpected = backbone.load_state_dict(state_dict, strict=False)
                            if missing:
                                logger.warning(f"State dict missing keys: {list(missing)[:8]} ...")
                            if unexpected:
                                logger.warning(f"Unexpected keys: {list(unexpected)[:8]} ...")
                            backbone.eval()
                            model = backbone
                            MODEL_LOADED = True
                            logger.info(f"✅ State dict extracted and loaded: {p}")
                            return True
                        except Exception as e2:
                            logger.error(f"Failed to extract state_dict: {e2}")
                            raise RuntimeError(f"Failed to load model: {e}. Try setting FER_MODEL_TYPE=state_dict in .env")
                    raise
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
        # Normalize for ImageNet (standard for ViT models) - matches training preprocessing
        face_norm = face_rgb.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        face_norm = (face_norm - mean) / std
        face_tensor = torch.from_numpy(face_norm).permute(2, 0, 1).unsqueeze(0).float()
        
        if MODEL_LOADED and model is not None:
            try:
                with torch.no_grad():
                    # Handle transformers model output (has .logits attribute)
                    output = model(face_tensor)
                    if hasattr(output, 'logits'):
                        logits = output.logits
                    elif hasattr(output, 'logit'):
                        logits = output.logit
                    elif isinstance(output, (list, tuple)):
                        logits = output[0]
                    else:
                        logits = output
                    
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
