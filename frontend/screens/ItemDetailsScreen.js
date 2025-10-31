import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Image, StyleSheet, Text, View } from "react-native";

export default function ItemDetailsScreen({ route, navigation }) {
  const { itemId } = route.params; // ✅ correct param
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(
          `https://us-central1-uniswap-iitrpr.cloudfunctions.net/getItemById?id=${itemId}`
        );
        const data = await response.json();
        console.log("Item details response:", data);
        setItem(data);
      } catch (error) {
        console.error("Error fetching item details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const handleDelete = async () => {
    try {
      await fetch(
        `https://us-central1-uniswap-iitrpr.cloudfunctions.net/deleteItem?id=${itemId}`,
        { method: "DELETE" }
      );
      alert("Item deleted successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Item not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.price}>₹{item.price}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Button title="Delete Item" color="#ef4444" onPress={handleDelete} />
      <Button
      title="Edit Item"
      onPress={() => navigation.navigate("EditItem", { itemId })}
      color="#10b981"
/>
      <Button
  title="Contact Seller"
  onPress={() =>
    navigation.navigate("Chat", { sellerId: item.ownerUid, itemId: item.id })
  }
/>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 250, borderRadius: 10, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  price: { fontSize: 20, color: "green", marginBottom: 10 },
  desc: { fontSize: 16, color: "#555", marginBottom: 20 },
});
