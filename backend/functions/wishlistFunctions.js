const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ➕ Add Item to Wishlist
 * Endpoint: /addToWishlist
 * Method: POST
 */
exports.addToWishlist = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid, item } = req.body;

    if (!uid || !item || !item.itemId) {
      return res.status(400).json({ error: "uid and item with itemId are required" });
    }

    const userWishlistRef = db
      .collection("users")
      .doc(uid)
      .collection("wishlist")
      .doc(item.itemId);

    await userWishlistRef.set({
      ...item,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Wishlist item added for user: ${uid}, item: ${item.itemId}`);
    return res.status(200).json({ message: "Item added to wishlist" });
  } catch (err) {
    console.error("❌ Error adding to wishlist:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * ➖ Remove Item from Wishlist
 * Endpoint: /removeFromWishlist
 * Method: DELETE
 */
exports.removeFromWishlist = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid, itemId } = req.body;

    if (!uid || !itemId) {
      return res.status(400).json({ error: "uid and itemId are required" });
    }

    const itemRef = db.collection("users").doc(uid).collection("wishlist").doc(itemId);
    await itemRef.delete();

    console.log(`🗑️ Wishlist item removed for user: ${uid}, item: ${itemId}`);
    return res.status(200).json({ message: "Item removed from wishlist" });
  } catch (err) {
    console.error("❌ Error removing from wishlist:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 🔍 Get User Wishlist
 * Endpoint: /getWishlist?uid={userId}
 * Method: GET
 */
exports.getWishlist = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("wishlist")
      .orderBy("createdAt", "desc")
      .get();

    const wishlist = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`📦 Wishlist fetched for user: ${uid}, total: ${wishlist.length}`);
    return res.status(200).json(wishlist);
  } catch (err) {
    console.error("❌ Error fetching wishlist:", err);
    return res.status(500).json({ error: err.message });
  }
});