import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from "firebase/firestore";

const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";

export default function ItemDetailsScreen({ route, navigation }) {
  const { item } = route.params;
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("Loading...");
  const [trustScore, setTrustScore] = useState(null);
  const [loadingTrust, setLoadingTrust] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const toastAnim = useState(new Animated.Value(0))[0];
  const [toastText, setToastText] = useState("");
  const insets = useSafeAreaInsets();

  // ✅ Toast animation
  const showToast = (message) => {
    setToastText(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ✅ Fetch owner data + trust score
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        if (!item.userId) {
          setOwnerName("Unknown Owner");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", item.userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setOwnerName(data.name || "Unknown Owner");
        }

        const res = await fetch(`${BASE_URL}/getUserByUid?uid=${item.userId}`);
        const data = await res.json();
        if (res.ok && data.trustScore !== undefined) {
          setTrustScore(data.trustScore);
        } else {
          setTrustScore("N/A");
        }
      } catch (err) {
        console.error("Error fetching owner data:", err);
        setOwnerName("Unknown Owner");
        setTrustScore("N/A");
      } finally {
        setLoadingTrust(false);
      }
    };
    fetchOwnerData();
  }, [item.userId]);

  // ✅ Check if item is wishlisted (from backend)
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const res = await fetch(`${BASE_URL}/getWishlist?uid=${user.uid}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          const found = data.some((i) => i.id === item.id);
          setWishlisted(found);
        }
      } catch (err) {
        console.error("Error checking wishlist:", err);
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    };
    checkWishlist();
  }, [item.id, fadeAnim]);

  // ✅ Toggle wishlist via backend APIs
  const toggleWishlist = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in first.");

    try {
      if (!wishlisted) {
        const res = await fetch(`${BASE_URL}/addToWishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            itemId: item.id,
          }),
        });

        if (res.ok) {
          setWishlisted(true);
          showToast("✅ Added to Wishlist");
        }
      } else {
        const res = await fetch(`${BASE_URL}/removeFromWishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            itemId: item.id,
          }),
        });

        if (res.ok) {
          setWishlisted(false);
          showToast("❌ Removed from Wishlist");
        }
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  // ✅ Chat with Owner
  const handleChatWithOwner = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to start a chat.");
        return;
      }
      if (user.uid === item.userId) {
        alert("You cannot chat with yourself.");
        return;
      }

      const otherId = item.userId;
      const chatId = [user.uid, otherId].sort().join("_");
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      const introText = `Hi! I'm interested in: ${item.title}`;

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          users: [user.uid, otherId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: introText,
          lastSenderId: user.uid,
          lastMessageAt: serverTimestamp(),
          readBy: { [user.uid]: true, [otherId]: false },
          unreadCount: { [user.uid]: 0, [otherId]: 1 },
        });

        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: introText,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        const msgsRef = collection(db, "chats", chatId, "messages");
        const q = query(msgsRef, where("text", "==", introText));
        const existingIntro = await getDocs(q);

        if (existingIntro.empty) {
          await addDoc(msgsRef, {
            text: introText,
            senderId: user.uid,
            createdAt: serverTimestamp(),
          });

          await updateDoc(chatRef, {
            lastMessage: introText,
            lastSenderId: user.uid,
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            [`readBy.${user.uid}`]: true,
            [`readBy.${otherId}`]: false,
            [`unreadCount.${otherId}`]: increment(1),
          });
        } else {
          await updateDoc(chatRef, {
            updatedAt: serverTimestamp(),
            [`readBy.${user.uid}`]: true,
          });
        }
      }

      navigation.navigate("ChatScreen", {
        otherUserId: otherId,
        itemTitle: item.title,
      });
    } catch (err) {
      console.error("Error starting chat:", err);
      alert("Something went wrong. Try again.");
    }
  };

  // 🌀 Loader
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0A66C2" />
        <Text style={styles.loaderText}>Loading item details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={
              item.imageUrl
                ? { uri: item.imageUrl }
                : require("../assets/category_images/others.png")
            }
            style={styles.image}
          />
          <TouchableOpacity style={styles.heartButton} onPress={toggleWishlist}>
            <Ionicons
              name={wishlisted ? "heart" : "heart-outline"}
              size={28}
              color={wishlisted ? "#e63946" : "#fff"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.category}>{item.category || "Others"}</Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Profile", { uid: item.userId })
            }
          >
            <Text style={styles.ownerText}>
              Posted by:{" "}
              <Text style={styles.ownerNameClickable}>{ownerName}</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.trustRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#0A66C2"
            />
            <Text style={styles.trustText}>
              Trust Score:{" "}
              {loadingTrust
                ? "Loading..."
                : trustScore !== null
                ? trustScore
                : "N/A"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => navigation.navigate("Profile", { uid: item.userId })}
          >
            <Ionicons name="person-circle-outline" size={18} color="#0A66C2" />
            <Text style={styles.viewProfileText}>View Owner Profile</Text>
          </TouchableOpacity>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}/day</Text>
            <View
              style={[
                styles.typeTag,
                {
                  backgroundColor:
                    item.type === "share" ? "#2563EB" : "#16a34a",
                },
              ]}
            >
              <Text style={styles.typeText}>
                {item.type
                  ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
                  : "Rent"}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {item.description || "No description provided."}
          </Text>
        </View>
      </Animated.ScrollView>

      <View
        style={[
          styles.footerContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
        ]}
      >
        <TouchableOpacity style={styles.chatButton} onPress={handleChatWithOwner}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          <Text style={styles.chatText}>Chat with Owner</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.toast,
          {
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastText}>{toastText}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fb" },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  loaderText: { marginTop: 10, color: "#666", fontSize: 16 },
  scrollContainer: { paddingBottom: 100 },
  imageWrapper: { position: "relative", marginTop: 10, marginHorizontal: 10 },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 18,
    resizeMode: "cover",
  },
  heartButton: {
    position: "absolute",
    top: 18,
    right: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
    padding: 8,
  },
  detailsCard: {
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#0A66C2", marginBottom: 4 },
  category: { fontSize: 15, color: "#777", marginBottom: 5 },
  ownerText: { fontSize: 14, color: "#444", marginBottom: 4, fontStyle: "italic" },
  ownerNameClickable: { color: "#0A66C2", fontWeight: "bold" },
  trustRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  trustText: { fontSize: 14, color: "#0A66C2", marginLeft: 6 },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
    marginTop: 4,
  },
  viewProfileText: {
    color: "#0A66C2",
    fontWeight: "600",
    marginLeft: 5,
    fontSize: 14,
  },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10 },
  price: { fontSize: 18, fontWeight: "bold", color: "#16a34a" },
  typeTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  typeText: { color: "#fff", fontWeight: "600" },
  description: { fontSize: 16, color: "#444", lineHeight: 24, marginBottom: 12 },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A66C2",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    elevation: 5,
  },
  chatText: { color: "#fff", fontSize: 17, fontWeight: "bold", marginLeft: 8 },
  toast: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  toastText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
