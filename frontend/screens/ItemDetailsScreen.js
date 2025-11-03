import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ItemDetailsScreen({ route, navigation }) {
  const { item } = route.params;
  const insets = useSafeAreaInsets(); // 👈 handles bottom safe zone

  const postedDate =
    item.createdAt?.toDate?.()
      ? item.createdAt.toDate().toDateString()
      : "N/A";

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

          <View style={styles.priceRow}>
            {item.price && (
              <Text style={styles.price}>₹{item.price}/day</Text>
            )}
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

      {/* ✅ Button now respects bottom inset properly */}
      <View
        style={[
          styles.footerContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
        ]}
      >
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            navigation.navigate("ChatScreen", { ownerId: item.userId })
          }
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          <Text style={styles.chatText}>Chat with Owner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },
  scrollContainer: {
    paddingBottom: 130,
    paddingHorizontal: 15,
  },
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 4,
  },
  category: {
    fontSize: 15,
    color: "#777",
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
  },
  typeTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  typeText: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  postedOn: {
    color: "#888",
    fontSize: 13,
    marginTop: 8,
  },
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
  chatText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
