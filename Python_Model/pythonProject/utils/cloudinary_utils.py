import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from urllib.parse import urlparse

load_dotenv()

cloudinary_url = os.environ.get("CLOUDINARY_URL")
if not cloudinary_url:
    raise ValueError("CLOUDINARY_URL is not set.")

parsed_url = urlparse(cloudinary_url)
cloud_name = parsed_url.hostname
api_key = parsed_url.username
api_secret = parsed_url.password

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True
)

def upload_image_to_cloudinary(local_path, public_id=None):
    result = cloudinary.uploader.upload(
        local_path,
        public_id=public_id,
        folder="predictions"
    )
    return result['secure_url']
