import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  limit,
} from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDistanceToNow } from "date-fns";

export default function ChatsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const me = auth.currentUser;
    if (!me) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("users", "array-contains", me.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        setChats([]);
        setLoading(false);
        return;
      }

      const results = await Promise.all(
        snap.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          const chatId = chatDoc.id;
          const otherId = (chatData.users || []).find((u) => u !== me.uid);
          let otherName = "Unknown";

          try {
            const userDoc = await getDoc(doc(db, "users", otherId));
            if (userDoc.exists()) otherName = userDoc.data().name || "Unknown";
          } catch {}

          // Fetch latest message & status in real time
          const msgsRef = collection(db, "chats", chatId, "messages");
          const msgSnap = await getDocs(
            query(msgsRef, orderBy("createdAt", "desc"), limit(1))
          );

          let lastMsg = null;
          msgSnap.forEach((m) => (lastMsg = { id: m.id, ...m.data() }));

          return {
            id: chatId,
            otherId,
            otherName,
            lastMessage: lastMsg?.text || chatData.lastMessage || "",
            lastSenderId: lastMsg?.senderId || chatData.lastSenderId || "",
            lastStatus: lastMsg?.status || "sent",
            updatedAt: chatData.updatedAt || chatData.lastMessageAt || null,
            unreadCount: chatData.unreadCount?.[me.uid] || 0,
          };
        })
      );

      setChats(results);
      setLoading(false);
    });

    return unsub;
  }, []);

  const renderTick = (chat) => {
    const meId = auth.currentUser?.uid;
    const isMine = chat.lastSenderId === meId;
    if (!isMine) return null;

    if (chat.lastStatus === "sent")
      return (
        <Ionicons
          name="checkmark"
          size={16}
          color="#999"
          style={{ marginRight: 5 }}
        />
      );

    if (chat.lastStatus === "delivered")
      return (
        <Ionicons
          name="checkmark-done"
          size={16}
          color="#999"
          style={{ marginRight: 5 }}
        />
      );

    if (chat.lastStatus === "seen")
      return (
        <Ionicons
          name="checkmark-done"
          size={16}
          color="#34B7F1"
          style={{ marginRight: 5 }}
        />
      );

    return null;
  };

  const renderChat = ({ item }) => {
    const ago = item.updatedAt?.toDate
      ? formatDistanceToNow(item.updatedAt.toDate(), { addSuffix: true })
      : "";

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          navigation.navigate("ChatScreen", {
            chatId: item.id,
            otherUserId: item.otherId,
          })
        }
      >
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={48} color="#0A66C2" />
        </View>

        <View style={styles.centerCol}>
          <Text style={styles.name} numberOfLines={1}>
            {item.otherName}
          </Text>

          <View style={styles.lastRow}>
            {renderTick(item)}
            <Text
              style={[
                styles.lastMessage,
                item.unreadCount > 0 ? styles.bold : null,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || "No messages yet"}
            </Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          {!!ago && <Text style={styles.time}>{ago}</Text>}
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerLoad}>
        <ActivityIndicator size="large" color="#0A66C2" />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 40 }]}>
        <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTxt}>No chats yet.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <FlatList
        data={chats}
        keyExtractor={(it) => it.id}
        renderItem={renderChat}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f8f9fb" },
  listPad: { padding: 12, paddingBottom: 24 },
  centerLoad: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center" },
  emptyTxt: { marginTop: 8, color: "#999" },

  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  avatar: { marginRight: 12 },
  centerCol: { flex: 1 },
  rightCol: { alignItems: "flex-end", minWidth: 56 },
  name: { fontSize: 16, fontWeight: "700", color: "#0A66C2" },
  lastRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  lastMessage: { fontSize: 14, color: "#444", flexShrink: 1 },
  bold: { fontWeight: "700", color: "#111" },
  time: { fontSize: 11, color: "#777", marginBottom: 6 },
  badge: {
    backgroundColor: "#0A66C2",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
});