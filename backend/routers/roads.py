from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import random
import os

app = Flask(__name__)

# ============================================================
# CONFIGURATION
# ============================================================
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}


# ============================================================
# HELPER FUNCTIONS
# ============================================================
def allowed_file(filename):
    """Check valid image extensions."""

    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ============================================================
# AI MODULE (MOCK)
# ============================================================
def detect_pothole_ai(image_path):
    """
    Simulated AI pothole detection module.

    Replace this later with:
    - TensorFlow model
    - PyTorch model
    - YOLOv8 road damage detector
    - OpenCV processing pipeline
    """

    # Load image
    image = Image.open(image_path)
    image = image.resize((224, 224))

    # Convert to array
    image_array = np.array(image)

    # Mock prediction
    labels = ["Pothole Detected", "Road Clear"]

    prediction = random.choice(labels)
    confidence = round(random.uniform(75, 99), 2)

    return {
        "label": prediction,
        "confidence": confidence
    }


# ============================================================
# API ROUTE
# ============================================================
@app.route('/detect-pothole', methods=['POST'])
def detect_pothole():
    """
    POST /detect-pothole

    Accepts:
    --------
    multipart/form-data
    file=<image>

    Returns:
    --------
    JSON response with:
    - label
    - confidence
    """

    # Check image exists
    if 'file' not in request.files:
        return jsonify({
            "success": False,
            "error": "No image file provided"
        }), 400

    file = request.files['file']

    # Empty filename
    if file.filename == '':
        return jsonify({
            "success": False,
            "error": "No selected file"
        }), 400

    # Invalid extension
    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": "Invalid file type"
        }), 400

    try:
        # Save image
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        # AI prediction
        result = detect_pothole_ai(filepath)

        # Final response
        response = {
            "success": True,
            "filename": file.filename,
            "prediction": {
                "label": result["label"],
                "confidence": f"{result['confidence']}%"
            }
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================
@app.route('/')
def home():
    return jsonify({
        "message": "Raksha AI Road Safety API Running"
    })


# ============================================================
# MAIN DRIVER
# ============================================================
if __name__ == '__main__':
    app.run(debug=True)
