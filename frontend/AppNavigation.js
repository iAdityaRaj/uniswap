import React, { useState, useEffect } from "react";
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Modal, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "./firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import HomeScreen from "./screens/HomeScreen";
import ChatsScreen from "./screens/ChatsScreen";
import AddItemScreen from "./screens/AddItemScreen";
import MyAdsScreen from "./screens/MyAdsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RentItemScreen from "./screens/RentItemScreen";
import ShareItemScreen from "./screens/ShareItemScreen";
import EditItemScreen from "./screens/EditItemScreen";
import ItemDetailsScreen from "./screens/ItemDetailsScreen";
import ChatScreen from "./screens/ChatScreen";


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs({ navigation }) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0); // ✅ badge state

  // ✅ Live unread chat count
  useEffect(() => {
    const me = auth.currentUser;
    if (!me) return;

    const q = query(collection(db, "chats"), where("users", "array-contains", me.uid));
    const unsub = onSnapshot(q, (snap) => {
      let count = 0;
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.unreadCount?.[me.uid] > 0) {
          count += 1;
        }
      });
      setUnreadChats(count);
    });

    return unsub;
  }, []);

  const openSheet = () => setSheetVisible(true);
  const closeSheet = () => setSheetVisible(false);

  const goTo = (screen) => {
    closeSheet();
    setTimeout(() => navigation.navigate(screen), 200);
  };

  const AddButton = () => (
    <TouchableOpacity style={styles.fab} onPress={openSheet} activeOpacity={0.9}>
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
  );

  // ✅ Custom Chat icon with badge
  const ChatTabIcon = ({ color, size }) => (
    <View>
      <Ionicons name="chatbubble-outline" color={color} size={size} />
      {unreadChats > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadChats > 9 ? "9+" : unreadChats}
          </Text>
        </View>
      )}
    </View>
  );

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
            tabBarIcon: ChatTabIcon,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" color={color} size={size} />
            ),
          }}
        />

        <Tab.Screen
          name="Add"
          component={AddItemScreen}
          options={{
            tabBarButton: () => <AddButton />,
          }}
        />

        {/* ✅ Fixed internal route name */}
        <Tab.Screen
          name="MyAds"
          component={MyAdsScreen}
          options={{
            tabBarLabel: "My Ads",
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

      {/* ✅ Bottom Sheet */}
      <Modal transparent visible={sheetVisible} animationType="fade" onRequestClose={closeSheet}>
        <Pressable style={styles.backdrop} onPress={closeSheet}>
          <View />
        </Pressable>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>What would you like to do?</Text>

          <TouchableOpacity style={styles.sheetBtn} onPress={() => goTo("RentItem")}>
            <Ionicons name="pricetag-outline" size={20} color="#0A66C2" />
            <Text style={styles.sheetBtnText}>Rent an Item</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetBtn} onPress={() => goTo("ShareItem")}>
            <Ionicons name="share-social-outline" size={20} color="#0A66C2" />
            <Text style={styles.sheetBtnText}>Share an Item</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={closeSheet} style={styles.sheetCancel}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function AppNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen name="RentItem" component={RentItemScreen} />
      <Stack.Screen name="ShareItem" component={ShareItemScreen} />
      <Stack.Screen name="EditItem" component={EditItemScreen} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
      <Stack.Screen name="ChatsScreen" component={ChatsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
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
  fab: {
    backgroundColor: "#0A66C2",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    shadowColor: "#0A66C2",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: "absolute",
    right: -8,
    top: -4,
    backgroundColor: "red",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ddd",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
    color: "#222",
  },
  sheetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F3F7FF",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  sheetBtnText: { fontSize: 16, color: "#0A66C2", fontWeight: "600" },
  sheetCancel: { paddingVertical: 14, alignItems: "center", marginTop: 6 },
  sheetCancelText: { color: "#888", fontSize: 15, fontWeight: "500" },
});
});
