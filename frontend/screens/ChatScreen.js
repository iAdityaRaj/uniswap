// import React, { useEffect, useState, useRef, useMemo } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   collection,
//   addDoc,
//   query,
//   orderBy,
//   onSnapshot,
//   serverTimestamp,
//   doc,
//   getDoc,
//   setDoc,
//   updateDoc,
//   increment,
//   writeBatch,
//   getDocs,
// } from "firebase/firestore";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { format, isToday, isYesterday } from "date-fns";
// import { auth, db } from "../firebaseConfig";

// const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";
// const GREEN = "#128C7E";

// export default function ChatScreen({ route, navigation }) {
//   const { chatId: chatIdParam, otherUserId, item, itemId: itemIdParam, itemTitle: itemTitleParam } =
//     route.params || {};

//   const me = auth.currentUser;
//   const otherId = otherUserId;
//   const chatId = chatIdParam || (me && otherId ? [me.uid, otherId].sort().join("_") : null);
//   const flatRef = useRef();
//   const insets = useSafeAreaInsets();

//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState("");
//   const [otherName, setOtherName] = useState("");
//   const [otherOnline, setOtherOnline] = useState(false);
//   const [showPicker, setShowPicker] = useState(false);
//   const [startDate, setStartDate] = useState(new Date());
//   const [endDate, setEndDate] = useState(new Date());
//   const [fetchedItem, setFetchedItem] = useState(null);
//   const [proposalOwnerId, setProposalOwnerId] = useState(null); // ✅ fallback owner id

//   // ✅ Always use either passed or fetched item
//   const currentItem = item || fetchedItem;
//   const itemId = itemIdParam || currentItem?.id || currentItem?.itemId || null;
//   const itemTitle = itemTitleParam || currentItem?.title || currentItem?.itemTitle || "";

//   // ✅ Ownership check
//   const isOwner = useMemo(() => {
//     if (!me || !currentItem) return false;
//     return me.uid === currentItem.userId || me.uid === currentItem.ownerId;
//   }, [me, currentItem]);

//   // ✅ Ensure chat exists
//   useEffect(() => {
//     const ensureChat = async () => {
//       if (!me || !otherId || !chatId) return;
//       const ref = doc(db, "chats", chatId);
//       const snap = await getDoc(ref);
//       if (!snap.exists()) {
//         await setDoc(ref, {
//           users: [me.uid, otherId],
//           createdAt: serverTimestamp(),
//           updatedAt: serverTimestamp(),
//           lastMessage: "",
//           lastSenderId: "",
//           readBy: { [me.uid]: true, [otherId]: false },
//           unreadCount: { [me.uid]: 0, [otherId]: 0 },
//         });
//       }
//     };
//     ensureChat();
//   }, [me, otherId, chatId]);

//   // ✅ Fetch other user info
//   useEffect(() => {
//     if (!otherId) return;
//     const unsub = onSnapshot(doc(db, "users", otherId), (snap) => {
//       if (snap.exists()) {
//         const d = snap.data();
//         setOtherName(d.name || "Unknown");
//         setOtherOnline(!!d.online);
//       }
//     });
//     return unsub;
//   }, [otherId]);

//   // ✅ Subscribe to messages (and capture proposal owner)
//   useEffect(() => {
//     if (!chatId) return;

//     const msgsRef = collection(db, "chats", chatId, "messages");
//     const q = query(msgsRef, orderBy("createdAt", "asc"));

//     const unsub = onSnapshot(q, async (snap) => {
//       const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

//       // 🧠 PREEMPTIVE item fetch + record owner
//       const proposalMsg = arr.find((m) => m.type === "rental_proposal" && m.itemId);
//       if (proposalMsg) {
//         setProposalOwnerId(proposalMsg.to); // ✅ Save owner for fallback
//         if (!currentItem && !fetchedItem) {
//           try {
//             const itemDoc = await getDoc(doc(db, "items", proposalMsg.itemId));
//             if (itemDoc.exists()) {
//               setFetchedItem({ id: proposalMsg.itemId, ...itemDoc.data() });
//             } else {
//               setFetchedItem({ id: proposalMsg.itemId, title: proposalMsg.itemTitle });
//             }
//           } catch (err) {
//             console.log("⚠️ Failed to prefetch item:", err);
//           }
//         }
//       }

//       setMessages(insertDateDividers(arr));
//       setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
//     });

//     return () => unsub();
//   }, [chatId, currentItem, fetchedItem]);

//   // ✅ Mark messages as seen
//   useEffect(() => {
//     if (!chatId || !me) return;
//     const markSeen = async () => {
//       const msgsRef = collection(db, "chats", chatId, "messages");
//       const snap = await getDocs(msgsRef);
//       const batch = writeBatch(db);
//       snap.forEach((d) => {
//         const msg = d.data();
//         if (msg.to === me.uid && msg.status !== "seen") {
//           batch.update(d.ref, { status: "seen" });
//         }
//       });
//       await batch.commit();
//       await updateDoc(doc(db, "chats", chatId), {
//         [`readBy.${me.uid}`]: true,
//         [`unreadCount.${me.uid}`]: 0,
//       });
//     };
//     markSeen();
//   }, [chatId, me]);

//   // ✅ Insert date dividers
//   const insertDateDividers = (msgs) => {
//     const grouped = [];
//     let lastDate = "";
//     msgs.forEach((m) => {
//       if (!m.createdAt) return grouped.push(m);
//       const date = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
//       const key = date.toISOString().slice(0, 10);
//       if (key !== lastDate) {
//         let label = format(date, "MMM d, yyyy");
//         if (isToday(date)) label = "Today";
//         else if (isYesterday(date)) label = "Yesterday";
//         grouped.push({ id: `divider-${key}`, type: "divider", label });
//         lastDate = key;
//       }
//       grouped.push(m);
//     });
//     return grouped;
//   };

//   // ✅ Send text message
//   const sendMessage = async () => {
//     if (!text.trim()) return;
//     const trimmed = text.trim();
//     await addDoc(collection(db, "chats", chatId, "messages"), {
//       text: trimmed,
//       senderId: me.uid,
//       to: otherId,
//       createdAt: serverTimestamp(),
//       status: "sent",
//       type: "text",
//     });
//     await updateDoc(doc(db, "chats", chatId), {
//       lastMessage: trimmed,
//       lastSenderId: me.uid,
//       lastMessageAt: serverTimestamp(),
//       [`unreadCount.${otherId}`]: increment(1),
//     });
//     setText("");
//   };

//   // ✅ Send rental proposal
//   const sendRentalProposal = async () => {
//     if (!itemId) return Alert.alert("Error", "This chat has no associated item.");
//     if (endDate < startDate) return Alert.alert("Error", "End date cannot be before start date.");

//     const readableStart = startDate.toDateString();
//     const readableEnd = endDate.toDateString();

//     await addDoc(collection(db, "chats", chatId, "messages"), {
//       type: "rental_proposal",
//       senderId: me.uid,
//       to: otherId,
//       itemId,
//       itemTitle,
//       itemImage: item?.imageUrl || null,
//       startDate: startDate.toISOString(),
//       endDate: endDate.toISOString(),
//       status: "pending",
//       createdAt: serverTimestamp(),
//       text: `Rental proposal for "${itemTitle}" (${readableStart} → ${readableEnd})`,
//     });

//     await updateDoc(doc(db, "chats", chatId), {
//       lastMessage: "📦 Rental proposal sent",
//       lastSenderId: me.uid,
//       lastMessageAt: serverTimestamp(),
//       [`unreadCount.${otherId}`]: increment(1),
//     });

//     setShowPicker(false);
//   };

//   // ✅ Handle proposal accept/reject
//   const handleProposalAction = async (m, status) => {
//     const msgRef = doc(db, "chats", chatId, "messages", m.id);
//     await updateDoc(msgRef, { status });

//     const sysText =
//       status === "accepted"
//         ? `✅ Proposal accepted for "${m.itemTitle}" (${new Date(m.startDate).toDateString()} → ${new Date(m.endDate).toDateString()})`
//         : `❌ Proposal rejected for "${m.itemTitle}"`;

//     await addDoc(collection(db, "chats", chatId, "messages"), {
//       text: sysText,
//       senderId: me.uid,
//       to: m.senderId,
//       createdAt: serverTimestamp(),
//       type: "system",
//     });

//     await updateDoc(doc(db, "chats", chatId), {
//       lastMessage: sysText,
//       lastSenderId: me.uid,
//       lastMessageAt: serverTimestamp(),
//       [`unreadCount.${m.senderId}`]: increment(1),
//     });

//     if (status === "accepted") {
//       await fetch(`${BASE_URL}/createRental`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           itemId: m.itemId,
//           borrowerId: m.senderId,
//           lenderId: me.uid,
//           startDate: m.startDate,
//           endDate: m.endDate,
//           itemTitle: m.itemTitle,
//           itemImage: m.itemImage || item?.imageUrl || null,
//         }),
//       });
//     }
//   };

//   // ✅ Render message
//   const renderMessage = ({ item: m }) => {
//     if (m.type === "divider")
//       return (
//         <View style={styles.dividerWrap}>
//           <Text style={styles.dividerText}>{m.label}</Text>
//         </View>
//       );

//     if (m.type === "rental_proposal") {
//       const mine = m.senderId === me.uid;
//       const isMeOwner =
//         me?.uid === m.to ||
//         me?.uid === proposalOwnerId ||
//         me?.uid === currentItem?.ownerId ||
//         me?.uid === currentItem?.userId;

//       const showOwnerActions = m.status === "pending" && isMeOwner && !mine;

//       return (
//         <View style={[styles.row, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
//           <View style={[styles.proposalCard, mine ? styles.mineProposal : styles.theirsProposal]}>
//             <Text style={styles.proposalTitle}>🧾 Rental Proposal</Text>
//             <Text style={styles.proposalText}>Item: {m.itemTitle}</Text>
//             <Text style={styles.proposalText}>
//               {new Date(m.startDate).toLocaleDateString()} →{" "}
//               {new Date(m.endDate).toLocaleDateString()}
//             </Text>

//             {showOwnerActions && (
//               <View style={styles.proposalActions}>
//                 <TouchableOpacity
//                   style={[styles.btn, { backgroundColor: "#16A34A" }]}
//                   onPress={() => handleProposalAction(m, "accepted")}
//                 >
//                   <Text style={styles.btnText}>Accept</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={[styles.btn, { backgroundColor: "#DC2626" }]}
//                   onPress={() => handleProposalAction(m, "rejected")}
//                 >
//                   <Text style={styles.btnText}>Reject</Text>
//                 </TouchableOpacity>
//               </View>
//             )}

//             {m.status === "accepted" && (
//               <Text style={[styles.proposalStatus, { color: "#16A34A" }]}>✅ Accepted</Text>
//             )}
//             {m.status === "rejected" && (
//               <Text style={[styles.proposalStatus, { color: "#DC2626" }]}>❌ Rejected</Text>
//             )}
//           </View>
//         </View>
//       );
//     }

//     const mine = m.senderId === me.uid;
//     const time = m.createdAt?.toDate ? format(m.createdAt.toDate(), "h:mm a") : "";

//     return (
//       <View style={[styles.row, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
//         <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
//           <Text style={[styles.txt, mine ? styles.txtMine : styles.txtTheirs]}>{m.text}</Text>
//           <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>{time}</Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <View style={[styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={22} color="#fff" />
//         </TouchableOpacity>
//         <View style={{ marginLeft: 10 }}>
//           <Text style={styles.hName}>{otherName}</Text>
//           <Text style={styles.hSub}>{otherOnline ? "online" : "last seen recently"}</Text>
//         </View>
//       </View>

//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//       >
//         <FlatList
//           ref={flatRef}
//           data={messages}
//           keyExtractor={(it) => it.id}
//           renderItem={renderMessage}
//           contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
//         />

//         {/* 📦 Borrower Proposal Button */}
//         {!isOwner && itemId && (
//           !showPicker ? (
//             <TouchableOpacity
//               style={styles.proposeBtn}
//               onPress={() => setShowPicker(true)}
//             >
//               <Ionicons name="cube-outline" size={18} color="#fff" />
//               <Text style={styles.proposeTxt}>Propose Rental</Text>
//             </TouchableOpacity>
//           ) : (
//             <View style={styles.datePickerWrap}>
//               <Text style={styles.dateLabel}>Select dates:</Text>
//               <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => d && setStartDate(d)} />
//               <DateTimePicker value={endDate} mode="date" display="default" onChange={(e, d) => d && setEndDate(d)} />
//               <TouchableOpacity style={styles.confirmBtn} onPress={sendRentalProposal}>
//                 <Text style={styles.confirmTxt}>Send Proposal</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setShowPicker(false)}>
//                 <Text style={{ color: "#666" }}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           )
//         )}

//         {/* 💬 Input bar */}
//         <View style={styles.inputBar}>
//           <TextInput
//             style={styles.input}
//             placeholder="Message..."
//             placeholderTextColor="#888"
//             value={text}
//             onChangeText={setText}
//           />
//           <TouchableOpacity
//             style={[styles.sendBtn, !text.trim() && { opacity: 0.6 }]}
//             onPress={sendMessage}
//           >
//             <Ionicons name="send" size={18} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrap: { flex: 1, backgroundColor: "#ECE5DD" },
//   header: { backgroundColor: GREEN, padding: 12, flexDirection: "row", alignItems: "center" },
//   hName: { color: "#fff", fontSize: 18, fontWeight: "700" },
//   hSub: { color: "#dbeafe", fontSize: 12 },
//   dividerWrap: { alignSelf: "center", backgroundColor: "#DADADA", borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, marginVertical: 8 },
//   dividerText: { fontSize: 12, color: "#555", fontWeight: "600" },
//   row: { flexDirection: "row", marginVertical: 6 },
//   bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
//   mine: { backgroundColor: GREEN },
//   theirs: { backgroundColor: "#fff" },
//   txt: { fontSize: 16, lineHeight: 22 },
//   txtMine: { color: "#fff" },
//   txtTheirs: { color: "#111" },
//   time: { fontSize: 11, marginTop: 6, alignSelf: "flex-end" },
//   timeMine: { color: "#EAEAEA" },
//   timeTheirs: { color: "#555" },
//   inputBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 1, borderColor: "#e5e7eb" },
//   input: { flex: 1, backgroundColor: "#f1f5f9", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, fontSize: 16 },
//   sendBtn: { marginLeft: 8, backgroundColor: GREEN, borderRadius: 22, padding: 10 },
//   proposeBtn: { position: "absolute", bottom: 90, alignSelf: "center", flexDirection: "row", backgroundColor: GREEN, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, alignItems: "center"},
//     proposeTxt: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
//   datePickerWrap: {
//     position: "absolute",
//     bottom: 90,
//     alignSelf: "center",
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 12,
//     elevation: 4,
//     alignItems: "center",
//   },
//   dateLabel: { fontWeight: "600", marginBottom: 10 },
//   confirmBtn: {
//     marginTop: 12,
//     backgroundColor: GREEN,
//     borderRadius: 22,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//   },
//   confirmTxt: { color: "#fff", fontWeight: "600" },
//   proposalCard: {
//     maxWidth: "80%",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 12,
//     marginVertical: 6,
//   },
//   mineProposal: { backgroundColor: "#DCF8C6" },
//   theirsProposal: { backgroundColor: "#fff" },
//   proposalTitle: { fontWeight: "700", fontSize: 15, marginBottom: 6, color: "#0A66C2" },
//   proposalText: { fontSize: 14, color: "#333", marginBottom: 4 },
//   proposalActions: { flexDirection: "row", marginTop: 8 },
//   btn: {
//     flex: 1,
//     paddingVertical: 8,
//     borderRadius: 8,
//     alignItems: "center",
//     marginHorizontal: 6,
//   },
//   btnText: { color: "#fff", fontWeight: "700" },
//   proposalStatus: { fontWeight: "600", marginTop: 8, textAlign: "right" },
// });






import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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

const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";
const GREEN = "#128C7E";

export default function ChatScreen({ route, navigation }) {
  const {
    chatId: chatIdParam,
    otherUserId,
    item,
    itemId: itemIdParam,
    itemTitle: itemTitleParam,
  } = route.params || {};

  const me = auth.currentUser;
  const otherId = otherUserId;
  const chatId =
    chatIdParam || (me && otherId ? [me.uid, otherId].sort().join("_") : null);
  const flatRef = useRef();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherOnline, setOtherOnline] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [fetchedItem, setFetchedItem] = useState(null);
  const [proposalOwnerId, setProposalOwnerId] = useState(null);

  // ✅ Always use either passed or fetched item
  const currentItem = item || fetchedItem;
  const itemId =
    itemIdParam || currentItem?.id || currentItem?.itemId || null;
  const itemTitle =
    itemTitleParam || currentItem?.title || currentItem?.itemTitle || "";

  // ✅ Ownership check
  const isOwner = useMemo(() => {
    if (!me || !currentItem) return false;
    return me.uid === currentItem.userId || me.uid === currentItem.ownerId;
  }, [me, currentItem]);

  // ✅ Ensure chat exists
  useEffect(() => {
    const ensureChat = async () => {
      if (!me || !otherId || !chatId) return;
      const ref = doc(db, "chats", chatId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          users: [me.uid, otherId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "",
          lastSenderId: "",
          readBy: { [me.uid]: true, [otherId]: false },
          unreadCount: { [me.uid]: 0, [otherId]: 0 },
        });
      }
    };
    ensureChat();
  }, [me, otherId, chatId]);

  // ✅ Fetch other user info
  useEffect(() => {
    if (!otherId) return;
    const unsub = onSnapshot(doc(db, "users", otherId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setOtherName(d.name || "Unknown");
        setOtherOnline(!!d.online);
      }
    });
    return unsub;
  }, [otherId]);

  // ✅ Subscribe to messages (and capture proposal owner)
  useEffect(() => {
    if (!chatId) return;

    const msgsRef = collection(db, "chats", chatId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, async (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 🧠 Preemptive item fetch + record owner
      const proposalMsg = arr.find(
        (m) => m.type === "rental_proposal" && m.itemId
      );
      if (proposalMsg) {
        setProposalOwnerId(proposalMsg.to);
        if (!currentItem && !fetchedItem) {
          try {
            const itemDoc = await getDoc(doc(db, "items", proposalMsg.itemId));
            if (itemDoc.exists()) {
              setFetchedItem({ id: proposalMsg.itemId, ...itemDoc.data() });
            } else {
              setFetchedItem({
                id: proposalMsg.itemId,
                title: proposalMsg.itemTitle,
              });
            }
          } catch (err) {
            console.log("⚠️ Failed to prefetch item:", err);
          }
        }
      }

      setMessages(insertDateDividers(arr));
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsub();
  }, [chatId, currentItem, fetchedItem]);

  // ✅ Mark messages as seen
  useEffect(() => {
    if (!chatId || !me) return;
    const markSeen = async () => {
      const msgsRef = collection(db, "chats", chatId, "messages");
      const snap = await getDocs(msgsRef);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        const msg = d.data();
        if (msg.to === me.uid && msg.status !== "seen") {
          batch.update(d.ref, { status: "seen" });
        }
      });
      await batch.commit();
      await updateDoc(doc(db, "chats", chatId), {
        [`readBy.${me.uid}`]: true,
        [`unreadCount.${me.uid}`]: 0,
      });
    };
    markSeen();
  }, [chatId, me]);

  // ✅ Insert date dividers
  const insertDateDividers = (msgs) => {
    const grouped = [];
    let lastDate = "";
    msgs.forEach((m) => {
      if (!m.createdAt) return grouped.push(m);
      const date = m.createdAt.toDate
        ? m.createdAt.toDate()
        : new Date(m.createdAt);
      const key = date.toISOString().slice(0, 10);
      if (key !== lastDate) {
        let label = format(date, "MMM d, yyyy");
        if (isToday(date)) label = "Today";
        else if (isYesterday(date)) label = "Yesterday";
        grouped.push({ id: `divider-${key}`, type: "divider", label });
        lastDate = key;
      }
      grouped.push(m);
    });
    return grouped;
  };

  // ✅ Send text message
  const sendMessage = async () => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: trimmed,
      senderId: me.uid,
      to: otherId,
      createdAt: serverTimestamp(),
      status: "sent",
      type: "text",
    });
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: trimmed,
      lastSenderId: me.uid,
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${otherId}`]: increment(1),
    });
    setText("");
  };

  // ✅ Send rental proposal
  const sendRentalProposal = async () => {
    if (!itemId)
      return Alert.alert("Error", "This chat has no associated item.");
    if (endDate < startDate)
      return Alert.alert("Error", "End date cannot be before start date.");

    const readableStart = startDate.toDateString();
    const readableEnd = endDate.toDateString();

    await addDoc(collection(db, "chats", chatId, "messages"), {
      type: "rental_proposal",
      senderId: me.uid,
      to: otherId,
      itemId,
      itemTitle,
      itemImage: item?.imageUrl || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "pending",
      createdAt: serverTimestamp(),
      text: `Rental proposal for "${itemTitle}" (${readableStart} → ${readableEnd})`,
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: "📦 Rental proposal sent",
      lastSenderId: me.uid,
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${otherId}`]: increment(1),
    });

    setShowPicker(false);
  };

  // ✅ Handle proposal accept/reject
  const handleProposalAction = async (m, status) => {
    const msgRef = doc(db, "chats", chatId, "messages", m.id);
    await updateDoc(msgRef, { status });

    const sysText =
      status === "accepted"
        ? `✅ Proposal accepted for "${m.itemTitle}" (${new Date(
            m.startDate
          ).toDateString()} → ${new Date(m.endDate).toDateString()})`
        : `❌ Proposal rejected for "${m.itemTitle}"`;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: sysText,
      senderId: me.uid,
      to: m.senderId,
      createdAt: serverTimestamp(),
      type: "system",
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: sysText,
      lastSenderId: me.uid,
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${m.senderId}`]: increment(1),
    });

    if (status === "accepted") {
      await fetch(`${BASE_URL}/createRental`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: m.itemId,
          borrowerId: m.senderId,
          lenderId: me.uid,
          startDate: m.startDate,
          endDate: m.endDate,
          itemTitle: m.itemTitle,
          itemImage: m.itemImage || item?.imageUrl || null,
        }),
      });
    }
  };

  // ✅ Render message
  const renderMessage = ({ item: m }) => {
    if (m.type === "divider")
      return (
        <View style={styles.dividerWrap}>
          <Text style={styles.dividerText}>{m.label}</Text>
        </View>
      );

    if (m.type === "rental_proposal") {
      const mine = m.senderId === me.uid;
      const isMeOwner =
        me?.uid === m.to ||
        me?.uid === proposalOwnerId ||
        me?.uid === currentItem?.ownerId ||
        me?.uid === currentItem?.userId;

      const showOwnerActions = m.status === "pending" && isMeOwner && !mine;

      return (
        <View
          style={[
            styles.row,
            { justifyContent: mine ? "flex-end" : "flex-start" },
          ]}
        >
          <View
            style={[
              styles.proposalCard,
              mine ? styles.mineProposal : styles.theirsProposal,
            ]}
          >
            <Text style={styles.proposalTitle}>🧾 Rental Proposal</Text>
            <Text style={styles.proposalText}>Item: {m.itemTitle}</Text>
            <Text style={styles.proposalText}>
              {new Date(m.startDate).toLocaleDateString()} →{" "}
              {new Date(m.endDate).toLocaleDateString()}
            </Text>

            {showOwnerActions && (
              <View style={styles.proposalActions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#16A34A" }]}
                  onPress={() => handleProposalAction(m, "accepted")}
                >
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#DC2626" }]}
                  onPress={() => handleProposalAction(m, "rejected")}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            {m.status === "accepted" && (
              <Text style={[styles.proposalStatus, { color: "#16A34A" }]}>
                ✅ Accepted
              </Text>
            )}
            {m.status === "rejected" && (
              <Text style={[styles.proposalStatus, { color: "#DC2626" }]}>
                ❌ Rejected
              </Text>
            )}
          </View>
        </View>
      );
    }

    const mine = m.senderId === me.uid;
    const time = m.createdAt?.toDate
      ? format(m.createdAt.toDate(), "h:mm a")
      : "";

    return (
      <View
        style={[
          styles.row,
          { justifyContent: mine ? "flex-end" : "flex-start" },
        ]}
      >
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          <Text style={[styles.txt, mine ? styles.txtMine : styles.txtTheirs]}>
            {m.text}
          </Text>
          <Text
            style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}
          >
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.hName}>{otherName}</Text>
          <Text style={styles.hSub}>
            {otherOnline ? "online" : "last seen recently"}
          </Text>
        </View>
      </View>

      {/* 👤 View Profile Button */}
      {otherId && (
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profile", { uid: otherId })}
        >
          <Ionicons name="person-circle-outline" size={22} color="#fff" />
          <Text style={styles.profileButtonText}>
            View {otherName.split(" ")[0]}&apos;s Profile
          </Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
        />

        {/* 📦 Borrower Proposal Button */}
        {!isOwner && itemId &&
          (!showPicker ? (
            <TouchableOpacity
              style={styles.proposeBtn}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="cube-outline" size={18} color="#fff" />
              <Text style={styles.proposeTxt}>Propose Rental</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.datePickerWrap}>
              <Text style={styles.dateLabel}>Select dates:</Text>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(e, d) => d && setStartDate(d)}
              />
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(e, d) => d && setEndDate(d)}
              />
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={sendRentalProposal}
              >
                <Text style={styles.confirmTxt}>Send Proposal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: 8 }}
                onPress={() => setShowPicker(false)}
              >
                <Text style={{ color: "#666" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ))}

        {/* 💬 Input bar */}
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
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#ECE5DD" },
  header: {
    backgroundColor: GREEN,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  hName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  hSub: { color: "#dbeafe", fontSize: 12 },
  dividerWrap: {
    alignSelf: "center",
    backgroundColor: "#DADADA",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  dividerText: { fontSize: 12, color: "#555", fontWeight: "600" },
  row: { flexDirection: "row", marginVertical: 6 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  mine: { backgroundColor: GREEN },
  theirs: { backgroundColor: "#fff" },
  txt: { fontSize: 16, lineHeight: 22 },
  txtMine: { color: "#fff" },
  txtTheirs: { color: "#111" },
  time: { fontSize: 11, marginTop: 6, alignSelf: "flex-end" },
  timeMine: { color: "#EAEAEA" },
  timeTheirs: { color: "#555" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: GREEN,
    borderRadius: 22,
    padding: 10,
  },
  proposeBtn: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: "center",
  },
  proposeTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  datePickerWrap: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    alignItems: "center",
  },
  dateLabel: { fontWeight: "600", marginBottom: 10 },
  confirmBtn: {
    marginTop: 12,
    backgroundColor: GREEN,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  confirmTxt: { color: "#fff", fontWeight: "600" },
  proposalCard: {
    maxWidth: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  mineProposal: { backgroundColor: "#DCF8C6" },
  theirsProposal: { backgroundColor: "#fff" },
  proposalTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 6,
    color: "#0A66C2",
  },
  proposalText: { fontSize: 14, color: "#333", marginBottom: 4 },
  proposalActions: { flexDirection: "row", marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  proposalStatus: { fontWeight: "600", marginTop: 8, textAlign: "right" },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "#0A66C2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2,
  },
  profileButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});