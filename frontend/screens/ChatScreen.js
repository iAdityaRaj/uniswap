import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, isToday, isYesterday } from "date-fns";
import { auth, db } from "../firebaseConfig";

export default function ChatScreen({ route, navigation }) {
  const { chatId: chatIdParam, ownerId, otherUserId, itemTitle } = route.params || {};
  const me = auth.currentUser;
  const otherId = otherUserId || ownerId;
  const chatId = chatIdParam || [me?.uid, otherId].sort().join("_");

  const insets = useSafeAreaInsets();
  const flatRef = useRef();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherOnline, setOtherOnline] = useState(false);

  // Ensure chat exists
  useEffect(() => {
    const ensureChat = async () => {
      if (!me || !otherId) return;
      const cRef = doc(db, "chats", chatId);
      const snap = await getDoc(cRef);
      if (!snap.exists()) {
        await setDoc(cRef, {
          users: [me.uid, otherId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "",
          lastSenderId: "",
          lastMessageAt: serverTimestamp(),
          readBy: { [me.uid]: true, [otherId]: false },
          unreadCount: { [me.uid]: 0, [otherId]: 0 },
          lastItemTitle: itemTitle || null,
        });
      }
    };
    ensureChat();
  }, [chatId, otherId, itemTitle]);

  // Fetch other user's name and listen to online status
  useEffect(() => {
    if (!otherId) return;
    const userRef = doc(db, "users", otherId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setOtherName(data.name || "Unknown User");
        setOtherOnline(!!data.online);
      }
    });
    return unsub;
  }, [otherId]);

  // Subscribe to messages + mark delivered if other user online
  useEffect(() => {
    if (!me) return;

    const msgsRef = collection(db, "chats", chatId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, async (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(insertDateDividers(arr));

      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        const msg = d.data();

        // if I am receiver and message just sent
        if (msg.to === me?.uid && msg.status === "sent") {
          batch.update(d.ref, { status: "delivered" });
        }

        // if I am sender and other user is online, mark as delivered
        if (msg.senderId === me?.uid && msg.status === "sent" && otherOnline) {
          batch.update(d.ref, { status: "delivered" });
        }
      });
      await batch.commit();

      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    });

    return unsub;
  }, [chatId, otherOnline]);

  // Mark messages as seen when this chat is opened
  useEffect(() => {
    const markSeen = async () => {
      if (!me) return;
      try {
        const msgsRef = collection(db, "chats", chatId, "messages");
        const snap = await getDocs(query(msgsRef));
        const batch = writeBatch(db);
        snap.forEach((d) => {
          const msg = d.data();
          if (msg.to === me?.uid && msg.status !== "seen") {
            batch.update(d.ref, { status: "seen" });
          }
        });
        await batch.commit();

        await updateDoc(doc(db, "chats", chatId), {
          [`readBy.${me.uid}`]: true,
          [`unreadCount.${me.uid}`]: 0,
        });
      } catch (err) {
        console.log("Error marking seen:", err);
      }
    };
    markSeen();
  }, [chatId]);

  // Send message
  const sendMessage = async () => {
    if (!text.trim() || !me) return;
    const trimmed = text.trim();

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: trimmed,
      senderId: me.uid,
      to: otherId,
      createdAt: serverTimestamp(),
      status: "sent",
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: trimmed,
      lastSenderId: me.uid,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`readBy.${me.uid}`]: true,
      [`readBy.${otherId}`]: false,
      [`unreadCount.${otherId}`]: increment(1),
    });

    setText("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Insert date dividers
  const insertDateDividers = (msgs) => {
    const grouped = [];
    let lastDate = "";
    msgs.forEach((msg) => {
      if (!msg.createdAt) return grouped.push(msg);
      const date = msg.createdAt.toDate();
      const dateKey = date.toISOString().slice(0, 10);
      if (dateKey !== lastDate) {
        let label = format(date, "MMM d, yyyy");
        if (isToday(date)) label = "Today";
        else if (isYesterday(date)) label = "Yesterday";
        grouped.push({ type: "divider", id: `divider-${dateKey}`, label });
        lastDate = dateKey;
      }
      grouped.push(msg);
    });
    return grouped;
  };

  // Tick logic
  const getTickIcon = (msg) => {
    if (!msg.status) return { name: "checkmark", color: "#999" };
    if (msg.status === "sent") return { name: "checkmark", color: "#999" };
    if (msg.status === "delivered") return { name: "checkmark-done", color: "#999" };
    if (msg.status === "seen") return { name: "checkmark-done", color: "#34B7F1" };
    return { name: "checkmark", color: "#999" };
  };

  const renderItem = ({ item }) => {
    if (item.type === "divider") {
      return (
        <View style={styles.dividerWrap}>
          <Text style={styles.dividerText}>{item.label}</Text>
        </View>
      );
    }

    const mine = item.senderId === me?.uid;
    const time = item.createdAt?.toDate ? format(item.createdAt.toDate(), "h:mm a") : "";
    const tick = mine ? getTickIcon(item) : null;

    return (
      <View style={[styles.row, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          {mine ? <View style={styles.tailRight} /> : <View style={styles.tailLeft} />}
          <Text style={[styles.txt, mine ? styles.txtMine : styles.txtTheirs]}>{item.text}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>{time}</Text>
            {tick && (
              <Ionicons
                name={tick.name}
                size={18}
                color={tick.color}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.hName} numberOfLines={1}>{otherName}</Text>
          <Text style={styles.hSub}>
            {otherOnline ? "online" : "last seen recently"}
          </Text>
        </View>
      </View>

      {/* Chat body */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.6 }]}
            onPress={sendMessage}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const BG = "#ECE5DD";
const GREEN = "#128C7E";
const DIVIDER_BG = "#DADADA";

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  hName: { color: "#fff", fontSize: 18, fontWeight: "700", maxWidth: 220 },
  hSub: { color: "#dbeafe", fontSize: 12, marginTop: 2, maxWidth: 260 },
  dividerWrap: {
    alignSelf: "center",
    backgroundColor: DIVIDER_BG,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  dividerText: { fontSize: 12, color: "#555", fontWeight: "600" },
  row: { flexDirection: "row", marginVertical: 6 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    position: "relative",
  },
  mine: { backgroundColor: GREEN, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 6 },
  tailRight: {
    position: "absolute",
    right: -3,
    bottom: 0,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderTopColor: "transparent",
    borderLeftWidth: 10,
    borderLeftColor: GREEN,
  },
  tailLeft: {
    position: "absolute",
    left: -3,
    bottom: 0,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderTopColor: "transparent",
    borderRightWidth: 10,
    borderRightColor: "#FFFFFF",
  },
  txt: { fontSize: 16, lineHeight: 22 },
  txtMine: { color: "#fff" },
  txtTheirs: { color: "#111" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 6,
  },
  time: { fontSize: 11 },
  timeMine: { color: "#EAEAEA" },
  timeTheirs: { color: "#555" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: GREEN,
    borderRadius: 22,
    padding: 10,
  },
});