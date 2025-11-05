import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  Animated,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { auth, db, storage } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const categoryImages = {
  Books: require("../assets/category_images/books.png"),
  Electronics: require("../assets/category_images/electronics.png"),
  Clothing: require("../assets/category_images/clothing.png"),
  Furniture: require("../assets/category_images/furniture.png"),
  Stationery: require("../assets/category_images/stationery.png"),
  Sports: require("../assets/category_images/sports.png"),
  Others: require("../assets/category_images/others.png"),
};

export default function MyAdsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // ✅ Animation references for each item
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnimations = useRef({}).current;

  const fetchItems = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "items"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() });
      });

      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ✅ Fade in animation when data loads
  useEffect(() => {
    if (items.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [items]);

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (item.imageUrl) {
                const imageRef = ref(storage, item.imageUrl);
                await deleteObject(imageRef).catch(() => {});
              }
              await deleteDoc(doc(db, "items", item.id));
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              Alert.alert("Deleted", "Item removed successfully.");
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete the item. Try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0A66C2" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={50} color="#ccc" />
        <Text style={styles.emptyText}>You haven’t posted any ads yet.</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => {
    // ✅ get or create animation for this item
    if (!scaleAnimations[item.id]) {
      scaleAnimations[item.id] = new Animated.Value(1);
    }
    const scaleAnim = scaleAnimations[item.id];

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }).start();
    };

    const imageSource = item.imageUrl
      ? { uri: item.imageUrl }
      : categoryImages[item.category] || categoryImages.Others;

    const type = item.type || "rent";
    const badgeColor = type === "share" ? "#3B82F6" : "#16A34A";
    const badgeText = type === "share" ? "Share" : "Rent";

    const date = item.createdAt?.toDate?.();
    const formattedDate = date
      ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      : "—";

    return (
      <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image source={imageSource} style={styles.image} />
          <View style={styles.details}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={styles.badgeText}>{badgeText}</Text>
              </View>
            </View>

            <Text style={styles.category}>{item.category}</Text>
            {type === "rent" && (
              <Text style={styles.price}>₹{item.price}/day</Text>
            )}
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.date}>Posted on {formattedDate}</Text>

            <View style={styles.actions}>
              <TouchableWithoutFeedback
                onPress={() => navigation.navigate("EditItem", { item })}
              >
                <View style={[styles.btn, { backgroundColor: "#0A66C2" }]}>
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>Edit</Text>
                </View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={() => handleDelete(item)}>
                <View style={[styles.btn, { backgroundColor: "#EF4444" }]}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>Delete</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    marginTop: 8,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    minHeight: 130,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0A66C2",
    flex: 1,
    flexWrap: "wrap",
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  category: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#16a34a",
  },
  desc: {
    fontSize: 13,
    color: "#444",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});
