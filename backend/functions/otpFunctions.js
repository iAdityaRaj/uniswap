require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { FieldValue } = require("firebase-admin/firestore");

// ✅ Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/* -------------------- 🔐 EMAIL / SMTP CONFIG -------------------- */

console.log("🔍 Firebase Config Snapshot (otpFunctions):", JSON.stringify(functions.config(), null, 2));

// From .env (same as notifyProposalEmail)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

console.log("SMTP_HOST (otp):", SMTP_HOST);
console.log("SMTP_PORT (otp):", SMTP_PORT);
console.log("SMTP_USER prefix (otp):", SMTP_USER?.slice(0, 5), "…");
console.log("FROM_EMAIL (otp):", FROM_EMAIL);

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  transporter
    .verify()
    .then(() => console.log("✅ [otpFunctions] SMTP transporter ready"))
    .catch((err) => console.error("❌ [otpFunctions] SMTP verify failed:", err));
} else {
  console.warn("⚠️ [otpFunctions] SMTP credentials missing – OTP emails will be skipped.");
}

/* -------------------- ✉️ SEND OTP EMAIL -------------------- */
exports.sendOtpEmail = functions.https.onRequest(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Firestore
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    await db.collection("otp_verifications").doc(email).set({
      otp,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      verified: false,
    });

    // If we don't have a transporter, skip email but don't fail the request
    if (!transporter) {
      console.warn("[sendOtpEmail] No SMTP transporter – skipping email send for:", email);
      return res
        .status(200)
        .json({ message: "OTP generated and stored (email skipped – SMTP not configured)" });
    }

    const subject = "🔐 Verify Your Email – Uniswap IIT Ropar";

    const textBody = `Your OTP for Uniswap IIT Ropar is: ${otp}\nThis code expires in 5 minutes.`;

    // Beautiful HTML email template
    const htmlBody = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f5f7fa;padding:30px;">
        <div style="max-width:500px;margin:auto;background:#fff;padding:25px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <h2 style="text-align:center;color:#1a73e8;">Uniswap IIT Ropar</h2>
          <p style="font-size:16px;color:#333;">Hi there 👋,</p>
          <p style="font-size:15px;color:#333;">
            Your One-Time Password (OTP) for verifying your email address is:
          </p>
          <div style="text-align:center;margin:25px 0;">
            <span style="font-size:32px;font-weight:bold;color:#1a73e8;letter-spacing:3px;">${otp}</span>
          </div>
          <p style="font-size:14px;color:#666;">This OTP expires in <strong>5 minutes</strong>.</p>
          <hr style="margin:25px 0;border:none;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#999;text-align:center;">
            Please do not reply to this email.<br/>
            © ${new Date().getFullYear()} Uniswap IIT Ropar
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Uniswap IIT Ropar" <${FROM_EMAIL}>`,
      to: email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`✅ OTP email sent successfully to ${email}`);
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP (but OTP stored):", {
      message: err.message,
      code: err.code,
      response: err.response,
    });
    // Important: we ALREADY stored the OTP in Firestore, so user can still verify
    return res
      .status(200)
      .json({ message: "OTP generated (email best-effort)", error: err.message });
  }
});

/* -------------------- ✅ VERIFY OTP -------------------- */
exports.verifyOtp = functions.https.onRequest(async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ error: "Email and OTP are required" });

    const docRef = db.collection("otp_verifications").doc(email);
    const doc = await docRef.get();

    if (!doc.exists)
      return res.status(404).json({ error: "No OTP found for this email" });

    const data = doc.data();

    if (data.verified)
      return res.status(400).json({ error: "This email is already verified" });

    if (data.otp !== otp)
      return res.status(403).json({ error: "Invalid OTP" });

    if (!data.expiresAt || data.expiresAt.toDate() < new Date())
      return res.status(403).json({ error: "OTP expired" });

    await docRef.update({ verified: true });
    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ error: err.message });
  }
});