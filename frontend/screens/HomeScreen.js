import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all items
  const fetchItems = async () => {
    try {
      const response = await fetch(
        "https://us-central1-uniswap-iitrpr.cloudfunctions.net/getItems"
      );
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ Top Action Buttons */}
      <View style={styles.topButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#10b981" }]}
          onPress={() => navigation.navigate("AddItem")}
        >
          <Text style={styles.actionText}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.actionText}>My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 💬 View Chats Button */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#f59e0b", marginBottom: 10 }]}
        onPress={() => navigation.navigate("ChatList")}
      >
        <Text style={styles.actionText}>View My Chats</Text>
      </TouchableOpacity>

      {/* ✅ Item List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("ItemDetails", { itemId: item.id })
            }
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>₹{item.price}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No items found
          </Text>
        }
      />

      {/* 🚪 Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  actionText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  card: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  info: { flex: 1, padding: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  price: { fontSize: 16, color: "green" },
  logoutButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
