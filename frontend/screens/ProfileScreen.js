import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function ProfileScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const response = await fetch(
          "https://us-central1-uniswap-iitrpr.cloudfunctions.net/getItems"
        );
        const data = await response.json();

        // ✅ Filter only current user's items
        const myItems = data.filter(item => item.ownerUid === user.uid);

        setItems(myItems);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyItems();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Uploaded Items</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>No items uploaded yet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: { fontSize: 22, fontWeight: "bold", marginVertical: 10 },
  card: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 10 },
  info: { flex: 1, marginLeft: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  price: { fontSize: 16, color: "green" },
  empty: { textAlign: "center", color: "gray", marginTop: 20 },
});
