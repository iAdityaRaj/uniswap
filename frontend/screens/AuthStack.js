import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// 1. Import the missing screens
import SplashScreen from "./SplashScreen";
import WelcomeScreen from "./WelcomeScreen"; 
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import OTPScreen from "./OTPScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  console.log("AuthStack loaded ✅");

  return (
    <Stack.Navigator
      // 2. Set the starting screen to Splash
      initialRouteName="SplashScreen"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* 3. Add the screens to the stack */}
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
    </Stack.Navigator>
  );
}