import React, { useEffect, useState } from "react";
import { View, FlatList, Image, StyleSheet, Button } from "react-native";
import { Text, Card, ActivityIndicator } from "react-native-paper";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";

export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(data);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Borrow & Swap</Text>
      <Button title="Logout" onPress={handleLogout} color="#e53935" />
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            )}
            <Card.Content>
              <Text style={styles.title}>{item.title || item.itemName}</Text>
              <Text style={styles.category}>
                {item.category || "Uncategorized"}
              </Text>
              <Text style={styles.price}>
                ₹{item.price || item.rentPrice || "—"}
              </Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: "#10b981",
  },
  card: {
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  image: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  category: {
    fontSize: 14,
    color: "#666",
  },
  price: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "bold",
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
