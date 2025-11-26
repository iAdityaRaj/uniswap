
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,          // ✅ added
} from "react-native";
// ✅ Added fetchSignInMethodsForEmail to imports
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // 🔹 Instant IIT Ropar validation
  useEffect(() => {
    if (email.length === 0) {
      setEmailError("");
    } else if (!email.endsWith("@iitrpr.ac.in")) {
      setEmailError("Please use your IIT Ropar email address.");
    } else {
      setEmailError("");
    }
  }, [email]);

  const handleSignup = async () => {
    if (emailError) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: String(emailError || ""),
      });
      return;
    }

    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Name",
        text2: "Please enter your full name.",
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Weak Password",
        text2: "Password must be at least 6 characters long.",
      });
      return;
    }

    try {
      setLoading(true);

      // ✅ CHECK IF USER ALREADY EXISTS
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods && methods.length > 0) {
        Toast.show({
          type: "info",
          text1: "Account Already Exists",
          text2: "This email is already registered. Please login instead.",
        });
        setLoading(false);
        return;
      }

      // Proceed to send OTP if user does not exist
      const response = await fetch(
        "https://us-central1-uniswap-iitrpr.cloudfunctions.net/sendOtpEmail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "OTP Sent!",
          text2: "Please check your IIT Ropar email.",
        });

        // ✅ Navigate to OTP screen and pass info
        navigation.navigate("OTPScreen", { name, email, password });
      } else {
        throw new Error(data.error || "Failed to send OTP.");
      }
    } catch (error) {
      // Handle specific Firebase error for existing user (fallback)
      if (error.code === "auth/email-already-in-use") {
        Toast.show({
          type: "info",
          text1: "Account Already Exists",
          text2: "Please login with this email.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Signup Failed",
          text2: String(error.message || "Please try again."),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", alignItems: "center" }}>
          {/* 🔵 Logo banner (same style as Login) */}
          <View style={styles.logoWrap}>
            <Image
              source={require("../assets/uniswapLogo.jpg")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>Create Your UniSwap Account</Text>

          {/* ✅ Name */}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />

          {/* ✅ Email */}
          <TextInput
            style={[
              styles.input,
              emailError ? { borderColor: "red" } : { borderColor: "#ccc" },
            ]}
            placeholder="IIT Ropar Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}

          {/* 👁️ Password field with show/hide toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          {/* ✅ Signup button */}
          <TouchableOpacity
            style={[styles.signupButton, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupText}>
              {loading ? "Checking..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* ✅ Login link */}
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  // 🔵 same logo styles as LoginScreen
  logoWrap: {
    width: "100%", // fills device width
    paddingHorizontal: 14, // spacing from edges so rounding looks clean
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logo: {
    width: "100%", // banner width
    height: undefined,
    aspectRatio: 16 / 9, // adjust if your image is taller/shorter
    resizeMode: "cover",
    borderRadius: 30,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    color: "#000", // text visible
  },
  passwordContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 10,
  },
  passwordInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    paddingRight: 45,
    color: "#000",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  signupButton: {
    width: "100%",
    backgroundColor: "#0A66C2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  signupText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 15,
    color: "#10b981",
    fontSize: 15,
  },
});