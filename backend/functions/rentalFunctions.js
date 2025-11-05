const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

require("dotenv").config();
const sgMail = require("@sendgrid/mail");
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Create Rental Record
 * Endpoint: /createRental
 * Method: POST
 * Body: { itemId, borrowerId, lenderId, startDate, endDate }
 */
exports.createRental = functions.https.onRequest(async (req, res) => {
  try {
    const { itemId, borrowerId, lenderId, startDate, endDate } = req.body;

    // Validate required fields
    if (!itemId || !borrowerId || !lenderId || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields: itemId, borrowerId, lenderId, startDate, endDate",
      });
    }

    // Create rental record
    const rentalData = {
      itemId,
      borrowerId,
      lenderId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdAt: FieldValue.serverTimestamp(),
      status: "active", // active | returned | overdue
      reminderSent: false,
      borrowerMarkedReturn: false,
      returnConfirmed: false,
      returnDate: null,
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

// ✅ Borrower marks an item as returned
exports.markReturned = functions.https.onRequest(async (req, res) => {
  try {
    const { rentalId } = req.body;
    if (!rentalId) return res.status(400).json({ error: "rentalId is required" });

    const rentalRef = db.collection("rentals").doc(rentalId);
    const rental = await rentalRef.get();

    if (!rental.exists)
      return res.status(404).json({ error: "Rental not found" });

    await rentalRef.update({
      borrowerMarkedReturn: true,
      returnDate: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ message: "Item marked as returned by borrower" });
  } catch (err) {
    console.error("Error marking return:", err);
    return res.status(500).json({ error: err.message });
  }
});


// ✅ Lender confirms the return
exports.confirmReturn = functions.https.onRequest(async (req, res) => {
  try {
    const { rentalId } = req.body;
    if (!rentalId) {
      return res.status(400).json({ error: "rentalId is required" });
    }

    const rentalRef = db.collection("rentals").doc(rentalId);
    const rentalSnap = await rentalRef.get();

    if (!rentalSnap.exists) {
      return res.status(404).json({ error: "Rental not found" });
    }

    const data = rentalSnap.data();

    if (!data.borrowerMarkedReturn) {
      return res
        .status(400)
        .json({ error: "Borrower has not marked the item as returned yet" });
    }

    // Safely extract and convert timestamps
    const returnDate = data.returnDate?.toDate
      ? data.returnDate.toDate()
      : new Date(data.returnDate);
    const returnDeadline = data.returnDeadline?.toDate
      ? data.returnDeadline.toDate()
      : new Date(data.returnDeadline);

    console.log(
      `🧾 returnDate: ${returnDate?.toISOString?.() || returnDate}, returnDeadline: ${
        returnDeadline?.toISOString?.() || returnDeadline
      }`
    );

    // Compare returnDate and returnDeadline
    if (returnDate <= returnDeadline) {
      console.log(`✅ ${data.borrowerId} returned on time. Trust score +5 applied.`);

      const userRef = db.collection("users").doc(data.borrowerId);
      await userRef.set(
        {
          trustScore: admin.firestore.FieldValue.increment(5),
        },
        { merge: true }
      );
    } else {
      console.log(`⚠️ ${data.borrowerId} returned late. No trust bonus applied.`);
    }

    await rentalRef.update({
      returnConfirmed: true,
      status: "returned",
    });

    return res.status(200).json({ message: "Return confirmed successfully" });
  } catch (err) {
    console.error("Error confirming return:", err);
    return res.status(500).json({ error: err.message });
  }
});




// 🔹 Scheduled Function: Runs every day at midnight
// rentalFunctions.js


const sendGridKey =
  (functions.config().sendgrid && functions.config().sendgrid.key) ||
  process.env.SENDGRID_API_KEY;
const fromEmail =
  (functions.config().sendgrid && functions.config().sendgrid.email) ||
  process.env.FROM_EMAIL;

if (sendGridKey && sendGridKey.startsWith("SG.")) {
  sgMail.setApiKey(sendGridKey);
  console.log("✅ SendGrid API key loaded successfully");
} else {
  console.error("🚨 SendGrid API key is missing or invalid! Please set it with firebase functions:config:set");
}

// 🧠 Shared logic (used by both scheduled + manual trigger)
async function processRentalReminders() {
  const now = new Date();
  const upcomingThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const rentalsSnapshot = await db
    .collection("rentals")
    .where("status", "==", "ongoing")
    .get();

  if (rentalsSnapshot.empty) {
    console.log("ℹ️ No active rentals to process.");
    return;
  }

  const updates = [];

  for (const doc of rentalsSnapshot.docs) {
    const rental = doc.data();
    const returnDeadline =
    rental.returnDeadline && rental.returnDeadline.toDate
    ? rental.returnDeadline.toDate()
    : new Date(rental.returnDeadline);

    console.log(`🕓 Checking rental: ${doc.id}, deadline: ${returnDeadline}`);

    if (!returnDeadline || isNaN(returnDeadline)) {
      console.log(`⚠️ Skipping ${doc.id} - invalid returnDeadline`);
      continue;
    }

    // 1️⃣ Reminder before deadline
    if (returnDeadline <= upcomingThreshold && !rental.reminderSent) {
      console.log(`📧 Sending reminder to ${rental.borrowerEmail} for ${rental.itemTitle}`);

      const msg = {
        to: rental.borrowerEmail,
        from: fromEmail,
        subject: "⏰ Reminder: Return your rented item soon!",
        html: `
          <div style="font-family:Arial,sans-serif;">
            <h3>Hey there 👋</h3>
            <p>This is a friendly reminder that your rental item <b>${rental.itemTitle}</b>
            is due for return by <b>${returnDeadline.toLocaleString("en-IN")}</b>.</p>
            <p>Please make sure to return it on time to maintain your trust score.</p>
          </div>
        `,
      };

      try {
        await sgMail.send(msg);
        console.log(`✅ Email sent to ${rental.borrowerEmail}`);
        updates.push(doc.ref.update({ reminderSent: true }));
      } catch (err) {
        console.error(`❌ Email send failed:`, err.message);
      }
    }

    // 2️⃣ Overdue handling
    if (returnDeadline < now && !rental.returnConfirmed) {
      console.log(`⚠️ Overdue item: ${rental.itemTitle} (Borrower: ${rental.borrowerId})`);

      updates.push(doc.ref.update({ status: "overdue" }));

      const userRef = db.collection("users").doc(rental.borrowerId);
      updates.push(
        userRef.set({ trustScore: admin.firestore.FieldValue.increment(-5) }, { merge: true })
      );
    }
  }

  await Promise.all(updates);
  console.log("✅ Rental reminders + trust score checks complete.");
}

// ⏰ Scheduled function
exports.checkRentalReminders = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    console.log("⏰ Scheduled rental reminder check started");
    await processRentalReminders();
    return null;
  });

// 🚀 Export shared logic for manual trigger
exports.processRentalReminders = processRentalReminders;