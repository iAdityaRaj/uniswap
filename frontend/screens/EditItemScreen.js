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
import { db, storage } from "../firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function EditItemScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { item } = route.params;

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(String(item.price));
  const [category, setCategory] = useState(item.category);
  const [image, setImage] = useState(item.imageUrl || null);
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

  // 🔹 Check if any field has actually changed
  const hasChanges = () => {
    return (
      title !== item.title ||
      description !== item.description ||
      price !== String(item.price) ||
      category !== item.category ||
      image !== item.imageUrl
    );
  };

  const handleUpdate = async () => {
    if (!title.trim() || !description.trim() || !price.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill all fields before saving.",
      });
      return;
    }

    if (!hasChanges()) {
      Toast.show({
        type: "info",
        text1: "No changes detected",
        text2: "Update something before saving.",
      });
      return;
    }

    setUploading(true);
    try {
      const itemRef = doc(db, "items", item.id);
      let imageUrl = item.imageUrl || null;

      // 🧩 CASE 1: User removed the image
      if (!image && item.imageUrl) {
        const oldRef = ref(storage, item.imageUrl);
        await deleteObject(oldRef).catch(() => {});
        imageUrl = null;
      }

      // 🧩 CASE 2: User selected a new image
      else if (image && image !== item.imageUrl) {
        if (item.imageUrl) {
          const oldRef = ref(storage, item.imageUrl);
          await deleteObject(oldRef).catch(() => {});
        }

        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `items/${Date.now()}_${title}.jpg`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 🧩 Update Firestore document
      await updateDoc(itemRef, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        imageUrl,
        updatedAt: serverTimestamp(),
      });

      Toast.show({
        type: "success",
        text1: "Item updated successfully!",
      });

      navigation.navigate("Tabs", { screen: "MyAds" });
    } catch (error) {
      console.error("Error updating item:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Item</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Price (₹/day)"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

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
            <Text style={styles.uploadText}>Upload New Image</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (uploading || !hasChanges()) && { opacity: 0.7 },
        ]}
        onPress={handleUpdate}
        disabled={uploading || !hasChanges()}
      >
        <Text style={styles.submitText}>
          {uploading ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
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
  label: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    color: "#555",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  imageButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#0A66C2",
    padding: 14,
    borderRadius: 10,
  },
  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#0A66C2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
