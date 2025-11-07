import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";

export default function ProfileScreen({ navigation, route }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [trustScore, setTrustScore] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // 🟢 detect if viewing self or another user
  const viewingUid = route?.params?.uid || auth.currentUser?.uid;
  const isOwnProfile = viewingUid === auth.currentUser?.uid;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!viewingUid) return;

        const userDoc = await getDoc(doc(db, "users", viewingUid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch trust score from backend
        const res = await fetch(`${BASE_URL}/getUserByUid?uid=${viewingUid}`);
        const data = await res.json();
        if (res.ok && data.trustScore !== undefined) {
          setTrustScore(data.trustScore);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [viewingUid]);

  // 🧠 Fetch Wishlist if own profile
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isOwnProfile) return;
      setLoadingWishlist(true);
      try {
        const res = await fetch(`${BASE_URL}/getWishlist?uid=${viewingUid}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setWishlist(data);
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoadingWishlist(false);
      }
    };

    fetchWishlist();
  }, [isOwnProfile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Toast.show({
        type: "success",
        text1: "Logged out successfully 👋",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: error.message,
      });
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Toast.show({
        type: "error",
        text1: "Name cannot be empty",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, { name: newName.trim() });
      setUserData((prev) => ({ ...prev, name: newName.trim() }));
      setEditing(false);
      setNewName("");

      Toast.show({
        type: "success",
        text1: "Name updated successfully ✅",
      });
    } catch (error) {
      console.error("Error updating name:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update name",
        text2: error.message,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A66C2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      {!isOwnProfile && userData && (
        <Text style={{ textAlign: "center", color: "#666", marginBottom: 10 }}>
          Viewing {userData.name}'s Profile
        </Text>
      )}

      {userData ? (
        <>
          <Text style={styles.label}>Name</Text>

          {isOwnProfile ? (
            editing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter new name"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveName}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setEditing(false);
                    setNewName("");
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.rowBetween}>
                <Text style={styles.value}>{userData.name || "N/A"}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    setNewName(userData.name || "");
                    setEditing(true);
                  }}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <Text style={styles.value}>{userData.name || "N/A"}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userData.email || "N/A"}</Text>

          {/* 🧠 Trust Score Section */}
          <View style={styles.trustContainer}>
            <Text style={styles.trustLabel}>Trust Score</Text>
            <Text
              style={[
                styles.trustValue,
                {
                  color:
                    trustScore >= 10
                      ? "#16A34A"
                      : trustScore >= 5
                      ? "#FACC15"
                      : "#DC2626",
                },
              ]}
            >
              {trustScore !== null ? trustScore : "Loading..."}
            </Text>
          </View>

          {/* ❤️ Wishlist Section */}
          {isOwnProfile && (
            <>
              <Text style={styles.sectionTitle}>My Wishlist ❤️</Text>

              {loadingWishlist ? (
                <ActivityIndicator color="#0A66C2" />
              ) : wishlist.length === 0 ? (
                <Text style={styles.emptyText}>
                  You haven’t added anything yet.
                </Text>
              ) : (
                <FlatList
                  data={wishlist}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.wishlistCard}
                      onPress={() =>
                        navigation.navigate("ItemDetailsScreen", { item })
                      }
                    >
                      <Image
                        source={
                          item.imageUrl
                            ? { uri: item.imageUrl }
                            : require("../assets/category_images/others.png")
                        }
                        style={styles.itemImage}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemPrice}>₹{item.price}/day</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#888"
                      />
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}
        </>
      ) : (
        <Text style={styles.value}>No user data available</Text>
      )}

      {isOwnProfile && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 30,
    textAlign: "center",
  },
  label: { fontSize: 16, color: "#666", marginBottom: 4 },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editBtn: {
    backgroundColor: "#0A66C2",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  editText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  editContainer: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { color: "#666", fontSize: 14 },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#EF4444",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  trustContainer: {
    backgroundColor: "#E8F4FF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  trustLabel: { fontSize: 16, color: "#555", fontWeight: "600" },
  trustValue: { fontSize: 36, fontWeight: "bold", marginTop: 6 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 10,
  },
  wishlistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  itemPrice: { fontSize: 14, color: "#16A34A" },
  emptyText: { color: "#888", textAlign: "center", marginTop: 10 },
});
