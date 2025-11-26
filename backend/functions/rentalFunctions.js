
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
require("dotenv").config();
const sgMail = require("@sendgrid/mail");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.initializeUser = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = db.collection("users").doc(user.uid);
    await userRef.set(
      {
        email: user.email || null,
        name: user.displayName || "New User",
        trustScore: 100,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`✅ Initialized user ${user.uid} with trustScore 100`);
  } catch (err) {
    console.error("❌ Error initializing user:", err);
  }
});

/* -------------------------------------------------------------------------- */
/*                             CREATE RENTAL RECORD                           */
/* -------------------------------------------------------------------------- */
exports.createRental = functions.https.onRequest(async (req, res) => {
  try {
    const { itemId, borrowerId, lenderId, startDate, endDate, itemTitle, itemImage } = req.body;

    if (!itemId || !borrowerId || !lenderId || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields: itemId, borrowerId, lenderId, startDate, endDate",
      });
    }

    const rentalData = {
      itemId,
      borrowerId,
      lenderId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdAt: FieldValue.serverTimestamp(),
      status: "active",
      borrowerMarkedReturn: false,
      returnConfirmed: false,
      returnDate: null,
      itemTitle: itemTitle || null,
      itemImage: itemImage || null,
    };

    const rentalRef = await db.collection("rentals").add(rentalData);
    return res.status(200).json({
      message: "Rental created successfully",
      rentalId: rentalRef.id,
    });
  } catch (error) {
    console.error("Error creating rental:", error);
    return res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                          BORROWER MARKS RETURNED                           */
/* -------------------------------------------------------------------------- */
exports.markReturned = functions.https.onRequest(async (req, res) => {
  try {
    const { rentalId } = req.body;

    if (!rentalId) {
      return res.status(400).json({ success: false, message: "Missing rentalId" });
    }

    const rentalRef = db.collection("rentals").doc(rentalId);
    const snap = await rentalRef.get();

    if (!snap.exists) {
      return res.status(404).json({ success: false, message: "Rental not found" });
    }

    await rentalRef.update({
      borrowerMarkedReturn: true,
      status: "active", // still active until lender confirms
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.json({
      success: true,
      message: "Marked as returned (awaiting lender confirmation)",
    });
  } catch (err) {
    console.error("markReturned error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                          LENDER CONFIRMS RETURN                            */
/* -------------------------------------------------------------------------- */
/**
 * ✅ Updates trustScore and posts message to chat
 * +20 if on time, -20 if late
 */
exports.confirmReturn = functions.https.onRequest(async (req, res) => {
  try {
    const { rentalId } = req.body;
    if (!rentalId) return res.status(400).json({ success: false, message: "Missing rentalId" });

    const rentalRef = db.collection("rentals").doc(rentalId);
    const snap = await rentalRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: "Rental not found" });

    const rentalData = snap.data();
    const now = new Date();
    const endDate = rentalData.endDate?.toDate
      ? rentalData.endDate.toDate()
      : new Date(rentalData.endDate);
    const isOnTime = !isNaN(endDate) ? now <= endDate : true;

    // Update rental record
    await rentalRef.update({
      returnConfirmed: true,
      borrowerMarkedReturn: true,
      status: "returned",
      returnDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      returnedLate: !isOnTime,
    });

    // Update trustScore logic
    if (rentalData.borrowerId) {
      const borrowerRef = db.collection("users").doc(rentalData.borrowerId);
      const borrowerSnap = await borrowerRef.get();
      const BASE = 100;
      const CHANGE = isOnTime ? 20 : -20;

      if (!borrowerSnap.exists) {
        await borrowerRef.set(
          {
            trustScore: BASE + CHANGE,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        const borrowerData = borrowerSnap.data();
        const current = typeof borrowerData.trustScore === "number" ? borrowerData.trustScore : BASE;
        await borrowerRef.set(
          {
            trustScore: current + CHANGE,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // ✅ Optional: Post system message to chat
      const chatId = [rentalData.borrowerId, rentalData.lenderId].sort().join("_");
      const messageText = isOnTime
        ? `✅ Borrower returned "${rentalData.itemTitle}" on time (+20 trustScore)`
        : `⚠️ Borrower returned "${rentalData.itemTitle}" late (-20 trustScore)`;

      await db.collection("chats").doc(chatId).collection("messages").add({
        text: messageText,
        type: "system",
        createdAt: FieldValue.serverTimestamp(),
      });

      await db.collection("chats").doc(chatId).set(
        {
          lastMessage: messageText,
          lastMessageAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return res.json({
      success: true,
      message: isOnTime
        ? "✅ Return confirmed — borrower returned on time (+20 trustScore)"
        : "⚠️ Return confirmed — borrower returned late (-20 trustScore)",
    });
  } catch (err) {
    console.error("confirmReturn error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                       REMINDER + OVERDUE CHECK (CRON)                     */
/* -------------------------------------------------------------------------- */
const sendGridKey =
  (functions.config().sendgrid && functions.config().sendgrid.key) ||
  process.env.SENDGRID_API_KEY;
const fromEmail =
  (functions.config().sendgrid && functions.config().sendgrid.email) ||
  process.env.FROM_EMAIL;

if (sendGridKey?.startsWith("SG.")) {
  sgMail.setApiKey(sendGridKey);
  console.log("✅ SendGrid configured");
} else {
  console.warn("⚠️ SendGrid key not found — email reminders disabled");
}

async function processRentalReminders() {
  const now = new Date();
  const upcomingThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const rentalsSnap = await db.collection("rentals").where("status", "==", "active").get();
  if (rentalsSnap.empty) return console.log("ℹ️ No active rentals found.");

  const ops = [];

  for (const doc of rentalsSnap.docs) {
    const rental = doc.data();
    const ref = doc.ref;

    const returnDeadline =
      rental.endDate?.toDate?.() || new Date(rental.endDate || rental.returnDeadline);
    if (!returnDeadline || isNaN(returnDeadline)) continue;

    // Reminder 24h before deadline
    if (returnDeadline <= upcomingThreshold && !rental.reminderSent) {
      if (sendGridKey?.startsWith("SG.") && rental.borrowerEmail) {
        const msg = {
          to: rental.borrowerEmail,
          from: fromEmail,
          subject: "⏰ Reminder: Return your rented item soon!",
          html: `<p>Your rental <b>${rental.itemTitle}</b> is due by <b>${returnDeadline.toLocaleString()}</b>.</p>`,
        };
        try {
          await sgMail.send(msg);
          ops.push(ref.update({ reminderSent: true }));
        } catch (err) {
          console.error("❌ Failed to send reminder:", err);
        }
      }
    }

    // Overdue logic
    if (returnDeadline < now && !rental.returnConfirmed && rental.status !== "overdue") {
      console.log(`⚠️ Marking rental ${doc.id} as overdue`);
      ops.push(ref.update({ status: "overdue", updatedAt: FieldValue.serverTimestamp() }));

      if (rental.borrowerId) {
        const borrowerRef = db.collection("users").doc(rental.borrowerId);
        const borrowerSnap = await borrowerRef.get();
        const BASE = 100;
        const CHANGE = -20;
        const borrowerData = borrowerSnap.exists ? borrowerSnap.data() : {};
        const current = typeof borrowerData.trustScore === "number" ? borrowerData.trustScore : BASE;
        await borrowerRef.set(
          {
            trustScore: current + CHANGE,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }

  await Promise.all(ops);
  console.log("✅ Rental reminder & overdue checks complete.");
}

exports.checkRentalReminders = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    console.log("⏰ Scheduled reminder check started");
    await processRentalReminders();
    return null;
  });

/* -------------------------------------------------------------------------- */
/*                            FETCH USER RENTALS                              */
/* -------------------------------------------------------------------------- */
exports.getUserRentals = functions.https.onRequest(async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "uid required" });

    const rentalsRef = db.collection("rentals");
    const borrowerSnap = await rentalsRef.where("borrowerId", "==", uid).get();
    const lenderSnap = await rentalsRef.where("lenderId", "==", uid).get();

    const rentals = [
      ...borrowerSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      ...lenderSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ];

    return res.status(200).json(rentals);
  } catch (err) {
    console.error("❌ getUserRentals error:", err);
    return res.status(500).json({ error: err.message });
  }
});