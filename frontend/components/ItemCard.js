import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.42;

export default function ItemCard({ item, navigation }) {
  const imageSource = item.imageUrl
    ? { uri: item.imageUrl }
    : require("../assets/category_images/others.png");

  const handlePress = () => {
    navigation.navigate("ItemDetails", { item });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
      <Image source={imageSource} style={styles.image} />

      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {item.price ? (
          <Text style={styles.price}>₹{item.price}/day</Text>
        ) : null}
        <View
          style={[
            styles.typeTag,
            {
              backgroundColor: item.type === "share" ? "#2563EB" : "#16a34a",
            },
          ]}
        >
          <Text style={styles.typeText}>
            {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Rent"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginRight: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  details: {
    padding: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 3,
  },
  price: {
    fontSize: 14,
    color: "#16a34a",
    fontWeight: "600",
    marginBottom: 5,
  },
  typeTag: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  typeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
