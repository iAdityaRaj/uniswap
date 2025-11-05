const functions = require("firebase-functions"); 
const admin = require("firebase-admin");
admin.initializeApp();

const { FieldValue } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const otpFunctions = require("./otpFunctions");
exports.sendOtpEmail = otpFunctions.sendOtpEmail;
exports.verifyOtp = otpFunctions.verifyOtp;


const db = admin.firestore();
require("dotenv").config();

const { FieldValue } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const otpFunctions = require("./otpFunctions");
exports.sendOtpEmail = otpFunctions.sendOtpEmail;
exports.verifyOtp = otpFunctions.verifyOtp;

const rental = require("./rentalFunctions"); 
const rentalFunctions = require("./rentalFunctions");
exports.createRental = rentalFunctions.createRental;

exports.markReturned = rentalFunctions.markReturned;
exports.confirmReturn = rentalFunctions.confirmReturn;

exports.checkRentalReminders = rentalFunctions.checkRentalReminders;

const db = admin.firestore();

// exports.restrictSignupDomain = onRequest((req, res) => {
//   const { email } = req.body;

//   if (!email || typeof email !== "string") {
//     return res.status(400).json({ error: "Valid email is required" });
//   }

//   const allowedDomain = "iitrpr.ac.in";
//   const emailParts = email.trim().toLowerCase().split("@");

//   if (emailParts.length !== 2) {
//     return res.status(400).json({ error: "Invalid email format" });
//   }

//   const domain = emailParts[1];

//   if (domain !== allowedDomain) {
//     logger.info(`Signup rejected for domain: ${domain}`);
//     return res.status(403).json({ message: "Access denied. Invalid domain." });
//   }

//   const username = emailParts[0];
//   const startsWithNumber = /^\d/.test(username);

//   if (!startsWithNumber) {
//     return res
//       .status(403)
//       .json({ message: "Access denied. Only student email format allowed." });
//   }

//   logger.info(`Signup allowed for student: ${email}`);
//   return res.json({ message: "Signup allowed", email });
// });


// CRUD 


// exports.addItem = functions.https.onRequest(async (req, res) => {
//   try {
//     console.log("Incoming request method:", req.method);
//     console.log("Incoming body:", req.body);

//     if (req.method !== "POST") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const { ownerUid, title, description, price, available, imageUrl } = req.body;

//     if (!ownerUid || !title || price === undefined) {
//       console.log("Validation failed - Missing required fields");
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const newItem = {
//       ownerUid,
//       title,
//       price,
//       description,
//       imageUrl,
//       available: available ?? true,
//       createdAt: FieldValue.serverTimestamp(), 
    

//     };

//     const docRef = await db.collection("items").add(newItem);
//     console.log("Item successfully added with ID:", docRef.id);

//     return res.status(201).json({ id: docRef.id, message: "Item added successfully" });
//   } catch (err) {
//     console.error("Error adding item:", err);
//     return res.status(500).json({ error: err.message || "Internal server error" });
//   }
// });


// exports.getItems = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "GET") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const snapshot = await admin
//       .firestore()
//       .collection("items")
//       .orderBy("createdAt", "desc")
//       .get();

//     const items = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     return res.status(200).json(items);
//   } catch (err) {
//     console.error("Error fetching items:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// exports.getItemById = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "GET") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const id = req.query.id || req.path.split("/").pop(); 
//     if (!id) {
//       return res.status(400).json({ error: "Item ID is required" });
//     }

//     const doc = await admin.firestore().collection("items").doc(id).get();

//     if (!doc.exists) {
//       return res.status(404).json({ error: "Item not found" });
//     }

//     return res.status(200).json({ id: doc.id, ...doc.data() });
//   } catch (err) {
//     console.error("Error fetching item:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// exports.updateItem = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "PUT" && req.method !== "PATCH") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const id = req.query.id || req.path.split("/").pop();
//     if (!id) {
//       return res.status(400).json({ error: "Item ID is required" });
//     }

//     const data = req.body;
//     if (!data || Object.keys(data).length === 0) {
//       return res.status(400).json({ error: "No update data provided" });
//     }

//     await admin.firestore().collection("items").doc(id).update({
//       ...data,
//       updatedAt: FieldValue.serverTimestamp(),
//     });

//     return res.status(200).json({ message: "Item updated successfully" });
//   } catch (err) {
//     console.error("Error updating item:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });


// exports.deleteItem = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "DELETE") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const id = req.query.id || req.path.split("/").pop();
//     if (!id) {
//       return res.status(400).json({ error: "Item ID is required" });
//     }

//     await admin.firestore().collection("items").doc(id).delete();

//     return res.status(200).json({ message: "Item deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting item:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

//user modules


exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const uid = user.uid;
    const userRef = db.collection("users").doc(uid);

    const userData = {
      uid,
      email: user.email || "",
      displayName: user.displayName || "",
      profilePhotoUrl: user.photoURL || "",
      trustScore: 5,
      listedItemsCount: 0,
      borrowedItemsCount: 0,
      joinedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true });
    console.log(`✅ Firestore user document created for UID: ${uid}`);
  } catch (err) {
    console.error("❌ Error creating user document:", err);
  }
});


// Get user by UID
exports.getUserByUid = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method not allowed" });

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Valid email is required" });
  }

  const allowedDomain = "iitrpr.ac.in";
  const emailParts = email.trim().toLowerCase().split("@");
    const uid = req.query.uid;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error getting user:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});


//  Update user profile (manually via API if needed)
exports.updateUser = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "PATCH" && req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid, displayName, profilePhotoUrl, bio } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    const userRef = db.collection("users").doc(uid);

    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (profilePhotoUrl) updates.profilePhotoUrl = profilePhotoUrl;
    if (bio) updates.bio = bio;
    updates.updatedAt = FieldValue.serverTimestamp();

    await userRef.update(updates);

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

  const username = emailParts[0];
  const startsWithNumber = /^\d/.test(username);

//Get all items listed by a specific user


exports.getUserItems = functions.https.onRequest(async (req, res) => {
  try {
    const uid = req.query.uid;
    if (!uid) {
      return res.status(400).json({ error: "User UID is required" });
    }

    console.log("🔍 Fetching all items to debug...");

    const allItemsSnapshot = await db.collection("items").get();
    allItemsSnapshot.forEach((doc) => {
      console.log("Doc:", doc.id, doc.data());
    });

    console.log("Filtering by UID:", uid);

    const snapshot = await db
      .collection("items")
      .where("ownerUid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    console.log("✅ Total items found:", snapshot.size);

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(items);
  } catch (err) {
    console.error("❌ Error fetching user items:", err);
    return res.status(500).json({ error: err.message });
  }
});


//  Create or Update User Document
exports.createOrUpdateUser = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid, email, displayName, profilePhotoUrl, bio } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: "UID and email are required" });
    }

    const userRef = db.collection("users").doc(uid);

    const userData = {
      uid,
      email,
      displayName: displayName || "",
      profilePhotoUrl: profilePhotoUrl || "",
      bio: bio || "",
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true });

    return res.status(200).json({ message: "User created/updated", uid });
  } catch (error) {
    console.error("Error in createOrUpdateUser:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// CRUD 


// exports.addItem = functions.https.onRequest(async (req, res) => {
//   try {
//     console.log("Incoming request method:", req.method);
//     console.log("Incoming body:", req.body);

//     if (req.method !== "POST") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const { ownerUid, title, description, price, available, imageUrl } = req.body;

//     if (!ownerUid || !title || price === undefined) {
//       console.log("Validation failed - Missing required fields");
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const newItem = {
//       ownerUid,
//       title,
//       price,
//       description,
//       imageUrl,
//       available: available ?? true,
//       createdAt: FieldValue.serverTimestamp(), 
    

//     };

//     const docRef = await db.collection("items").add(newItem);
//     console.log("Item successfully added with ID:", docRef.id);

//     return res.status(201).json({ id: docRef.id, message: "Item added successfully" });
//   } catch (err) {
//     console.error("Error adding item:", err);
//     return res.status(500).json({ error: err.message || "Internal server error" });
//   }
// });


// exports.getItems = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "GET") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const snapshot = await admin
//       .firestore()
//       .collection("items")
//       .orderBy("createdAt", "desc")
//       .get();

//     const items = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     return res.status(200).json(items);
//   } catch (err) {
//     console.error("Error fetching items:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// exports.getItemById = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "GET") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const id = req.query.id || req.path.split("/").pop(); 
//     if (!id) {
//       return res.status(400).json({ error: "Item ID is required" });
//     }

//     const doc = await admin.firestore().collection("items").doc(id).get();

//     if (!doc.exists) {
//       return res.status(404).json({ error: "Item not found" });
//     }

//     return res.status(200).json({ id: doc.id, ...doc.data() });
//   } catch (err) {
//     console.error("Error fetching item:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// exports.updateItem = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "PUT" && req.method !== "PATCH") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const id = req.query.id || req.path.split("/").pop();
//     if (!id) {
//       return res.status(400).json({ error: "Item ID is required" });
//     }

//     const data = req.body;
//     if (!data || Object.keys(data).length === 0) {
//       return res.status(400).json({ error: "No update data provided" });
//     }

//     await admin.firestore().collection("items").doc(id).update({
//       ...data,
//       updatedAt: FieldValue.serverTimestamp(),
//     });

//     return res.status(200).json({ message: "Item updated successfully" });
//   } catch (err) {
//     console.error("Error updating item:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });


// exports.deleteItem = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "DELETE") {
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     const id = req.query.id || req.path.split("/").pop();
//     if (!id) {
//       return res.status(400).json({ error: "Item ID is required" });
//     }

//     await admin.firestore().collection("items").doc(id).delete();

//     return res.status(200).json({ message: "Item deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting item:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

//user modules


exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const uid = user.uid;
    const userRef = db.collection("users").doc(uid);

    const userData = {
      uid,
      email: user.email || "",
      displayName: user.displayName || "",
      profilePhotoUrl: user.photoURL || "",
      trustScore: 5,
      listedItemsCount: 0,
      borrowedItemsCount: 0,
      joinedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true });
    console.log(`✅ Firestore user document created for UID: ${uid}`);
  } catch (err) {
    console.error("❌ Error creating user document:", err);
  }
});


// Get user by UID
exports.getUserByUid = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method not allowed" });

    const uid = req.query.uid;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error getting user:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});


//  Update user profile (manually via API if needed)
exports.updateUser = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "PATCH" && req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid, displayName, profilePhotoUrl, bio } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    const userRef = db.collection("users").doc(uid);

    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (profilePhotoUrl) updates.profilePhotoUrl = profilePhotoUrl;
    if (bio) updates.bio = bio;
    updates.updatedAt = FieldValue.serverTimestamp();

    await userRef.update(updates);

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


//  Get all items listed by a specific user


exports.getUserItems = functions.https.onRequest(async (req, res) => {
  try {
    const uid = req.query.uid;
    if (!uid) {
      return res.status(400).json({ error: "User UID is required" });
    }

    console.log("🔍 Fetching all items to debug...");

    const allItemsSnapshot = await db.collection("items").get();
    allItemsSnapshot.forEach((doc) => {
      console.log("Doc:", doc.id, doc.data());
    });

    console.log("Filtering by UID:", uid);

    const snapshot = await db
      .collection("items")
      .where("ownerUid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    console.log("✅ Total items found:", snapshot.size);

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(items);
  } catch (err) {
    console.error("❌ Error fetching user items:", err);
    return res.status(500).json({ error: err.message });
  }
});


//  Create or Update User Document
exports.createOrUpdateUser = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid, email, displayName, profilePhotoUrl, bio } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: "UID and email are required" });
    }

    const userRef = db.collection("users").doc(uid);

    const userData = {
      uid,
      email,
      displayName: displayName || "",
      profilePhotoUrl: profilePhotoUrl || "",
      bio: bio || "",
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true });

    return res.status(200).json({ message: "User created/updated", uid });
  } catch (error) {
    console.error("Error in createOrUpdateUser:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.triggerRentalReminders = functions.https.onRequest(async (req, res) => {
  try {
    await rental.processRentalReminders();
    res.status(200).json({ message: "Manual rental reminder check complete" });
  } catch (err) {
    console.error("Error running manual check:", err);
    res.status(500).json({ error: err.message });
  }
});
