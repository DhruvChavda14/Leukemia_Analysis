import numpy as np
import os
import uuid
import cv2
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input
from tf_keras_vis.utils.model_modifiers import ReplaceToLinear
from tf_keras_vis.utils.scores import CategoricalScore
from tf_keras_vis.gradcam import Gradcam
from tf_keras_vis.utils import normalize
from utils.cloudinary_utils import upload_image_to_cloudinary
from PIL import Image

HEATMAP_FOLDER = "static/heatmaps"
os.makedirs(HEATMAP_FOLDER, exist_ok=True)

def generate_gradcam(img_path, model, layer_name='top_conv'):
    try:
        img = Image.open(img_path).convert('RGB')
        img = img.resize((300, 300))
        img_array_uint8 = np.array(img).astype(np.uint8) 
        img_array = np.array(img).astype(np.float32)     
        print(f"Loaded image for gradcam: shape={img_array.shape}, dtype={img_array.dtype}")
    except Exception as e:
        print(f"Error loading image for gradcam: {e}")
        raise
    processed_img = preprocess_input(img_array.copy())
    input_tensor = np.expand_dims(processed_img, axis=0)

    probs = model.predict(input_tensor)
    pred_class = np.argmax(probs)

    if 'efficientnet' in model.layers[0].name.lower():
        base_model = model.layers[0]
    else:
        raise ValueError("EfficientNet base model not found in the provided model.")

    modifier = ReplaceToLinear()
    score = CategoricalScore([pred_class])
    gradcam = Gradcam(base_model, model_modifier=modifier)
    cam = gradcam(score, input_tensor, penultimate_layer=layer_name)

    if cam is None or cam[0] is None:
        raise ValueError("GradCAM output is None. Check input and model.")

    heatmap = normalize(cam[0])
    heatmap_uint8 = np.uint8(255 * heatmap)

    heatmap_resized = cv2.resize(heatmap_uint8, (300, 300))
    original_image = cv2.cvtColor(img_array_uint8, cv2.COLOR_RGB2BGR)
    blended = cv2.addWeighted(original_image, 0.6, cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET), 0.4, 0)

    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp:
        cv2.imwrite(temp.name, blended)
        temp_path = temp.name
    cloudinary_url = upload_image_to_cloudinary(temp_path)
    os.remove(temp_path)
    print(f"Grad-CAM uploaded to Cloudinary: {cloudinary_url}")
    return cloudinary_url