import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function AddItemScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What would you like to do?</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#0A66C2" }]}
        onPress={() => navigation.navigate("RentItem")}
      >
        <Text style={styles.buttonText}>Rent an Item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#10b981" }]}
        onPress={() => navigation.navigate("ShareItem")}
      >
        <Text style={styles.buttonText}>Share an Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#0A66C2",
  },
  button: {
    width: "80%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
