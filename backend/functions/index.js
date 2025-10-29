const functions = require("firebase-functions"); 
const admin = require("firebase-admin");
admin.initializeApp();

const { FieldValue } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const db = admin.firestore();

exports.restrictSignupDomain = onRequest((req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Valid email is required" });
  }

  const allowedDomain = "iitrpr.ac.in";
  const emailParts = email.trim().toLowerCase().split("@");

  if (emailParts.length !== 2) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const domain = emailParts[1];

  if (domain !== allowedDomain) {
    logger.info(`Signup rejected for domain: ${domain}`);
    return res.status(403).json({ message: "Access denied. Invalid domain." });
  }

  const username = emailParts[0];
  const startsWithNumber = /^\d/.test(username);

  if (!startsWithNumber) {
    return res
      .status(403)
      .json({ message: "Access denied. Only student email format allowed." });
  }

  logger.info(`Signup allowed for student: ${email}`);
  return res.json({ message: "Signup allowed", email });
});


// CRUD 


exports.addItem = functions.https.onRequest(async (req, res) => {
  try {
    console.log("Incoming request method:", req.method);
    console.log("Incoming body:", req.body);

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { ownerUid, title, description, price, available, imageUrl } = req.body;

    if (!ownerUid || !title || price === undefined) {
      console.log("Validation failed - Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newItem = {
      ownerUid,
      title,
      price,
      description,
      imageUrl,
      available: available ?? true,
      createdAt: FieldValue.serverTimestamp(), // ✅ fixed
    };

    const docRef = await db.collection("items").add(newItem);
    console.log("Item successfully added with ID:", docRef.id);

    return res.status(201).json({ id: docRef.id, message: "Item added successfully" });
  } catch (err) {
    console.error("Error adding item:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});


exports.getItems = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const snapshot = await admin
      .firestore()
      .collection("items")
      .orderBy("createdAt", "desc")
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

exports.getItemById = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query.id || req.path.split("/").pop(); 
    if (!id) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const doc = await admin.firestore().collection("items").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error fetching item:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

exports.updateItem = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "PUT" && req.method !== "PATCH") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query.id || req.path.split("/").pop();
    if (!id) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    await admin.firestore().collection("items").doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ message: "Item updated successfully" });
  } catch (err) {
    console.error("Error updating item:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


exports.deleteItem = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query.id || req.path.split("/").pop();
    if (!id) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    await admin.firestore().collection("items").doc(id).delete();

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Error deleting item:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});