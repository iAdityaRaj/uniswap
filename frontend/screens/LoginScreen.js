import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    if (!email.endsWith("@iitrpr.ac.in")) {
      Alert.alert("Access Denied", "Please use your IIT Ropar email ID.");
      return;
    }

    // ✅ Only check password strength during signup
    if (isSignup && password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        // Signup flow
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          joinedAt: new Date(),
        });

        Alert.alert("Account Created", "Welcome to Borrow & Swap!");
        setIsSignup(false); // 👈 Switch to login page
        setEmail("");       // 👈 Clear email field
        setPassword("");    // 👈 Clear password field
      } else {
        // Login flow
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert("Login Successful", "Welcome back!");
        navigation.replace("Home");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>
            {isSignup ? "Create Account" : "Login to UniSwap"}
          </Text>

          <TextInput
            placeholder="enter IIT Ropar Email"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? isSignup
                  ? "Creating..."
                  : "Logging in..."
                : isSignup
                ? "Sign Up"
                : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
            <Text style={styles.toggleText}>
              {isSignup
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0a3960",
    marginBottom: 40,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  toggleText: {
    color: "#0a3960",
    textAlign: "center",
    marginTop: 15,
  },
});
