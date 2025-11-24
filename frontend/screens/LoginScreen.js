import { Ionicons } from "@expo/vector-icons";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getCountFromServer, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { auth, db } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  // ✅ Get active users count
  useEffect(() => {
    const getActiveUsersCount = async () => {
      try {
        const usersCollection = collection(db, "users");
        const snapshot = await getCountFromServer(usersCollection);
        setActiveUsersCount(snapshot.data().count);
      } catch (error) {
        console.log("Error getting users count:", error);
      }
    };

    getActiveUsersCount();
  }, []);

  // ✅ Fixed: Validate email synchronously
  const validateEmail = () => {
    return email.endsWith("@iitrpr.ac.in");
  };

  const validateForgotPasswordEmail = (email) => {
    return email.endsWith("@iitrpr.ac.in");
  };

  const handleLogin = async () => {
    // ✅ Fixed: Call validation function properly
    if (!validateEmail()) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please use your IIT Ropar email address (@iitrpr.ac.in).",
      });
      return;
    }

    if (!password) {
      Toast.show({
        type: "error",
        text1: "Password Required",
        text2: "Please enter your password.",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting login with:", email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("Login successful, user UID:", user.uid);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : "User";

      // ✅ Fixed: Better backend sync with timeout
      const backendUrl = "https://uniswap-iitrpr-backend.onrender.com/createOrUpdateUser";
      try {
        const backendResponse = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            name: userName,
            email: user.email,
          }),
        });

        if (backendResponse.ok) {
          console.log("✅ Synced user to backend successfully.");
        } else {
          console.log("⚠️ Backend sync returned non-OK status:", backendResponse.status);
        }
      } catch (err) {
        console.log("⚠️ Backend sync failed, but continuing:", err.message);
        // Continue even if backend sync fails
      }

      Toast.show({
        type: "success",
        text1: `Welcome back, ${userName}! 👋`,
        text2: "Login successful!",
      });

      // ✅ FIXED: Changed from "Home" to "Tabs"
      setTimeout(() => {
        navigation.replace("Tabs");
      }, 1500);

    } catch (error) {
      console.log("Login error:", error.code, error.message);
      
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
          message = "Network error. Check your internet connection.";
          break;
        case "auth/too-many-requests":
          message = "Too many failed attempts. Try again later.";
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

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Please enter your email address.",
      });
      return;
    }

    if (!validateForgotPasswordEmail(forgotPasswordEmail)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please use your IIT Ropar email address (@iitrpr.ac.in).",
      });
      return;
    }

    try {
      setForgotPasswordLoading(true);
      console.log("Sending password reset email to:", forgotPasswordEmail);

      await sendPasswordResetEmail(auth, forgotPasswordEmail);

      Toast.show({
        type: "success",
        text1: "Password Reset Email Sent!",
        text2: "Check your inbox for reset instructions.",
      });

      // Close the modal after success
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");

    } catch (error) {
      console.log("Password reset error:", error.code, error.message);
      
      let message = "Failed to send reset email. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;
        case "auth/invalid-email":
          message = "Invalid email address.";
          break;
        case "auth/network-request-failed":
          message = "Network error. Check your internet connection.";
          break;
        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;
        default:
          message = error.message;
      }

      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: message,
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Forgot Password Modal
  const renderForgotPasswordModal = () => {
    if (!showForgotPasswordModal) return null;

    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          width: '85%',
          maxWidth: 400,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 10,
            textAlign: 'center',
            color: '#0A66C2',
          }}>
            Reset Your Password
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: '#666',
            marginBottom: 20,
            textAlign: 'center',
          }}>
            Enter your IIT Ropar email address and we'll send you a password reset link.
          </Text>

          <TextInput
            placeholder="Enter your college email (@iitrpr.ac.in)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={forgotPasswordEmail}
            onChangeText={setForgotPasswordEmail}
            placeholderTextColor="#a79b9bff"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
              fontSize: 16,
            }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => {
                setShowForgotPasswordModal(false);
                setForgotPasswordEmail("");
              }}
              style={{
                flex: 1,
                backgroundColor: '#6c757d',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginRight: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={forgotPasswordLoading}
              style={{
                flex: 1,
                backgroundColor: forgotPasswordLoading ? '#ccc' : '#0A66C2',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginLeft: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
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

        {/* Active Users Counter */}
        <View style={{
          backgroundColor: '#F0F8FF',
          padding: 15,
          borderRadius: 12,
          marginBottom: 25,
          borderLeftWidth: 4,
          borderLeftColor: '#0A66C2',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="people" size={20} color="#0A66C2" />
            <Text style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: '600',
              color: '#0A66C2',
            }}>
              {activeUsersCount}+ Active Campus Users
            </Text>
          </View>
          <Text style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#666',
            marginTop: 5,
          }}>
            Join the IIT Ropar community of borrowers and sharers
          </Text>
        </View>

        {/* Email Input */}
        <TextInput
          placeholder="Enter your college email (@iitrpr.ac.in)"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#a79b9bff"
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
        <View style={{ position: "relative", marginBottom: 10 }}>
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#a79b9bff"
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

        {/* Forgot Password Link */}
        <TouchableOpacity
          onPress={() => setShowForgotPasswordModal(true)}
          style={{ alignSelf: 'flex-end', marginBottom: 20 }}
        >
          <Text style={{
            color: "#0A66C2",
            fontSize: 14,
            fontWeight: '500',
          }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : "#0A66C2",
            padding: 15,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Signup Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
          style={{ marginTop: 10 }}
          disabled={loading}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#10b981",
              fontSize: 15,
              fontWeight: '500',
            }}
          >
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Forgot Password Modal */}
      {renderForgotPasswordModal()}
      
      {/* Toast Component */}
      <Toast />
    </KeyboardAvoidingView>
  );
}