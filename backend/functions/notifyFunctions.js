require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ---------- CONFIG ----------
const config = functions.config() || {};
const smtpConfig = config.smtp || {};

const SMTP_USER =
  smtpConfig.user ||
  process.env.SMTP_USER;

const SMTP_PASS =
  smtpConfig.pass ||
  process.env.SMTP_PASS;

const SMTP_HOST =
  smtpConfig.host ||
  process.env.SMTP_HOST ||
  "smtp.gmail.com";

const SMTP_PORT = Number(
  smtpConfig.port ||
  process.env.SMTP_PORT ||
  465
);

const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  SMTP_USER; // send from same account by default

console.log("SMTP_HOST:", SMTP_HOST);
console.log("SMTP_PORT:", SMTP_PORT);
console.log("SMTP_USER prefix:", SMTP_USER?.slice(0, 3), "…");
console.log("FROM_EMAIL:", FROM_EMAIL);

// Create transporter (Gmail via SSL)
let transporter = null;
if (!SMTP_USER || !SMTP_PASS) {
  console.warn("⚠️ SMTP credentials missing – emails will be skipped.");
} else {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log("✅ Nodemailer transporter configured");
}

// ---------- FUNCTION ----------
exports.notifyProposalEmail = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {
      recipientId,
      recipientEmail,
      senderId,
      senderName,
      itemTitle,
      startDate,
      endDate,
      text,
      itemImage,
      chatId,
    } = req.body || {};

    // Resolve recipient email
    let toEmail = recipientEmail;
    if (!toEmail && recipientId) {
      const u = await db.doc(`users/${recipientId}`).get();
      if (u.exists) toEmail = u.data().email;
    }

    if (!toEmail) {
      console.warn("notifyProposalEmail: No recipient email", { recipientId, recipientEmail });
      return res.status(400).send("No recipient email found");
    }

    // Optional opt-out
    if (recipientId) {
      const userSnap = await db.doc(`users/${recipientId}`).get();
      if (userSnap.exists) {
        const user = userSnap.data();
        if (user.notifications && user.notifications.email === false) {
          console.log("User opted out of email notifications:", recipientId);
          return res.status(200).send("User opted out");
        }
      }
    }

    const niceStart = startDate ? new Date(startDate).toLocaleDateString() : "";
    const niceEnd = endDate ? new Date(endDate).toLocaleDateString() : "";
    const senderPretty = senderName || "Someone";
    const chatDeepLink = chatId ? `uniswap://chat/${chatId}` : "";
    const webChatUrl = chatId ? `https://uniswap-iitrpr.web.app/chats/${chatId}` : "";

    const subject = `New message on Uniswap — rental proposal for "${itemTitle || ""}"`;

    const textBody =
      `${senderPretty} sent you a rental proposal for "${itemTitle || ""}" (${niceStart} → ${niceEnd}).\n\n` +
      `${text || ""}\n\n` +
      `Open the Uniswap app to reply: ${webChatUrl || "open your Uniswap app"}`;

    const htmlBody = `...`;// keep your existing HTML template here

    // If SMTP not configured, don’t break the app
    if (!transporter) {
      console.warn("Skipping email send – no SMTP configured. Would have sent to:", toEmail);
      return res.status(200).send("Proposal processed (email skipped)");
    }

    const mailOptions = {
      from: `"Uniswap" <${FROM_EMAIL}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Email sent to", toEmail);
    } catch (err) {
      console.error("❌ Email send failed (but request will still succeed):", {
        message: err.message,
        code: err.code,
        response: err.response,
      });
      // DO NOT fail the request just because email failed
    }

    return res.status(200).send("Proposal processed (email best-effort)");
  } catch (err) {
    console.error("notifyProposalEmail error:", err);
    return res.status(500).send("Internal Server Error");
  }
});