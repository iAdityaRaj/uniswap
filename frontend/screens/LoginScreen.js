import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValidated, setEmailValidated] = useState(false);

  const validateEmailInstant = () => {
    if (!email.endsWith("@iitrpr.ac.in")) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please use your IIT Ropar email address.",
      });
      setEmailValidated(false);
    } else {
      setEmailValidated(true);
    }
  };

  const handleLogin = async () => {
    if (!emailValidated) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: "Please use a valid IIT Ropar email address.",
      });
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : "User";

      // 🔹 Added: Sync user data to backend
      const backendUrl = "https://uniswap-iitrpr-backend.onrender.com/createOrUpdateUser";
      try {
        await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            name: userName,
            email: user.email,
          }),
        });
        console.log("✅ Synced user to backend successfully.");
      } catch (err) {
        console.log("⚠️ Backend sync failed:", err);
      }

      Toast.show({
        type: "success",
        text1: `Welcome back, ${userName}! 👋`,
      });

      // 🔹 Added: Navigate to Home after successful login
      navigation.replace("Home");

    } catch (error) {
      let message = "Login failed. Please try again.";

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/invalid-email":
          message = "Invalid email or password.";
          break;
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;
        case "auth/wrong-password":
          message = "Incorrect password.";
          break;
        case "auth/network-request-failed":
          message = "Network error. Check your connection.";
          break;
        default:
          message = error.message;
      }

      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
            textAlign: "center",
            color: "#0A66C2",
          }}
        >
          Login to UniSwap
        </Text>

        {/* Email Input */}
        <TextInput
          placeholder="IIT Ropar Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          onEndEditing={validateEmailInstant}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 16,
          }}
        />

        {/* Password Input + Eye Toggle */}
        <View style={{ position: "relative", marginBottom: 20 }}>
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onFocus={validateEmailInstant}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 12,
              borderRadius: 8,
              fontSize: 16,
              paddingRight: 45,
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 15,
              top: 14,
            }}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: "#0A66C2",
            padding: 15,
            borderRadius: 8,
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Signup Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
          style={{ marginTop: 15 }}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#10b981",
              fontSize: 15,
            }}
          >
            Don’t have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
