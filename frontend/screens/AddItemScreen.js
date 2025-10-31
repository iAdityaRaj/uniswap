import { useState } from "react";
import { Alert, Button, ScrollView, StyleSheet, TextInput } from "react-native";
import { auth } from "../firebaseConfig";

export default function AddItemScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddItem = async () => {
    if (!title || !description || !price || !imageUrl) {
      Alert.alert("Missing fields", "Please fill all fields (title, description, price, image URL).");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not signed in", "You must be logged in to add items.");
      return;
    }

    const payload = {
      title,
      description,
      price: parseFloat(price),
      imageUrl,
      // send both keys — backend might expect ownerUid or userId
      userId: user.uid,
      ownerUid: user.uid,
      ownerEmail: user.email || null,
    };

    setLoading(true);
    try {
      console.log("Sending addItem payload:", payload);

      const res = await fetch(
        "https://us-central1-uniswap-iitrpr.cloudfunctions.net/addItem",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text(); // read raw text so we can log anything
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text; // backend didn't return JSON
      }

      console.log("addItem response status:", res.status);
      console.log("addItem response body:", data);

      if (!res.ok) {
        // show backend message if available
        const msg =
          (data && (data.message || data.error || data.msg)) ||
          `Server returned ${res.status}`;
        Alert.alert("Add item failed", msg);
        return;
      }

      // success
      Alert.alert("Success", "Item added successfully!", [
        { text: "OK", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (error) {
      console.error("Network / unexpected error in addItem:", error);
      Alert.alert("Network error", error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} />
      <TextInput
        placeholder="Description"
        style={[styles.input, { height: 100 }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput placeholder="Price" style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TextInput placeholder="Image URL" style={styles.input} value={imageUrl} onChangeText={setImageUrl} />

      <Button title={loading ? "Adding..." : "Add Item"} onPress={handleAddItem} disabled={loading} color="#10b981" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
});
