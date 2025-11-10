// import React, { useEffect, useState, useCallback } from "react";
// import { useFocusEffect } from "@react-navigation/native";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   TextInput,
//   FlatList,
//   Image,
// } from "react-native";
// import { auth, db } from "../firebaseConfig";
// import { signOut } from "firebase/auth";
// import { doc, onSnapshot, updateDoc } from "firebase/firestore";
// import Toast from "react-native-toast-message";
// import { Ionicons } from "@expo/vector-icons";

// const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";

// export default function ProfileScreen({ navigation, route }) {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(false);
//   const [newName, setNewName] = useState("");
//   const [wishlist, setWishlist] = useState([]);
//   const [loadingWishlist, setLoadingWishlist] = useState(false);

//   const viewingUid = route?.params?.uid || auth.currentUser?.uid;
//   const isOwnProfile = viewingUid === auth.currentUser?.uid;

//   // ✅ Real-time Firestore listener for user data + trustScore
//   useEffect(() => {
//     if (!viewingUid) return;
//     const unsub = onSnapshot(doc(db, "users", viewingUid), (snap) => {
//       if (snap.exists()) {
//         const data = snap.data();
//         setUserData(data);
//       } else {
//         setUserData(null);
//       }
//       setLoading(false);
//     });

//     return unsub;
//   }, [viewingUid]);

//   // ✅ Fetch wishlist when screen is focused
//   useFocusEffect(
//     useCallback(() => {
//       const fetchWishlist = async () => {
//         if (!isOwnProfile || !viewingUid) return;
//         setLoadingWishlist(true);
//         try {
//           const res = await fetch(`${BASE_URL}/getWishlist?uid=${viewingUid}`);
//           if (res.ok) {
//             const data = await res.json();
//             if (Array.isArray(data)) setWishlist(data);
//           } else {
//             console.log("⚠️ Wishlist fetch failed:", res.status);
//           }
//         } catch (error) {
//           console.error("❌ Error fetching wishlist:", error);
//         } finally {
//           setLoadingWishlist(false);
//         }
//       };
//       fetchWishlist();
//     }, [isOwnProfile, viewingUid])
//   );

//   const handleLogout = async () => {
//     try {
//       Toast.show({ type: "info", text1: "Signing out..." });
//       await signOut(auth);
//       Toast.show({ type: "success", text1: "Logged out successfully 👋" });
//     } catch (error) {
//       Toast.show({ type: "error", text1: "Logout Failed", text2: error.message });
//     }
//   };

//   const handleSaveName = async () => {
//     if (!newName.trim()) {
//       Toast.show({ type: "error", text1: "Name cannot be empty" });
//       return;
//     }

//     try {
//       const user = auth.currentUser;
//       const userRef = doc(db, "users", user.uid);
//       await updateDoc(userRef, { name: newName.trim() });

//       setUserData((prev) => ({ ...prev, name: newName.trim() }));
//       setEditing(false);
//       setNewName("");

//       Toast.show({ type: "success", text1: "Name updated successfully ✅" });
//     } catch (error) {
//       Toast.show({ type: "error", text1: "Failed to update name", text2: error.message });
//     }
//   };

//   // ✅ Loader
//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#0A66C2" />
//         <Text style={{ color: "#555", marginTop: 8 }}>Loading Profile...</Text>
//       </View>
//     );
//   }

//   // ✅ Header section
//   const renderHeader = () => {
//     const trustScore = userData?.trustScore ?? 100;
//     let trustColor = "#16A34A";
//     if (trustScore < 80) trustColor = "#F59E0B";
//     if (trustScore < 60) trustColor = "#DC2626";

//     return (
//       <View>
//         <Text style={styles.header}>Profile</Text>

//         {!isOwnProfile && userData && (
//           <Text style={{ textAlign: "center", color: "#666", marginBottom: 10 }}>
//             Viewing {userData.name}&apos;s Profile
//           </Text>
//         )}

//         {userData ? (
//           <>
//             <Text style={styles.label}>Name</Text>
//             {isOwnProfile ? (
//               editing ? (
//                 <View style={styles.editContainer}>
//                   <TextInput
//                     style={styles.input}
//                     value={newName}
//                     onChangeText={setNewName}
//                     placeholder="Enter new name"
//                     placeholderTextColor="#999"
//                   />
//                   <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
//                     <Text style={styles.saveText}>Save</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={styles.cancelBtn}
//                     onPress={() => {
//                       setEditing(false);
//                       setNewName("");
//                     }}
//                   >
//                     <Text style={styles.cancelText}>Cancel</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : (
//                 <View style={styles.rowBetween}>
//                   <Text style={styles.value}>{userData.name || "N/A"}</Text>
//                   <TouchableOpacity
//                     style={styles.editBtn}
//                     onPress={() => {
//                       setNewName(userData.name || "");
//                       setEditing(true);
//                     }}
//                   >
//                     <Text style={styles.editText}>Edit</Text>
//                   </TouchableOpacity>
//                 </View>
//               )
//             ) : (
//               <Text style={styles.value}>{userData.name || "N/A"}</Text>
//             )}

//             <Text style={styles.label}>Email</Text>
//             <Text style={styles.value}>{userData.email || "N/A"}</Text>

//             {/* ✅ Trust Score Display */}
//             <View style={styles.trustContainer}>
//               <Text style={styles.trustLabel}>Trust Score</Text>
//               <Text style={[styles.trustValue, { color: trustColor }]}>
//                 {trustScore}
//               </Text>
//             </View>

//             {isOwnProfile && (
//               <>
//                 <TouchableOpacity
//                   style={styles.myRentalsBtn}
//                   onPress={() => navigation.navigate("MyRentals")}
//                 >
//                   <Ionicons name="cube-outline" size={20} color="#fff" />
//                   <Text style={styles.myRentalsText}>View My Rentals</Text>
//                 </TouchableOpacity>

//                 <Text style={styles.sectionTitle}>My Wishlist ❤️</Text>
//               </>
//             )}
//           </>
//         ) : (
//           <Text style={styles.value}>No user data available</Text>
//         )}
//       </View>
//     );
//   };

//   return (
//     <FlatList
//       data={isOwnProfile ? wishlist : []}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <TouchableOpacity
//           style={styles.wishlistCard}
//           onPress={() => navigation.navigate("ItemDetails", { item })}
//         >
//           <Image
//             source={
//               item.imageUrl
//                 ? { uri: item.imageUrl }
//                 : require("../assets/category_images/others.png")
//             }
//             style={styles.itemImage}
//           />
//           <View style={{ flex: 1 }}>
//             <Text style={styles.itemTitle}>{item.title}</Text>
//             <Text style={styles.itemPrice}>₹{item.price}/day</Text>
//           </View>
//           <Ionicons name="chevron-forward" size={20} color="#888" />
//         </TouchableOpacity>
//       )}
//       ListHeaderComponent={renderHeader}
//       ListEmptyComponent={
//         loadingWishlist ? (
//           <ActivityIndicator color="#0A66C2" />
//         ) : (
//           <Text style={styles.emptyText}>You haven’t added anything yet.</Text>
//         )
//       }
//       ListFooterComponent={
//         isOwnProfile && (
//           <View style={{ marginTop: 30 }}>
//             <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//               <Text style={styles.logoutText}>Logout</Text>
//             </TouchableOpacity>
//           </View>
//         )
//       }
//       contentContainerStyle={{
//         padding: 20,
//         backgroundColor: "#fff",
//         paddingBottom: 80,
//       }}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
//   header: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "#0A66C2",
//     marginBottom: 30,
//     textAlign: "center",
//   },
//   label: { fontSize: 16, color: "#666", marginBottom: 4 },
//   value: { fontSize: 18, fontWeight: "bold", color: "#111", marginBottom: 20 },
//   rowBetween: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   editBtn: {
//     backgroundColor: "#0A66C2",
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     borderRadius: 8,
//   },
//   editText: { color: "#fff", fontSize: 14, fontWeight: "600" },
//   editContainer: { marginBottom: 20 },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 10,
//     padding: 10,
//     fontSize: 16,
//     marginBottom: 10,
//   },
//   saveBtn: {
//     backgroundColor: "#16A34A",
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: "center",
//     marginBottom: 6,
//   },
//   saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
//   cancelBtn: { alignItems: "center", paddingVertical: 8 },
//   cancelText: { color: "#666", fontSize: 14 },
//   logoutButton: {
//     marginTop: 30,
//     backgroundColor: "#EF4444",
//     paddingVertical: 15,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   logoutText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   trustContainer: {
//     backgroundColor: "#E8F4FF",
//     padding: 15,
//     borderRadius: 12,
//     alignItems: "center",
//     marginTop: 10,
//     marginBottom: 30,
//   },
//   trustLabel: { fontSize: 16, color: "#555", fontWeight: "600" },
//   trustValue: { fontSize: 36, fontWeight: "bold", marginTop: 6 },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#0A66C2",
//     marginBottom: 10,
//   },
//   wishlistCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F8FAFC",
//     borderRadius: 12,
//     padding: 10,
//     marginBottom: 10,
//     elevation: 1,
//   },
//   itemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
//   itemTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
//   itemPrice: { fontSize: 14, color: "#16A34A" },
//   emptyText: { color: "#888", textAlign: "center", marginTop: 10 },
//   myRentalsBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#0A66C2",
//     paddingVertical: 12,
//     borderRadius: 10,
//     marginBottom: 20,
//     elevation: 3,
//   },
//   myRentalsText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
// });


import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";

export default function ProfileScreen({ navigation, route }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const viewingUid = route?.params?.uid || auth.currentUser?.uid;
  const isOwnProfile = viewingUid === auth.currentUser?.uid;

  // ✅ Real-time Firestore listener for any user's data (including trustScore)
  useEffect(() => {
    if (!viewingUid) return;
    const unsub = onSnapshot(doc(db, "users", viewingUid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [viewingUid]);

  // ✅ Fetch wishlist (only for own profile)
  useFocusEffect(
    useCallback(() => {
      const fetchWishlist = async () => {
        if (!isOwnProfile || !viewingUid) return;
        setLoadingWishlist(true);
        try {
          const res = await fetch(`${BASE_URL}/getWishlist?uid=${viewingUid}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setWishlist(data);
          }
        } catch (error) {
          console.error("❌ Error fetching wishlist:", error);
        } finally {
          setLoadingWishlist(false);
        }
      };
      fetchWishlist();
    }, [isOwnProfile, viewingUid])
  );

  const handleLogout = async () => {
    try {
      Toast.show({ type: "info", text1: "Signing out..." });
      await signOut(auth);
      Toast.show({ type: "success", text1: "Logged out successfully 👋" });
    } catch (error) {
      Toast.show({ type: "error", text1: "Logout Failed", text2: error.message });
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Toast.show({ type: "error", text1: "Name cannot be empty" });
      return;
    }

    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name: newName.trim() });
      setUserData((prev) => ({ ...prev, name: newName.trim() }));
      setEditing(false);
      setNewName("");
      Toast.show({ type: "success", text1: "Name updated successfully ✅" });
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update name", text2: error.message });
    }
  };

  // ✅ Loader
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A66C2" />
        <Text style={{ color: "#555", marginTop: 8 }}>Loading Profile...</Text>
      </View>
    );
  }

  // ✅ Header
  const renderHeader = () => {
    const trustScore = userData?.trustScore ?? 100;
    let trustColor = "#16A34A";
    if (trustScore < 80) trustColor = "#F59E0B";
    if (trustScore < 60) trustColor = "#DC2626";

    return (
      <View>
        <Text style={styles.header}>Profile</Text>

        {!isOwnProfile && userData && (
          <Text style={{ textAlign: "center", color: "#666", marginBottom: 10 }}>
            Viewing {userData.name}&apos;s Profile
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
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
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
            <Text style={styles.value}>{userData.email || "Hidden"}</Text>

            {/* ✅ Trust Score Display (visible to everyone) */}
            <View style={styles.trustContainer}>
              <Text style={styles.trustLabel}>Trust Score</Text>
              <Text style={[styles.trustValue, { color: trustColor }]}>
                {trustScore}
              </Text>
            </View>

            {/* ✅ Only for own profile */}
            {isOwnProfile && (
              <>
                <TouchableOpacity
                  style={styles.myRentalsBtn}
                  onPress={() => navigation.navigate("MyRentals")}
                >
                  <Ionicons name="cube-outline" size={20} color="#fff" />
                  <Text style={styles.myRentalsText}>View My Rentals</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>My Wishlist ❤️</Text>
              </>
            )}
          </>
        ) : (
          <Text style={styles.value}>No user data available</Text>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={isOwnProfile ? wishlist : []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.wishlistCard}
          onPress={() => navigation.navigate("ItemDetails", { item })}
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
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        isOwnProfile ? (
          loadingWishlist ? (
            <ActivityIndicator color="#0A66C2" />
          ) : (
            <Text style={styles.emptyText}>You haven’t added anything yet.</Text>
          )
        ) : null
      }
      ListFooterComponent={
        isOwnProfile && (
          <View style={{ marginTop: 30 }}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )
      }
      contentContainerStyle={{
        padding: 20,
        backgroundColor: "#fff",
        paddingBottom: 80,
      }}
    />
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 30,
    textAlign: "center",
  },
  label: { fontSize: 16, color: "#666", marginBottom: 4 },
  value: { fontSize: 18, fontWeight: "bold", color: "#111", marginBottom: 20 },
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
  itemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  itemPrice: { fontSize: 14, color: "#16A34A" },
  emptyText: { color: "#888", textAlign: "center", marginTop: 10 },
  myRentalsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A66C2",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  myRentalsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});