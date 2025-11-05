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
MODEL_INPUT_SIZE = 224  # ViT common input size
MODEL_PATH_ENV = os.getenv("FER_MODEL_PATH")
DEFAULT_MODEL_PATH = r"C:\\Users\\VISHWA TEJA THOUTI\\Downloads\\furniture-fusion-bazaar-main (2)\\furniture-fusion-bazaar-main\\backend\\agents\\emotion-detection\\models\\best_vit_fer2013_model.pt"
MODEL_PATH = MODEL_PATH_ENV if MODEL_PATH_ENV else DEFAULT_MODEL_PATH

model = None
try:
    if Path(MODEL_PATH).exists():
        model = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
        if isinstance(model, nn.Module):
            model.eval()
        MODEL_LOADED = True
        logger.info(f"✅ FER-2013 ViT model loaded from: {MODEL_PATH}")
    else:
        logger.warning(f"FER model not found at {MODEL_PATH}. Using mock predictions.")
except Exception as e:
    logger.error(f"Failed to load FER model: {e}")
    MODEL_LOADED = False

@app.route('/')
def home():
    return jsonify({
        "service": "Emotion Detection API",
        "version": "1.0.0",
        "status": "running",
        "model": "FER-2013 ViT" if MODEL_LOADED else "mock",
        "model_loaded": MODEL_LOADED
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL_LOADED
    })

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
        face = gray[y:y+h, x:x+w]
        
        predictions = None
        if MODEL_LOADED and isinstance(model, nn.Module):
            # Preprocess for ViT: resize 224x224, convert gray->3 channels, normalize ImageNet
            face_resized = cv2.resize(face, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE))
            face_3ch = np.stack([face_resized, face_resized, face_resized], axis=-1)  # HWC, 3ch
            face_float = face_3ch.astype(np.float32) / 255.0
            # ImageNet mean/std
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            face_norm = (face_float - mean) / std
            # To tensor NCHW
            tensor = torch.from_numpy(face_norm).permute(2, 0, 1).unsqueeze(0)  # 1x3x224x224
            with torch.no_grad():
                logits = model(tensor)
                if isinstance(logits, (list, tuple)):
                    logits = logits[0]
                probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
            predictions = probs
        else:
            # Mock predictions fallback
            face_resized = cv2.resize(face, (48, 48))
            face_normalized = face_resized / 255.0
            predictions = np.array([
                0.05, 0.02, 0.10, 0.35, 0.08, 0.15, 0.25
            ])
            predictions += np.random.uniform(-0.05, 0.05, 7)
            predictions = np.clip(predictions, 0, 1)
            predictions /= predictions.sum()
        
        emotion_idx = np.argmax(predictions)
        emotion = emotion_labels[emotion_idx]
        confidence = float(predictions[emotion_idx])
        
        # Combine emotion data with tracking data
        result = {
            'emotion': emotion,
            'confidence': confidence,
            'metrics': {
                'confident': float(predictions[3]),  # Happy
                'nervous': float(predictions[2]),    # Fear
                'stressed': float(predictions[4]),   # Sad
                'engaged': float(predictions[5]),    # Surprise
                'neutral': float(predictions[6])     # Neutral
            },
            'face_detected': True,
            'all_emotions': {
                emotion_labels[i]: float(predictions[i]) 
                for i in range(len(emotion_labels))
            },
            'tracking': tracking_data if tracking_data else {
                'blink_count': 0,
                'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0, 'looking_at_camera': True},
                'gaze': {'horizontal': 'center', 'vertical': 'center'},
                'looking_at_camera': True,
                'face_detected': True
            }
        }
        
        logger.info(f"Analyzed emotion: {emotion} (confidence: {confidence:.2f})")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in emotion analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Emotion Detection Service on port 5000...")
    if not MODEL_LOADED:
        logger.warning("NOTE: Using mock predictions. Provide FER_MODEL_PATH in backend/.env or place model at default path for real predictions.")
    app.run(host='0.0.0.0', port=5000, debug=True)
