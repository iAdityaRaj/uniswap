// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   ActivityIndicator,
//   Animated,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { auth, db } from "../firebaseConfig";
// import {
//   doc,
//   getDoc,
//   setDoc,
//   addDoc,
//   updateDoc,
//   collection,
//   query,
//   where,
//   getDocs,
//   serverTimestamp,
//   increment,
// } from "firebase/firestore";

// export default function ItemDetailsScreen({ route, navigation }) {
//   const { item } = route.params;
//   const [wishlisted, setWishlisted] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const fadeAnim = useState(new Animated.Value(0))[0];
//   const toastAnim = useState(new Animated.Value(0))[0];
//   const [toastText, setToastText] = useState("");
//   const insets = useSafeAreaInsets();

//   // ✅ Toast animation
//   const showToast = (message) => {
//     setToastText(message);
//     Animated.sequence([
//       Animated.timing(toastAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }),
//       Animated.delay(1500),
//       Animated.timing(toastAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   // ✅ Check if wishlisted
//   useEffect(() => {
//     const checkWishlist = async () => {
//       try {
//         const user = auth.currentUser;
//         if (!user) return;
//         const docRef = doc(db, "users", user.uid, "wishlist", item.id);
//         const docSnap = await getDoc(docRef);
//         setWishlisted(docSnap.exists());
//       } catch (err) {
//         console.error("Error checking wishlist:", err);
//       } finally {
//         setLoading(false);
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//       }
//     };
//     checkWishlist();
//   }, [item.id, fadeAnim]);

//   // ✅ Toggle wishlist
//   const toggleWishlist = async () => {
//     const user = auth.currentUser;
//     if (!user) return alert("Please log in first.");
//     try {
//       if (!wishlisted) {
//         await fetch(
//           "https://us-central1-uniswap-iitrpr.cloudfunctions.net/addToWishlist",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               uid: user.uid,
//               item: {
//                 itemId: item.id || item.itemId,
//                 title: item.title,
//                 price: item.price,
//                 imageUrl: item.imageUrl,
//                 category: item.category || "Others",
//               },
//             }),
//           }
//         );
//         setWishlisted(true);
//         showToast("✅ Added to Wishlist");
//       } else {
//         await fetch(
//           "https://us-central1-uniswap-iitrpr.cloudfunctions.net/removeFromWishlist",
//           {
//             method: "DELETE",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ uid: user.uid, itemId: item.id || item.itemId }),
//           }
//         );
//         setWishlisted(false);
//         showToast("❌ Removed from Wishlist");
//       }
//     } catch (err) {
//       console.error("Error toggling wishlist:", err);
//     }
//   };

//   // ✅ Chat with owner
//   const handleChatWithOwner = async () => {
//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         alert("Please log in to start a chat.");
//         return;
//       }
//       if (user.uid === item.userId) {
//         alert("You cannot chat with yourself.");
//         return;
//       }

//       const otherId = item.userId;
//       const chatId = [user.uid, otherId].sort().join("_");
//       const chatRef = doc(db, "chats", chatId);
//       const chatSnap = await getDoc(chatRef);

//       const introText = `Hi! I'm interested in: ${item.title}`;

//       if (!chatSnap.exists()) {
//         await setDoc(chatRef, {
//           users: [user.uid, otherId],
//           createdAt: serverTimestamp(),
//           updatedAt: serverTimestamp(),
//           lastMessage: introText,
//           lastSenderId: user.uid,
//           lastMessageAt: serverTimestamp(),
//           readBy: { [user.uid]: true, [otherId]: false },
//           unreadCount: { [user.uid]: 0, [otherId]: 1 },
//         });

//         await addDoc(collection(db, "chats", chatId, "messages"), {
//           text: introText,
//           senderId: user.uid,
//           createdAt: serverTimestamp(),
//         });
//       } else {
//         const msgsRef = collection(db, "chats", chatId, "messages");
//         const q = query(msgsRef, where("text", "==", introText));
//         const existingIntro = await getDocs(q);

//         if (existingIntro.empty) {
//           await addDoc(msgsRef, {
//             text: introText,
//             senderId: user.uid,
//             createdAt: serverTimestamp(),
//           });

//           await updateDoc(chatRef, {
//             lastMessage: introText,
//             lastSenderId: user.uid,
//             lastMessageAt: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//             [`readBy.${user.uid}`]: true,
//             [`readBy.${otherId}`]: false,
//             [`unreadCount.${otherId}`]: increment(1),
//           });
//         }
//       }

//       // ✅ Safe fallback to always include itemId
//       const itemIdToPass = item.id || item.itemId || null;
//       console.log("Navigating to chat with itemId:", itemIdToPass, item);

//       navigation.navigate("ChatScreen", {
//       otherUserId: otherId,
//       itemTitle: item.title,
//       itemId: itemIdToPass,
//       item: {
//         ...item,
//         userId: item.userId || item.ownerId || otherId, 
//       },
//     });
//     } catch (err) {
//       console.error("Error starting chat:", err);
//       alert("Something went wrong. Try again.");
//     }
//   };

//   // 🌀 Loader
//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#0A66C2" />
//         <Text style={styles.loaderText}>Loading item details...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safe}>
//       <StatusBar backgroundColor="#fff" barStyle="dark-content" />

//       <Animated.ScrollView
//         style={{ opacity: fadeAnim }}
//         contentContainerStyle={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.imageWrapper}>
//           <Image
//             source={
//               item.imageUrl
//                 ? { uri: item.imageUrl }
//                 : require("../assets/category_images/others.png")
//             }
//             style={styles.image}
//           />
//           <TouchableOpacity style={styles.heartButton} onPress={toggleWishlist}>
//             <Ionicons
//               name={wishlisted ? "heart" : "heart-outline"}
//               size={28}
//               color={wishlisted ? "#e63946" : "#fff"}
//             />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.detailsCard}>
//           <Text style={styles.title}>{item.title}</Text>
//           <Text style={styles.category}>{item.category || "Others"}</Text>

//           <View style={styles.priceRow}>
//             <Text style={styles.price}>₹{item.price}/day</Text>
//             <View
//               style={[
//                 styles.typeTag,
//                 {
//                   backgroundColor:
//                     item.type === "share" ? "#2563EB" : "#16a34a",
//                 },
//               ]}
//             >
//               <Text style={styles.typeText}>
//                 {item.type
//                   ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
//                   : "Rent"}
//               </Text>
//             </View>
//           </View>

//           <Text style={styles.description}>
//             {item.description || "No description provided."}
//           </Text>
//         </View>
//       </Animated.ScrollView>

//       {/* 💬 Chat Button */}
//       <View
//         style={[
//           styles.footerContainer,
//           { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.chatButton}
//           onPress={handleChatWithOwner}
//         >
//           <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
//           <Text style={styles.chatText}>Chat with Owner</Text>
//         </TouchableOpacity>
//       </View>

//       {/* ✅ Toast */}
//       <Animated.View
//         style={[
//           styles.toast,
//           {
//             opacity: toastAnim,
//             transform: [
//               {
//                 translateY: toastAnim.interpolate({
//                   inputRange: [0, 1],
//                   outputRange: [30, 0],
//                 }),
//               },
//             ],
//           },
//         ]}
//       >
//         <Text style={styles.toastText}>{toastText}</Text>
//       </Animated.View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#f8f9fb" },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f9f9f9",
//   },
//   loaderText: { marginTop: 10, color: "#666", fontSize: 16 },
//   scrollContainer: { paddingBottom: 100 },
//   imageWrapper: { position: "relative", marginTop: 10, marginHorizontal: 10 },
//   image: {
//     width: "100%",
//     height: 300,
//     borderRadius: 18,
//     resizeMode: "cover",
//   },
//   heartButton: {
//     position: "absolute",
//     top: 18,
//     right: 18,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     borderRadius: 25,
//     padding: 8,
//   },
//   detailsCard: {
//     backgroundColor: "#fff",
//     marginTop: 20,
//     marginHorizontal: 15,
//     borderRadius: 18,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.07,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#0A66C2",
//     marginBottom: 6,
//   },
//   category: { color: "#666", fontSize: 15, marginBottom: 10 },
//   priceRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 15,
//     justifyContent: "space-between",
//   },
//   price: { fontSize: 22, fontWeight: "700", color: "#16a34a" },
//   typeTag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
//   typeText: { color: "#fff", fontWeight: "600" },
//   description: {
//     fontSize: 16,
//     color: "#444",
//     lineHeight: 24,
//     marginBottom: 12,
//   },
//   footerContainer: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     alignItems: "center",
//   },
//   chatButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#0A66C2",
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 14,
//     elevation: 5,
//   },
//   chatText: { color: "#fff", fontSize: 17, fontWeight: "bold", marginLeft: 8 },
//   toast: {
//     position: "absolute",
//     bottom: 90,
//     alignSelf: "center",
//     backgroundColor: "rgba(0,0,0,0.8)",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//   },
//   toastText: { color: "#fff", fontSize: 15, fontWeight: "600" },
// });

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

export default function ItemDetailsScreen({ route, navigation }) {
  const { item } = route.params;
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // ✅ Check if wishlisted
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const docRef = doc(db, "users", user.uid, "wishlist", item.id);
        const docSnap = await getDoc(docRef);
        setWishlisted(docSnap.exists());
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

  // ✅ Toggle wishlist
  const toggleWishlist = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in first.");
    try {
      if (!wishlisted) {
        await fetch(
          "https://us-central1-uniswap-iitrpr.cloudfunctions.net/addToWishlist",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: user.uid,
              item: {
                itemId: item.id || item.itemId,
                title: item.title,
                price: item.price,
                imageUrl: item.imageUrl,
                category: item.category || "Others",
              },
            }),
          }
        );
        setWishlisted(true);
        showToast("✅ Added to Wishlist");
      } else {
        await fetch(
          "https://us-central1-uniswap-iitrpr.cloudfunctions.net/removeFromWishlist",
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: user.uid,
              itemId: item.id || item.itemId,
            }),
          }
        );
        setWishlisted(false);
        showToast("❌ Removed from Wishlist");
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  // ✅ Chat with owner (FIXED VERSION)
 // ✅ Chat with owner (with Firestore fallback to resolve owner)
const handleChatWithOwner = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to start a chat.");
      return;
    }

    // 1️⃣ First attempt: use fields already on the item
    let otherUserId = item.userId || item.ownerId || item.uid;

    // 2️⃣ If missing (like wishlist items), fetch full item doc from Firestore
    if (!otherUserId) {
      try {
        const itemDocRef = doc(db, "items", item.id || item.itemId);
        const itemSnap = await getDoc(itemDocRef);
        if (itemSnap.exists()) {
          const fullItem = itemSnap.data();
          otherUserId =
            fullItem.userId || fullItem.ownerId || fullItem.uid || null;

          // merge back into local item so we always carry owner info from now on
          Object.assign(item, {
            userId: fullItem.userId || fullItem.ownerId || fullItem.uid,
            ownerId: fullItem.ownerId || fullItem.userId || fullItem.uid,
          });
        }
      } catch (e) {
        console.error("handleChatWithOwner: error fetching item doc:", e);
      }
    }

    // 3️⃣ If still no owner, abort safely
    if (!otherUserId) {
      console.error("handleChatWithOwner: missing owner on item after lookup", item);
      alert("Could not find the owner of this item.");
      return;
    }

    if (user.uid === otherUserId) {
      alert("You cannot chat with yourself.");
      return;
    }

    // 4️⃣ Build chat and create if needed
    const chatId = [user.uid, otherUserId].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    const introText = `Hi! I'm interested in: ${item.title}`;

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: [user.uid, otherUserId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: introText,
        lastSenderId: user.uid,
        lastMessageAt: serverTimestamp(),
        readBy: { [user.uid]: true, [otherUserId]: false },
        unreadCount: { [user.uid]: 0, [otherUserId]: 1 },
      });

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: introText,
        senderId: user.uid,
        to: otherUserId,
        createdAt: serverTimestamp(),
        type: "text",
        status: "sent",
      });
    } else {
      const msgsRef = collection(db, "chats", chatId, "messages");
      const q = query(msgsRef, where("text", "==", introText));
      const existingIntro = await getDocs(q);

      if (existingIntro.empty) {
        await addDoc(msgsRef, {
          text: introText,
          senderId: user.uid,
          to: otherUserId,
          createdAt: serverTimestamp(),
          type: "text",
          status: "sent",
        });

        await updateDoc(chatRef, {
          lastMessage: introText,
          lastSenderId: user.uid,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          [`readBy.${user.uid}`]: true,
          [`readBy.${otherUserId}`]: false,
          [`unreadCount.${otherUserId}`]: increment(1),
        });
      }
    }

    // 5️⃣ Normalize item passed to ChatScreen so it always has owner info
    const itemIdToPass = item.id || item.itemId || null;
    const normalizedItem = {
      ...item,
      userId: item.userId || item.ownerId || otherUserId,
      ownerId: item.ownerId || item.userId || otherUserId,
    };

    console.log("Navigating to chat with:", {
      chatId,
      otherUserId,
      itemIdToPass,
      normalizedItem,
    });

    navigation.navigate("ChatScreen", {
      chatId,
      otherUserId,
      itemTitle: item.title,
      itemId: itemIdToPass,
      item: normalizedItem,
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

      {/* 💬 Chat Button */}
      <View
        style={[
          styles.footerContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
        ]}
      >
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChatWithOwner}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color="#fff"
          />
          <Text style={styles.chatText}>Chat with Owner</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Toast */}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 6,
  },
  category: { color: "#666", fontSize: 15, marginBottom: 10 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  price: { fontSize: 22, fontWeight: "700", color: "#16a34a" },
  typeTag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  typeText: { color: "#fff", fontWeight: "600" },
  description: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    marginBottom: 12,
  },
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