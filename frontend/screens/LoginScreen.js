import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : "User";

      Toast.show({
        type: "success",
        text1: `Welcome back, ${userName}! 👋`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2:
          error.code === "auth/invalid-credential"
            ? "Invalid email or password."
            : error.message,
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
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Login to UniSwap
        </Text>

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
          }}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onFocus={validateEmailInstant}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
          }}
        />

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
