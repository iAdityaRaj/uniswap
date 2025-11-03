import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import AppNavigation from "./AppNavigation";
import AuthStack from "./screens/AuthStack";
import Toast from "react-native-toast-message";
import { navigationRef } from "./navigationRef";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0A66C2" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {user ? <AppNavigation /> : <AuthStack />}
      </NavigationContainer>

      {/* ✅ Toast v3 compatible + smooth animation */}
      <Toast position="top" topOffset={50} visibilityTime={2500} />
    </>
  );
}
