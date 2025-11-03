import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { db, storage, auth } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Toast from "react-native-toast-message";
import { navigationRef } from "../navigationRef";

export default function ShareItemScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Books");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "We need access to your photos.");
      return;
    }

    Alert.alert(
      "Select Image",
      "Do you want to crop the image before uploading?",
      [
        { text: "Crop Image", onPress: async () => openPicker(true) },
        { text: "Use As Is", onPress: async () => openPicker(false) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const openPicker = async (shouldEdit) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: shouldEdit,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => setImage(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill all fields before submitting.",
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;

      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `items/${Date.now()}_${title}.jpg`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      const user = auth.currentUser;
      await addDoc(collection(db, "items"), {
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl,
        userId: user.uid,
        type: "share", // ✅ key difference
        createdAt: serverTimestamp(),
      });

      Toast.show({
        type: "success",
        text1: "Item shared successfully!",
      });

      // ✅ Redirect directly to My Ads tab
      navigationRef.reset({
        index: 0,
        routes: [{ name: "Tabs", state: { routes: [{ name: "MyAds" }] } }],
      });
    } catch (error) {
      console.error("Error adding item:", error);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Share an Item</Text>

      <TextInput
        style={styles.input}
        placeholder="Item Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      {/* Category Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Select Category</Text>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
          style={styles.picker}
        >
          <Picker.Item label="Books" value="Books" />
          <Picker.Item label="Electronics" value="Electronics" />
          <Picker.Item label="Clothing" value="Clothing" />
          <Picker.Item label="Furniture" value="Furniture" />
          <Picker.Item label="Stationery" value="Stationery" />
          <Picker.Item label="Sports" value="Sports" />
          <Picker.Item label="Others" value="Others" />
        </Picker>
      </View>

      {/* Image Upload */}
      <View style={styles.imageContainer}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: "#EF4444" }]}
              onPress={removeImage}
            >
              <Text style={styles.imageButtonText}>Remove</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadText}>Upload Item Image</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, uploading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        <Text style={styles.submitText}>
          {uploading ? "Uploading..." : "Submit"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0A66C2",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
  },
  label: { fontSize: 16, paddingHorizontal: 10, paddingTop: 10, color: "#555" },
  picker: { height: 50, width: "100%" },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  imagePreview: { width: 200, height: 200, borderRadius: 10 },
  imageButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  imageButtonText: { color: "#fff", fontWeight: "600" },
  uploadButton: { backgroundColor: "#0A66C2", padding: 14, borderRadius: 10 },
  uploadText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  submitButton: {
    backgroundColor: "#0A66C2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
