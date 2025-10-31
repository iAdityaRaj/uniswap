import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AddItemScreen from "./screens/AddItemScreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import EditItemScreen from "./screens/EditItemScreen";
import HomeScreen from "./screens/HomeScreen";
import ItemDetailsScreen from "./screens/ItemDetailsScreen";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
        <Stack.Screen
          name="EditItem"
          component={EditItemScreen}
          options={{ title: "Edit Item" }}
        />
        <Stack.Screen
          name="AddItem"
          component={AddItemScreen}
          options={{ title: "Add New Item" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "My Profile" }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
