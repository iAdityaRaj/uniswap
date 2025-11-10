import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";

const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";
const BLUE = "#0A66C2";
const GREEN = "#16a34a";
const RED = "#DC2626";

export default function MyRentalsScreen() {
  const user = auth.currentUser;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [selectedTab, setSelectedTab] = useState("borrowed");

  // ✅ Helper: Normalize Firestore booleans
  const normalizeRental = (r) => ({
    ...r,
    borrowerMarkedReturn:
      r.borrowerMarkedReturn === true ||
      r.borrowerMarkedReturn === "true" ||
      r.borrowerMarkedReturn === 1,
    returnConfirmed:
      r.returnConfirmed === true ||
      r.returnConfirmed === "true" ||
      r.returnConfirmed === 1,
  });

  // ✅ Fetch rentals
  const fetchRentals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/getUserRentals?uid=${user.uid}`);
      const data = await res.json();
      if (Array.isArray(data)) setRentals(data.map(normalizeRental));
      else console.error("Unexpected data format:", data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch rentals");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  // ✅ Borrower marks returned (instant UI + backend)
  const markAsReturned = async (rentalId) => {
    // await fetchRentals();
    // Optimistic UI
    setRentals((prev) =>
      prev.map((r) =>
        r.id === rentalId ? { ...r, borrowerMarkedReturn: true } : r
      )
    );

    try {
      const res = await fetch(`${BASE_URL}/markReturned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId }),
      });
      const data = await res.json();
      if (!data.success && !data.message?.includes("Marked")) {
        throw new Error("Failed response");
      }
      fetchRentals(); // re-sync
    } catch (err) {
      Alert.alert("Error", "Could not mark as returned.");
      console.log(err);
      fetchRentals();
    }
  };

  // ✅ Lender confirms return (instant UI + backend)
  const confirmReturn = async (rentalId) => {
    setRentals((prev) =>
      prev.map((r) =>
        r.id === rentalId
          ? { ...r, returnConfirmed: true, borrowerMarkedReturn: true }
          : r
      )
    );

    try {
      const res = await fetch(`${BASE_URL}/confirmReturn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId }),
      });
      const data = await res.json();
      if (!data.success && !data.message?.includes("confirmed")) {
        throw new Error("Failed response");
      }
      fetchRentals();
    } catch (err) {
      Alert.alert("Error", "Could not confirm return.");
      console.log(err);
      fetchRentals();
    }
  };

  // ✅ Filter rentals for tab
  const displayedRentals = rentals.filter((r) =>
    selectedTab === "borrowed"
      ? r.borrowerId === user?.uid
      : r.lenderId === user?.uid
  );

  // ✅ Render card
  const renderRentalCard = (rental) => {
    const isBorrower = rental.borrowerId === user?.uid;
    const isLender = rental.lenderId === user?.uid;

    const start = rental.startDate?._seconds
      ? new Date(rental.startDate._seconds * 1000)
      : new Date(rental.startDate);
    const end = rental.endDate?._seconds
      ? new Date(rental.endDate._seconds * 1000)
      : new Date(rental.endDate);

    const startStr = !isNaN(start) ? start.toLocaleDateString() : "Invalid Date";
    const endStr = !isNaN(end) ? end.toLocaleDateString() : "Invalid Date";

    const statusColor =
      rental.status === "active"
        ? GREEN
        : rental.status === "overdue"
        ? RED
        : rental.status === "returned"
        ? BLUE
        : "#FACC15";

    return (
      <View key={rental.id} style={styles.card}>
        <Image
          source={
            rental.itemImage
              ? { uri: rental.itemImage }
              : require("../assets/category_images/others.png")
          }
          style={styles.image}
        />

        <View style={styles.cardContent}>
          <Text style={styles.title}>{rental.itemTitle || "Untitled"}</Text>
          <Text style={styles.dateText}>
            {startStr} → {endStr}
          </Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {rental.status?.toUpperCase() || "UNKNOWN"}
          </Text>

          {/* Borrower */}
          {isBorrower &&
            rental.status === "active" &&
            !rental.borrowerMarkedReturn && (
              <TouchableOpacity
                style={styles.returnButton}
                onPress={() => markAsReturned(rental.id)}
              >
                <Ionicons name="checkmark-done" size={18} color="#fff" />
                <Text style={styles.buttonText}>Mark as Returned</Text>
              </TouchableOpacity>
            )}

          {/* Lender - borrower marked returned */}
          {isLender &&
            rental.status === "active" &&
            rental.borrowerMarkedReturn &&
            !rental.returnConfirmed && (
              <View>
                <Text
                  style={{
                    color: "#f59e0b",
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Borrower marked this item as returned
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.returnButton,
                      { backgroundColor: GREEN, flex: 1, marginRight: 6 },
                    ]}
                    onPress={() => confirmReturn(rental.id)}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Confirm Return</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.returnButton,
                      { backgroundColor: RED, flex: 1, marginLeft: 6 },
                    ]}
                    onPress={() =>
                      Alert.alert(
                        "Reject Return?",
                        "Are you sure you want to reject this return?",
                        [{ text: "Cancel" }, { text: "Reject", style: "destructive" }]
                      )
                    }
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          {/* Lender - Awaiting */}
          {isLender &&
            rental.status === "active" &&
            !rental.borrowerMarkedReturn &&
            !rental.returnConfirmed && (
              <Text style={{ color: "#f59e0b", fontWeight: "600", marginTop: 6 }}>
                Awaiting borrower to mark return
              </Text>
            )}

          {/* Return confirmed */}
          {rental.returnConfirmed && (
            <Text
              style={[
                styles.status,
                { color: BLUE, marginTop: 6, fontWeight: "700" },
              ]}
            >
              ✅ Return Confirmed
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Loader
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={{ marginTop: 10 }}>Loading rentals...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top : 10 },
      ]}
    >
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "borrowed" && styles.tabActive]}
          onPress={() => setSelectedTab("borrowed")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "borrowed" && styles.tabTextActive,
            ]}
          >
            Borrowed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "lent" && styles.tabActive]}
          onPress={() => setSelectedTab("lent")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "lent" && styles.tabTextActive,
            ]}
          >
            Lent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchRentals}>
        <Ionicons name="refresh" size={18} color={BLUE} />
        <Text style={styles.refreshText}>Refresh Rentals</Text>
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {displayedRentals.length === 0 ? (
          <Text style={styles.emptyText}>No rentals found.</Text>
        ) : (
          displayedRentals.map((r) => renderRentalCard(r))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: BLUE },
  tabText: { color: "#888", fontWeight: "600", fontSize: 16 },
  tabTextActive: { color: BLUE },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  refreshBtn: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 8,
  },
  refreshText: { color: BLUE, fontWeight: "600", marginLeft: 6 },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#eee" },
  cardContent: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: "700", color: "#222" },
  dateText: { color: "#666", marginTop: 4, fontSize: 13 },
  status: { fontWeight: "700", marginTop: 6, fontSize: 13 },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN,
    marginTop: 8,
    paddingVertical: 8,
    justifyContent: "center",
    borderRadius: 6,
  },
  buttonText: { color: "#fff", fontWeight: "700", marginLeft: 6, fontSize: 14 },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 40,
    fontSize: 16,
  },
});