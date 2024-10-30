import os
import numpy as np
import tensorflow as tf
from keras.src.legacy.preprocessing.image import ImageDataGenerator
from keras.src.applications import mobilenet_v2
from keras.src.layers import Dense, Dropout, GlobalAveragePooling2D, BatchNormalization
from keras.src.models import Sequential

# Set up paths
dataset_path = r"C:\Users\tvshe\OneDrive\Desktop\TrashStar\archive(1)\garbage_classification"

# Data augmentation to enhance generalization
train_datagen = ImageDataGenerator(
    rescale=1.0/255.0,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    validation_split=0.2
)

train_generator = train_datagen.flow_from_directory(
    dataset_path,
    target_size=(150, 150),
    batch_size=32,
    class_mode='categorical',
    subset='training'
)

validation_generator = train_datagen.flow_from_directory(
    dataset_path,
    target_size=(150, 150),
    batch_size=32,
    class_mode='categorical',
    subset='validation'
)

# Build model with transfer learning (using MobileNetV2 as base)
def build_model():
    base_model = mobilenet_v2.MobileNetV2(input_shape=(150, 150, 3), include_top=False, weights='imagenet')
    base_model.trainable = False  # Freeze the base model layers

    model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        BatchNormalization(),
        Dropout(0.3),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(len(train_generator.class_indices), activation='softmax')  # Match the number of classes
    ])
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

# Train the model with a learning rate scheduler
model = build_model()
callback = tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1, min_lr=1e-6)

model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=15,
    callbacks=[callback]
)

# Save the model
model.save('waste_classifier.h5')

# Save class indices to a text file
class_indices = train_generator.class_indices
with open('class_indices.txt', 'w') as f:
    for key, value in class_indices.items():
        f.write(f'{key}: {value}\n')

# Convert the model to TensorFlow Lite format
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

# Save the TFLite model to disk
with open('waste_classifier.tflite', 'wb') as f:
    f.write(tflite_model)

print("Model training complete, model and class indices saved successfully.")
