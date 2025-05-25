from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import uuid
import tempfile
import requests
from io import BytesIO

from utils.saliency import saliency_map, show_saliency_map
from utils.gradcam import generate_gradcam
from utils.preprocess import preprocess_image
from utils.cloudinary_utils import upload_image_to_cloudinary

app = Flask(__name__)

CORS(app, origins="*", supports_credentials=True)

HEATMAP_FOLDER = "static/heatmaps"
os.makedirs(HEATMAP_FOLDER, exist_ok=True)

try:
    cnn_model = load_model("models/model_for_leukemia.h5")
except Exception as e:
    print(f"Error loading model: {e}")
    cnn_model = None

class_labels = ['Benign', 'Early', 'Pre', 'Pro']

CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "dcfdglofy")

def get_full_cloudinary_url(cloudinary_url_or_id):
    if not cloudinary_url_or_id:
        return None
    if cloudinary_url_or_id.startswith("http"):
        return cloudinary_url_or_id
    return f"https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/image/upload/{cloudinary_url_or_id}"

@app.route("/")
def index():
    return "Leukemia XAI Backend is running!"

@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    print("Received /predict request")
    print("Request files:", request.files)
    print("Request form:", request.form)
    if request.method == "OPTIONS":
        return '', 204

    if cnn_model is None:
        print("Model not loaded")
        return jsonify({"error": "Model not loaded"}), 500

    if "image" not in request.files:
        print("No image file provided")
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == '':
        print("No file selected")
        return jsonify({"error": "No file selected"}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='_' + file.filename) as temp:
            file.save(temp.name)
            temp_path = temp.name
        print(f"Saved image to temp path: {temp_path}")

        img = preprocess_image(temp_path)
        preds = cnn_model.predict(img)
        score = np.max(preds)
        label = class_labels[np.argmax(preds)]
        print(f"Prediction: {label}, Confidence: {score}")

        original_cloudinary_url = upload_image_to_cloudinary(temp_path)
        print(f"Uploaded to Cloudinary: {original_cloudinary_url}")
        os.remove(temp_path)

        return jsonify({"class": label, "confidence": float(score), "cloudinary_url": original_cloudinary_url})
    except Exception as e:
        print("Exception in /predict:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/saliency", methods=["POST"])
def get_saliency_map():
    print("Received /saliency request")
    try:
        data = request.get_json()
        print("Request JSON:", data)
        cloudinary_url = data.get('cloudinary_url')
        if not cloudinary_url:
            print("No Cloudinary URL provided")
            return jsonify({"error": "No Cloudinary URL provided"}), 400
        cloudinary_url = get_full_cloudinary_url(cloudinary_url)
        print(f"Fetching image from: {cloudinary_url}")
        response = requests.get(cloudinary_url)
        print("Cloudinary response status:", response.status_code)
        print("Cloudinary response headers:", response.headers)
        print("First 100 bytes of content:", response.content[:100])
        img = Image.open(BytesIO(response.content)).resize((300, 300))
        img_array = np.array(img)
        saliency = saliency_map(cnn_model, img_array)
        cloudinary_heatmap_url = show_saliency_map(img_array, saliency, save=True)
        print(f"Saliency heatmap uploaded to Cloudinary: {cloudinary_heatmap_url}")
        return jsonify({"cloudinary_url": cloudinary_heatmap_url})
    except Exception as e:
        print("Exception in /saliency:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/gradcam", methods=["POST"])
def get_gradcam():
    print("Received /gradcam request")
    try:
        data = request.get_json()
        print("Request JSON:", data)
        cloudinary_url = data.get('cloudinary_url')
        if not cloudinary_url:
            print("No Cloudinary URL provided")
            return jsonify({"error": "No Cloudinary URL provided"}), 400
        cloudinary_url = get_full_cloudinary_url(cloudinary_url)
        print(f"Fetching image from: {cloudinary_url}")
        response = requests.get(cloudinary_url)
        print("Cloudinary response status:", response.status_code)
        print("Cloudinary response headers:", response.headers)
        print("First 100 bytes of content:", response.content[:100])
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp:
            temp.write(response.content)
            temp_path = temp.name
        print(f"Saved gradcam input to temp path: {temp_path}")
        cloudinary_gradcam_url = generate_gradcam(temp_path, cnn_model)
        print(f"GradCAM heatmap uploaded to Cloudinary: {cloudinary_gradcam_url}")
        os.remove(temp_path)
        return jsonify({"cloudinary_url": cloudinary_gradcam_url})
    except Exception as e:
        print("Exception in /gradcam:", str(e))
        return jsonify({"error": str(e)}), 500

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
