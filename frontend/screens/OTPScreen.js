import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import Toast from "react-native-toast-message";

export default function OTPScreen({ route, navigation }) {
  const { name, email, password } = route.params;
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60); // 1 min timer
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // ⏱️ Start countdown
  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(countdown);
  }, [timer]);

  // ✅ Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Toast.show({ type: "error", text1: "Please enter OTP" });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://us-central1-uniswap-iitrpr.cloudfunctions.net/verifyOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "OTP verification failed");

      // ✅ OTP verified — create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        joinedAt: new Date(),
        trustScore: 100, // Optional: Add default trust score
      });

      Toast.show({
        type: "success",
        text1: "Account created successfully!",
        text2: `Welcome, ${name}!`,
      });

      // Usually better to replace with Main App or Login
      navigation.replace("Login"); 
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: String(error.message || "Please try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Resend OTP
  const handleResendOtp = async () => {
    try {
      setResending(true);
      const res = await fetch("https://us-central1-uniswap-iitrpr.cloudfunctions.net/sendOtpEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        Toast.show({
          type: "success",
          text1: "New OTP Sent!",
          text2: "Please check your email again.",
        });
        setTimer(60); // reset timer
      } else {
        throw new Error(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: String(error.message),
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>OTP sent to {email}</Text>

      <TextInput
        style={styles.otpInput}
        placeholder="Enter 6-digit OTP"
        placeholderTextColor="#888" // ✅ FIX: Makes placeholder visible (Dark Gray)
        keyboardType="numeric"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
      </TouchableOpacity>

      {timer > 0 ? (
        <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
      ) : (
        <TouchableOpacity
          style={[styles.resendButton, resending && { opacity: 0.6 }]}
          onPress={handleResendOtp}
          disabled={resending}
        >
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  otpInput: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#000", // ✅ FIX: Ensures typed numbers are black and visible
  },
  button: {
    width: "80%",
    backgroundColor: "#0A66C2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  timerText: {
    marginTop: 20,
    color: "#555",
  },
  resendButton: {
    marginTop: 20,
  },
  resendText: {
    color: "#10b981",
    fontWeight: "600",
  },
});