import React, { useState } from "react";
import { Text, View, Button, Image, StyleSheet, Alert, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';

const Tab = createBottomTabNavigator();

const rewards = [
  { id: 1, name: 'Candy', points: 1},
  { id: 2, name: 'Free Pencil', points: 10 },
  { id: 3, name: 'Free Drink', points: 100 },
];

export default function App() {
  const [requestCount, setRequestCount] = useState(0); // State to track total points
  const [scannedItemsCount, setScannedItemsCount] = useState(0); // State to track total scanned items

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#046A38',
          paddingBottom: 10,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          color: '#FFFFFF',
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Description" 
        component={DescriptionScreen} 
        options={{
          tabBarLabel: 'Description',
          tabBarIcon: () => <Icon name="information-circle-outline" size={24} color="#fbbbad" />,
        }} 
      />
      <Tab.Screen 
        name="Camera" 
        options={{
          tabBarLabel: 'Camera',
          tabBarIcon: () => <Icon name="camera" size={24} color="#fbbbad" />,
        }}
      >
        {() => <CameraScreen setRequestCount={setRequestCount} setScannedItemsCount={setScannedItemsCount} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile" 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Icon name="person-circle-outline" size={24} color="#fbbbad" />,
        }}
      >
        {() => <ProfileScreen requestCount={requestCount} scannedItemsCount={scannedItemsCount} rewards={rewards} setRequestCount={setRequestCount} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function CameraScreen({ setRequestCount, setScannedItemsCount }: { setRequestCount: React.Dispatch<React.SetStateAction<number>>, setScannedItemsCount: React.Dispatch<React.SetStateAction<number>> }) {
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access the camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (result && !result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);
      await uploadImage(uri);  // Call uploadImage function here
    } else {
      Alert.alert("No photo was taken or an error occurred.");
    }
  };

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      type: "image/jpeg",
      name: "photo.jpg",
    } as any);

    try {
      const serverIp = "http://10.107.156.179:5000/predict";
      const response = await fetch(serverIp, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        alert("Failed to upload the image. Server responded with an error.");
        return;
      }

      const data = await response.json();
      if (data.predicted_class) {
        setPrediction(data.predicted_class);
        setConfidence(data.confidence);
        setRequestCount(prevCount => prevCount + 1); // Increment request count here
        setScannedItemsCount(prevCount => prevCount + 1); // Increment scanned items count

        // Now handle user input based on the prediction
        handleUserInput(data.predicted_class);
      } else {
        alert("Error predicting the image.");
      }
    } catch (error) {
      alert("Failed to upload the image.");
    }
  };

  const handleUserInput = (item: string) => {
    let question = '';
    let message = '';
  
    // Define the question and the corresponding message
    switch (item) {
      case "shoes":
        question = "Are the shoes in good condition?";
        break;
      case "clothes":
        question = "Are the clothes in good condition?";
        break;
      case "brown-glass":
      case "green-glass":
      case "white-glass":
        question = "Is the glass broken?";
        break;
      case "battery":
        message = "Batteries need special handling. Please drop them off at designated battery recycling centers.";
        break;
      case "biological":
        question = "Is it fresh and untampered?";
        break;
      case "cardboard":
        question = "Is it flattened and clean?";
        break;
      case "metal":
        question = "Is this a can?";
        break;
      case "plastic":
        question = "Is it a bottle or carton?";
        break;
      case "paper":
        question = "Is it paper packaging or a box?";
        break;
      default:
        message = "Item not recognized. Please try again with a different description.";
        break;
        
    }
  
    // Define the response handlers
    const handlePositiveResponse = (item: string) => {
      let positiveMessage = '';
      switch (item) {
        case "shoes":
          positiveMessage = "Great! You confirmed that the shoes are in good condition and suitable for donation.";
          break;
        case "clothes":
          positiveMessage = "Great! The clothes are in good condition and can be donated.";
          break;
        case "brown-glass":
        case "green-glass":
        case "white-glass":
          positiveMessage = "Great! The glass is intact and can be recycled.";
          break;
        case "biological":
          positiveMessage = "Great! The biological waste is fresh and can be composted.";
          break;
        case "cardboard":
          positiveMessage = "Great! The cardboard is clean and can be recycled.";
          break;
        case "metal":
          positiveMessage = "Great! This metal can be recycled.";
          break;
        case "plastic":
          positiveMessage = "Great! This plastic is recyclable.";
          break;
        case "paper":
          positiveMessage = "Great! This paper is suitable for recycling.";
          break;
        default:
          positiveMessage = "Great! This item is suitable for recycling.";
          break;
      }
      Alert.alert("Great!", positiveMessage);
      // Additional logic for positive response, like awarding points
    };
  
    const handleNegativeResponse = (item: string) => {
      let negativeMessage = '';
      switch (item) {
        case "shoes":
          negativeMessage = "Thanks for checking! The shoes are not suitable for donation.";
          break;
        case "clothes":
          negativeMessage = "Thanks for checking! The clothes are not suitable for donation.";
          break;
        case "brown-glass":
        case "green-glass":
        case "white-glass":
          negativeMessage = "Thanks for checking! The glass is broken and cannot be recycled.";
          break;
        case "biological":
          negativeMessage = "Thanks for checking! The biological waste should not be composted.";
          break;
        case "cardboard":
          negativeMessage = "Thanks for checking! The cardboard is not clean and cannot be recycled.";
          break;
        case "metal":
          negativeMessage = "Thanks for checking! This metal can’t be recycled as it is not a can.";
          break;
        case "plastic":
          negativeMessage = "Thanks for checking! This plastic is not recyclable.";
          break;
        case "paper":
          negativeMessage = "Thanks for checking! This paper packaging is not recyclable.";
          break;
        default:
          negativeMessage = "Thanks for checking! This item is not suitable for recycling.";
          break;
      }
      Alert.alert("Thanks for checking!", negativeMessage);
      // Additional logic for negative response
    };
  
    // Handle the alert logic
    if (message) {
      Alert.alert("Result", message);
    } else if (question) {
      Alert.alert("Condition Check", question, [
        {
          text: "Yes",
          onPress: () => handlePositiveResponse(item),
          style: "default", // You can change this style if needed
        },
        {
          text: "No",
          onPress: () => handleNegativeResponse(item),
        },
      ]);
    }
  };
  

  // ... (Rest of the existing functions remain unchanged, such as handlePositiveResponse and handleNegativeResponse)

  return (
    <LinearGradient colors={['#046A38', '#B9975B']} style={styles.container}>
      <Animatable.View animation="fadeInUp" style={styles.cameraContainer}>
        <Button title="Take Photo" onPress={takePhoto} color="#ee8695" />
        {image && <Image source={{ uri: image }} style={styles.image} />}
        {prediction && confidence !== null && (
          <Text style={styles.resultText}>
            Predicted: {prediction} (Confidence: {confidence.toFixed(2)})
          </Text>
        )}
      </Animatable.View>
    </LinearGradient>
  );
}


function ProfileScreen({ requestCount, scannedItemsCount, rewards, setRequestCount }: { requestCount: number, scannedItemsCount: number, rewards: any[], setRequestCount: React.Dispatch<React.SetStateAction<number>> }) {
  const redeemReward = (points: number) => {
    if (requestCount >= points) {
      setRequestCount(prevCount => prevCount - points);
      Alert.alert("Reward Redeemed!", `You have redeemed your reward for ${points} points.`);
    } else {
      Alert.alert("Insufficient Points", "You don't have enough points to redeem this reward.");
    }
  };

  return (
    <LinearGradient colors={['#27251F', '#046A38']} style={styles.profileContainer}>
      <Text style={styles.profileText}>Points: {requestCount}</Text>
      <Text style={styles.profileText}>Items Scanned: {scannedItemsCount}</Text>
      <Text style={styles.rewardText}>Rewards:</Text>
      {rewards.map(reward => (
        <Animatable.View key={reward.id} animation="fadeIn" style={styles.rewardContainer}>
          <TouchableOpacity onPress={() => redeemReward(reward.points)} style={styles.rewardButton}>
            <Text style={styles.rewardButtonText}>{reward.name} - {reward.points} points</Text>
          </TouchableOpacity>
        </Animatable.View>
      ))}
    </LinearGradient>
  );
}

function DescriptionScreen() {
  return (
    <LinearGradient colors={['#B9975B', '#FFFFFF']} style={styles.descriptionContainer}>
      <Text style={styles.descriptionText}>
        UNC Charlotte students have access to the Waste Wizard, yet many rarely use it. With BinBuddy, you’re making sustainability a priority. Recycling isn’t always black and white; contamination can prevent recyclables from being reused. This app is designed to simplify that process, making it easy for you to contribute to a cleaner, greener campus.
      </Text>
      <Text style={styles.descriptionText}>
        Every recycled item isn’t just a step toward a cleaner campus but a contribution to a brighter future. With every point, you’re reducing waste and nurturing a more sustainable campus community. Imagine the ripple effects: less waste, more resources saved, and a campus that’s greener for every Niner who cares. 🌎
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cameraContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  image: {
    width: 250,
    height: 250,
    marginTop: 16,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#046A38',
  },
  resultText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: '#B9975B',
  },
  profileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  profileText: {
    fontSize: 20,
    color: '#B9975B',
    fontWeight: 'bold',
  },
  rewardText: {
    fontSize: 18,
    color: '#B9975B',
    marginVertical: 10,
  },
  rewardContainer: {
    marginVertical: 5,
  },
  rewardButton: {
    backgroundColor: '#046A38',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rewardButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
  },
  descriptionText: {
    fontSize: 18,
    textAlign: "center",
    color: '#046A38',
  },
});
