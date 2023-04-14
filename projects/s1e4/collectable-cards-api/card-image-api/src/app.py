import os

import boto3
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import json
import uuid
from botocore.config import Config

from flask import Flask, jsonify, request


def create_app():
    app = Flask(__name__)

    region = os.environ.get("REGION", "us-west-2")
    bucket_name = os.environ.get("CARD_IMAGE_BUCKET", "")
    endpoint_name = os.environ.get(
        "CARD_IMAGE_ENDPOINT", "jumpstart-dft-naclbit-trinart-stable-diffusion-v2-1")

    s3_client = boto3.client('s3')

    @app.route("/")
    def hello():
        return "Hello World!"

    @app.route("/card-image/healthcheck")
    def healthcheck():
        return "Success", 200

    @app.route("/card-image/prompt", methods=["POST"])
    def create_image():
        prompt = request.json.get('prompt')
        print(prompt)
        if not prompt:
            return jsonify({'error': 'Please provide a prompt'}), 400

        resp = query_endpoint(prompt)
        img, prompt = parse_response(resp)
        urls = []
        for i in img:
            urls.append(save_image(i, prompt))

        return jsonify({
            'urls': urls
        })

    def query_endpoint(text):
        config = Config(region_name=region)
        client = boto3.client('runtime.sagemaker', config=config)
        payload = {"prompt": text}
        response = client.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(payload).encode('utf-8'),
            Accept='application/json')
        return response

    def parse_response(query_response):
        response_dict = json.loads(query_response['Body'].read())
        print(response_dict.keys())
        return response_dict['generated_images'], response_dict['prompt']

    def save_image(img_bytes, prmpt):
        plt.figure(figsize=(12, 12))
        plt.imshow(np.array(img_bytes))
        plt.axis('off')
        plt.title(prmpt)
        file_name = f"temp-{uuid.uuid4()}.png"
        plt.savefig(file_name)
        response = s3_client.upload_file(file_name, bucket_name, file_name,  ExtraArgs={
            'ContentType': "image/png"})
        os.remove(file_name)
        return s3_client.generate_presigned_url('get_object', Params={'Bucket': bucket_name, 'Key': file_name}, ExpiresIn=3600)

    return app
