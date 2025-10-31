import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function ChatListScreen() {
  const [conversations, setConversations] = useState([]);
  const user = auth.currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "messages"),
      where("senderId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const partnerId = data.receiverId === user.uid ? data.senderId : data.receiverId;
        if (!chatData[partnerId] || data.createdAt > chatData[partnerId].createdAt) {
          chatData[partnerId] = data;
        }
      });
      setConversations(Object.values(chatData));
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Chats</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() =>
              navigation.navigate("Chat", {
                sellerId: item.receiverId,
                itemId: item.itemId,
              })
            }
          >
            <Text style={styles.chatName}>Chat with: {item.receiverId}</Text>
            <Text style={styles.lastMsg}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  chatItem: {
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  chatName: { fontWeight: "bold", marginBottom: 3 },
  lastMsg: { color: "#555" },
});
        