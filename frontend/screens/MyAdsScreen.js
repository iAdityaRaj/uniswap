import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MyAdsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Ads Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 20, color: "#0A66C2", fontWeight: "bold" },
});
