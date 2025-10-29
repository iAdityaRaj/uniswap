import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 20,
  },
});
