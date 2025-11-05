import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import ItemCard from "../components/ItemCard";

export default function HomeScreen({ navigation }) {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const user = auth.currentUser;
        const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const items = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!user || data.userId !== user.uid) {
            items.push({ id: doc.id, ...data });
          }
        });

        const grouped = {};
        items.forEach((item) => {
          const cat = item.category || "Others";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        });

        setItemsByCategory(grouped);
      } catch (err) {
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0A66C2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(itemsByCategory).length === 0 ? (
          <Text style={styles.empty}>No items available yet.</Text>
        ) : (
          Object.entries(itemsByCategory).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.categoryTitle}>{category}</Text>

              <FlatList
                data={items}
                horizontal
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ItemCard item={item} navigation={navigation} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  container: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
    paddingBottom: 100, // prevents overlap with bottom tab
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 18,
  },
  categoryTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#0A66C2",
    marginBottom: 14,
  },
  horizontalList: {
    paddingBottom: 6,
  },
  empty: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    marginTop: 50,
  },
});
