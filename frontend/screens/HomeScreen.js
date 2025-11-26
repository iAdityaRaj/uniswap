import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ItemCard from "../components/ItemCard";
import { auth, db } from "../firebaseConfig";

const { width } = Dimensions.get('window');

// Color palette for different categories
const CATEGORY_COLORS = {
  'Books': { primary: '#FF6B6B', secondary: '#FFE8E8', icon: 'book' },
  'Electronics': { primary: '#4ECDC4', secondary: '#E0F7F6', icon: 'phone-portrait' },
  'Sports': { primary: '#45B7D1', secondary: '#E3F4FC', icon: 'basketball' },
  'Furniture': { primary: '#96CEB4', secondary: '#E8F6EF', icon: 'bed' },
  'Clothing': { primary: '#FFBE0B', secondary: '#FFF9E6', icon: 'shirt' },
  'Kitchen': { primary: '#FB5607', secondary: '#FFE8E0', icon: 'restaurant' },
  'Study': { primary: '#8338EC', secondary: '#F0E6FF', icon: 'school' },
  'Others': { primary: '#FF006E', secondary: '#FFE6F0', icon: 'grid' }
};

export default function HomeScreen({ navigation }) {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
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
  }, []);

  // ✅ Automatically refresh every time the Home screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS['Others'];
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <View style={styles.loadingAnimation}>
          <Ionicons name="swap-horizontal" size={50} color="#0A66C2" />
          <ActivityIndicator size="large" color="#0A66C2" style={styles.spinner} />
        </View>
        <Text style={styles.loadingText}>Discovering amazing items...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      
      {/* Gradient-like Header Section */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View>
            <Text style={styles.greeting}>Welcome to UniSwap</Text>
            <Text style={styles.subtitle}>Discover, Borrow & Share within Campus</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="swap-horizontal" size={32} color="#e9e9e9ff" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(itemsByCategory).length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={80} color="#FF6B6B" />
            </View>
            <Text style={styles.emptyTitle}>No items available yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share an item with the campus community!
            </Text>
          </View>
        ) : (
          Object.entries(itemsByCategory).map(([category, items]) => {
            const colors = getCategoryColor(category);
            return (
              <View key={category} style={styles.section}>
                {/* Colorful Category Header */}
                <View style={[styles.categoryHeader, { backgroundColor: colors.secondary }]}>
                  <View style={[styles.categoryIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons 
                      name={colors.icon} 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={[styles.itemCount, { color: colors.primary }]}>
                      {items.length} {items.length === 1 ? 'item' : 'items'} available
                    </Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{items.length}</Text>
                  </View>
                </View>

                <FlatList
                  data={items}
                  horizontal
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ItemCard item={item} navigation={navigation} />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  snapToInterval={width * 0.7 + 16}
                  decelerationRate="fast"
                />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  header: {
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 40,
    paddingBottom: 25,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    fontWeight: '500',
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 14,
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },
  container: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F8FAFF',
  },
  loadingAnimation: {
    alignItems: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 30,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  horizontalList: {
    paddingBottom: 8,
    paddingRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyIcon: {
    backgroundColor: '#FFE8E8',
    padding: 20,
    borderRadius: 40,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});