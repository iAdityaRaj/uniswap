const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixChatsStructure() {
  console.log("🚀 Starting Firestore fix...");

  const chatsSnapshot = await db.collection("chats").get();

  for (const chatDoc of chatsSnapshot.docs) {
    const chatData = chatDoc.data();
    const chatId = chatDoc.id;

    if (!Array.isArray(chatData.users) || chatData.users.length !== 2) {
      console.log(`⚠️ Skipping chat ${chatId} — invalid users array`);
      continue;
    }

    const [user1, user2] = chatData.users;

    const updatedChatData = {
      chatId: chatData.chatId || chatId,
      lastMessage: chatData.lastMessage || "",
      lastSenderId: chatData.lastSenderId || "",
      lastMessageAt:
        chatData.updatedAt ||
        chatData.createdAt ||
        admin.firestore.FieldValue.serverTimestamp(),
      unreadCount: {
        [user1]: chatData.unreadCount?.[user1] ?? 0,
        [user2]: chatData.unreadCount?.[user2] ?? 0,
      },
      readBy: {
        [user1]: chatData.readBy?.[user1] ?? false,
        [user2]: chatData.readBy?.[user2] ?? false,
      },
      createdAt:
        chatData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await chatDoc.ref.set(updatedChatData, { merge: true });
    console.log(`✅ Chat updated: ${chatId}`);

    // Fix messages inside this chat
    const messagesRef = chatDoc.ref.collection("messages");
    const messagesSnapshot = await messagesRef.get();

    for (const msgDoc of messagesSnapshot.docs) {
      const msgData = msgDoc.data();

      const receiverId =
        msgData.senderId === user1
          ? user2
          : msgData.senderId === user2
          ? user1
          : null;

      if (!receiverId) {
        console.log(`⚠️ Skipping message ${msgDoc.id} — invalid sender`);
        continue;
      }

      await msgDoc.ref.set(
        {
          receiverId: msgData.receiverId || receiverId,
          read: msgData.read ?? false,
        },
        { merge: true }
      );
    }

    console.log(`📩 Messages updated for chat ${chatId}`);
  }

  console.log("🎉 Firestore fix complete!");
}

fixChatsStructure()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error fixing Firestore:", err);
    process.exit(1);
  });
