import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import AppNavigation from "./AppNavigation";
import AuthStack from "./screens/AuthStack";
import Toast from "react-native-toast-message";
import { navigationRef } from "./navigationRef";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  // ✅ Handle auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ✅ Handle online/offline presence
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    // Mark online when logged in
    const setOnline = async () => {
      try {
        await updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } catch (e) {
        console.log("online update error", e);
      }
    };

    // Mark offline when leaving app
    const setOffline = async () => {
      try {
        await updateDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      } catch (e) {
        console.log("offline update error", e);
      }
    };

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppState(nextState);
      if (nextState === "active") {
        setOnline();
      } else {
        setOffline();
      }
    });

    // Set online immediately on mount
    setOnline();

    // Cleanup
    return () => {
      setOffline();
      subscription.remove();
    };
  }, [user]);

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

      {/* ✅ Toast */}
      <Toast position="top" topOffset={50} visibilityTime={2500} />
    </>
  );
}