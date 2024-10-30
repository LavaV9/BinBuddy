import logging
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from keras.src.utils.image_utils import img_to_array
import io
from PIL import Image

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO)

# Load your trained model
model = tf.keras.models.load_model('C:/Users/tvshe/OneDrive/Desktop/ServerModelForHackathon/waste_classifier.h5')
# Load class indices from the text file
class_indices = {}
with open('class_indices.txt', 'r') as f:
    for line in f:
        key, value = line.strip().split(': ')
        class_indices[key] = int(value)

def preprocess_image(image):
    img = image.resize((150, 150))  # Resize image to match model's input size
    img_array = img_to_array(img) / 255.0  # Normalize image
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    return img_array

@app.route('/', methods=['GET'])
def home():
    return "Flask server is running!"

@app.route('/predict', methods=['POST'])
def predict():
    logging.info("Received a request to /predict")
    
    if 'file' not in request.files:
        logging.error("No file part in the request")
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        logging.error("No selected file")
        return jsonify({'error': 'No selected file'}), 400
    
    logging.info("File received: %s", file.filename)
    logging.info("File content type: %s", file.content_type)

    # Check if the file type is supported
    allowed_content_types = {'image/jpeg', 'image/png', 'image/gif'}
    if file.content_type not in allowed_content_types:
        logging.error("Unsupported file type: %s", file.content_type)
        return jsonify({'error': 'Unsupported file type'}), 400

    try:
        # Log the file size
        logging.info("File size: %d bytes", len(file.read()))  # Log the size of the file
        file.seek(0)  # Reset the file pointer for reading the image

        # Load and preprocess the image
        img = Image.open(io.BytesIO(file.read()))  # Read image from the uploaded file
        img_array = preprocess_image(img)

        # Make predictions
        predictions = model.predict(img_array)

        # Get the predicted class index and confidence
        predicted_class_index = np.argmax(predictions[0])
        predicted_class_label = list(class_indices.keys())[predicted_class_index]
        confidence_score = predictions[0][predicted_class_index]

        logging.info("Prediction: %s (Confidence: %.2f)", predicted_class_label, confidence_score)

        return jsonify({
            'predicted_class': predicted_class_label,
            'confidence': float(confidence_score)  # Convert to float for JSON serialization
        })
    except Exception as e:
        logging.error("Error during prediction: %s", str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
