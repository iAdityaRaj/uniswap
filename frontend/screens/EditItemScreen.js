import { useEffect, useState } from "react";
import { Alert, Button, ScrollView, StyleSheet, TextInput } from "react-native";

export default function EditItemScreen({ route, navigation }) {
  const { itemId } = route.params;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(
          `https://us-central1-uniswap-iitrpr.cloudfunctions.net/getItemById?id=${itemId}`
        );
        const data = await response.json();
        setTitle(data.title || "");
        setDescription(data.description || "");
        setPrice(data.price ? data.price.toString() : "");
      } catch (error) {
        console.error("Error fetching item:", error);
        Alert.alert("Error", "Unable to fetch item details");
      }
    };
    fetchItem();
  }, [itemId]);

  const handleUpdate = async () => {
    if (!title || !description || !price) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      const response = await fetch(
        `https://us-central1-uniswap-iitrpr.cloudfunctions.net/updateItem?id=${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            price: parseFloat(price),
          }),
        }
      );

      if (!response.ok) throw new Error("Update failed");
      Alert.alert("Success", "Item updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <Button title="Update Item" onPress={handleUpdate} color="#10b981" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
  },
});
