import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeScreen from "./screens/HomeScreen";
import ChatsScreen from "./screens/ChatsScreen";
import AddItemScreen from "./screens/AddItemScreen";
import MyAdsScreen from "./screens/MyAdsScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function AppNavigation() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }} edges={["bottom"]}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#0A66C2",
          tabBarInactiveTintColor: "#8e8e8e",
          tabBarStyle: styles.tabBarStyle,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Chats"
          component={ChatsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddItemScreen}
          options={{
            tabBarIcon: () => (
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" color="#fff" size={32} />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="My Ads"
          component={MyAdsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    borderTopWidth: 0,
    paddingBottom: 5,
  },
  addButton: {
    backgroundColor: "#0A66C2",
    borderRadius: 50,
    padding: 14,
    bottom: 20,
    shadowColor: "#0A66C2",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
