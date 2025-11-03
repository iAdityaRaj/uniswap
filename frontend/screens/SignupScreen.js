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
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
        text2: String(emailError || ""), // ✅ Safe string conversion
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: user.email,
        joinedAt: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Account created successfully!",
        text2: `Welcome, ${String(name || "User")}! 👋`, // ✅ Always safe string
      });

      // navigation.replace("Home");
    } catch (error) {
      let message = "Signup failed. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          message = "Email already in use. Try logging in instead.";
          break;
        case "auth/invalid-email":
          message = "Invalid email format.";
          break;
        case "auth/weak-password":
          message = "Password must be at least 6 characters.";
          break;
        case "auth/network-request-failed":
          message = "Network error. Check your connection.";
          break;
        default:
          message = error.message;
      }

      Toast.show({
        type: "error",
        text1: "Signup Failed",
        text2: String(message || ""), // ✅ Safe string conversion
      });
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
          <Text style={styles.title}>Create Your UniSwap Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[
              styles.input,
              emailError ? { borderColor: "red" } : { borderColor: "#ccc" },
            ]}
            placeholder="IIT Ropar Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          {/* 👁️ Password field with show/hide toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password (min 6 characters)"
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

          <TouchableOpacity
            style={[styles.signupButton, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupText}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Already have an account? Login</Text>
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
