import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import ItemCard from "../components/ItemCard";
import { auth } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";

export default function MyWishlistScreen({ navigation }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  fetchWishlist();
}, []);
console.log("Fetching wishlist for user:", auth.currentUser?.uid);
const fetchWishlist = async () => {
  setLoading(true);
  try {
    const user = auth.currentUser;
    if (!user) return;
    const res = await fetch(`${BASE_URL}/getWishlist?uid=${user.uid}`);
    const data = await res.json();
    console.log("🔥 Wishlist data:", data);
    setWishlistItems(data);
  } catch (err) {
    console.error("Error fetching wishlist:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchWishlist();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0A66C2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0A66C2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
      </View>

      {wishlistItems.length === 0 ? (
        <Text style={styles.emptyText}>You haven’t added anything yet ❤️</Text>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard item={item} navigation={navigation} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0A66C2",
    marginLeft: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
});