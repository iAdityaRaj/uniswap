import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  increment,
} from "firebase/firestore";

export default function ItemDetailsScreen({ route, navigation }) {
  const { item } = route.params;
  const insets = useSafeAreaInsets();
  const [ownerName, setOwnerName] = useState("Loading...");
  const [trustScore, setTrustScore] = useState(null);
  const [loadingTrust, setLoadingTrust] = useState(true);

  const postedDate =
    item.createdAt?.toDate?.()
      ? item.createdAt.toDate().toDateString()
      : "N/A";

  // ✅ Fetch owner name and trust score
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
        } else {
          setOwnerName("Unknown Owner");
        }

        // 🧠 Fetch trust score from backend
        const res = await fetch(
          `https://us-central1-uniswap-iitrpr.cloudfunctions.net/getUserByUid?uid=${item.userId}`
        );
        const data = await res.json();
        if (res.ok && data.trustScore !== undefined) {
          setTrustScore(data.trustScore);
        } else {
          setTrustScore("N/A");
        }
      } catch (error) {
        console.error("Error fetching owner data:", error);
        setOwnerName("Unknown Owner");
        setTrustScore("N/A");
      } finally {
        setLoadingTrust(false);
      }
    };
    fetchOwnerData();
  }, [item.userId]);

  // ✅ Handle starting or reusing a chat
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
          lastItemTitle: item.title,
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
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={
            item.imageUrl
              ? { uri: item.imageUrl }
              : require("../assets/category_images/others.png")
          }
          style={styles.image}
        />
        <View style={styles.detailsCard}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.category}>{item.category}</Text>

          {/* 🧍 Owner + Trust Score */}
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

          {/* ⭐ Trust Score */}
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

          {/* 👤 View Profile button */}
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => navigation.navigate("Profile", { uid: item.userId })}
          >
            <Ionicons
              name="person-circle-outline"
              size={18}
              color="#0A66C2"
            />
            <Text style={styles.viewProfileText}>View Owner Profile</Text>
          </TouchableOpacity>

          <View style={styles.priceRow}>
            {item.price && <Text style={styles.price}>₹{item.price}/day</Text>}
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {item.description || "No description provided."}
            </Text>
          </View>

          <Text style={styles.postedOn}>Posted on {postedDate}</Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footerContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
        ]}
      >
        <TouchableOpacity style={styles.chatButton} onPress={handleChatWithOwner}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color="#fff"
          />
          <Text style={styles.chatText}>Chat with Owner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fb" },
  scrollContainer: { paddingBottom: 130, paddingHorizontal: 15 },
  image: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
    borderRadius: 16,
    marginTop: 10,
  },
  detailsCard: {
    backgroundColor: "#fff",
    marginTop: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
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
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#111", marginBottom: 6 },
  description: { fontSize: 15, color: "#444", lineHeight: 22 },
  postedOn: { color: "#888", fontSize: 13, marginTop: 8 },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A66C2",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 5,
  },
  chatText: { color: "#fff", fontSize: 17, fontWeight: "bold", marginLeft: 8 },
});
