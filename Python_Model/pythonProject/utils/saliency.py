import numpy as np
import tensorflow as tf
import cv2
import matplotlib.pyplot as plt
import os
import uuid
from utils.cloudinary_utils import upload_image_to_cloudinary

HEATMAP_FOLDER = "static/heatmaps"

def saliency_map(model, img_array, class_idx=None):
    img_array = np.expand_dims(img_array, axis=0)
    img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
    img_array = tf.convert_to_tensor(img_array, dtype=tf.float32)

    with tf.GradientTape() as tape:
        tape.watch(img_array)
        prediction = model(img_array)
        if class_idx is None:
            class_idx = np.argmax(prediction[0])
        class_output = prediction[:, class_idx]

    grads = tape.gradient(class_output, img_array)
    saliency = np.max(np.abs(grads), axis=-1)[0]
    saliency = np.maximum(saliency, 0)
    saliency /= np.max(saliency)
    return saliency


def show_saliency_map(img_array, saliency, save=True):
    saliency = cv2.resize(saliency, (img_array.shape[1], img_array.shape[0]))
    saliency = np.uint8(255 * saliency)
    saliency = cv2.applyColorMap(saliency, cv2.COLORMAP_JET)
    saliency = np.clip(saliency, 0, 255)

    superimposed_img = 0.4 * saliency + 0.6 * img_array
    superimposed_img = superimposed_img.astype(np.uint8)

    if save:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp:
            cv2.imwrite(temp.name, cv2.cvtColor(superimposed_img, cv2.COLOR_RGB2BGR))
            temp_path = temp.name
        cloudinary_url = upload_image_to_cloudinary(temp_path)
        os.remove(temp_path)
        return cloudinary_url
    else:
        return superimposed_img