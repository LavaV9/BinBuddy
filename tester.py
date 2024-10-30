import tensorflow as tf
from tensorflow.python.keras.models import load_model
from keras.src.utils.image_utils import load_img, img_to_array
import numpy as np

# Load your trained model
model = tf.keras.models.load_model('C:/Users/tvshe/OneDrive/Desktop/ServerModelForHackathon/waste_classifier.h5')

# Load class indices from the text file
class_indices = {}
with open('class_indices.txt', 'r') as f:
    for line in f:
        key, value = line.strip().split(': ')
        class_indices[key] = int(value)

# Test image path
test_image_path = 'wb.jpg'

# Load and preprocess the image
img = load_img(test_image_path, target_size=(150, 150))
img_array = img_to_array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

# Make predictions
predictions = model.predict(img_array)
print(predictions)  # Check predictions

# Get the predicted class index and confidence
predicted_class_index = np.argmax(predictions[0])  # Get the index of the highest prediction
predicted_class_label = list(class_indices.keys())[predicted_class_index]  # Map index to class label
confidence_score = predictions[0][predicted_class_index]  # Confidence score

# Output the result
print(f'Predicted class: {predicted_class_label}, Confidence: {confidence_score:.2f}')
