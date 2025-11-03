
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const sgMail = require("@sendgrid/mail");
// const { FieldValue } = require("firebase-admin/firestore");

// // Initialize Firebase only once
// if (!admin.apps.length) {
//   admin.initializeApp();
// }
// const db = admin.firestore();

// // ✅ Safe SendGrid config loading (with fallback for local and deployed environments)
// const sendgridConfig = (functions.config().sendgrid || {});
// const sendGridKey =
//   sendgridConfig.key ||
//   process.env.SENDGRID_API_KEY ||
//   "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";

// const fromEmail =
//   sendgridConfig.email ||
//   process.env.FROM_EMAIL ||
//   "2025aim1001@iitrpr.ac.in";

// console.log("🔥 Firebase Config Snapshot:", sendgridConfig);
// console.log("🔹 SendGrid key loaded:", sendGridKey.startsWith("SG."));
// console.log("🔹 From email:", fromEmail);

// sgMail.setApiKey(sendGridKey);


// exports.sendOtpEmail = functions.https.onRequest(async (req, res) => {
//   try {
//     const email = req.body.email;
//     if (!email) return res.status(400).json({ error: "Email is required" });

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
//     await db.collection("otp_verifications").doc(email).set({
//       otp,
//       createdAt: FieldValue.serverTimestamp(),
//       expiresAt,
//       verified: false,
//     });

//     const msg = {
//       to: email,
//       from: {
//         email: fromEmail,
//         name: "Uniswap IIT Ropar",
//       },
//       subject: "🔐 Verify Your Email – Uniswap IIT Ropar",
//       html: `
//         <div style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f5f7fa;padding:30px;">
//           <div style="max-width:500px;margin:auto;background:#fff;padding:25px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
//             <h2 style="text-align:center;color:#1a73e8;">Uniswap IIT Ropar</h2>
//             <p style="font-size:16px;color:#333;">Hi there 👋,</p>
//             <p style="font-size:15px;color:#333;">
//               Your One-Time Password (OTP) for verifying your email address is:
//             </p>
//             <div style="text-align:center;margin:25px 0;">
//               <span style="font-size:32px;font-weight:bold;color:#1a73e8;letter-spacing:3px;">${otp}</span>
//             </div>
//             <p style="font-size:14px;color:#666;">This OTP expires in <strong>5 minutes</strong>.</p>
//             <hr style="margin:25px 0;border:none;border-top:1px solid #eee;">
//             <p style="font-size:12px;color:#999;text-align:center;">
//               Please do not reply to this email.<br/>
//               © ${new Date().getFullYear()} Uniswap IIT Ropar
//             </p>
//           </div>
//         </div>
//       `,
//     };

//     await sgMail.send(msg);

//     return res.status(200).json({ message: "OTP sent successfully" });
//   } catch (err) {
//     console.error("Error sending OTP:", err);
//     return res.status(500).json({ error: err.message });
//   }
// });


// exports.verifyOtp = functions.https.onRequest(async (req, res) => {
//   try {
//     let body = req.body;
//     if (typeof body === "string") body = JSON.parse(body);

//     const { email, otp } = body;
//     if (!email || !otp)
//       return res.status(400).json({ error: "Email and OTP required" });

//     const docRef = db.collection("otp_verifications").doc(email);
//     const doc = await docRef.get();

//     if (!doc.exists)
//       return res.status(404).json({ error: "No OTP found for this email" });

//     const data = doc.data();

//     if (data.verified)
//       return res.status(400).json({ error: "Already verified" });

//     if (data.otp !== otp)
//       return res.status(403).json({ error: "Invalid OTP" });

//     //Safely check expiry
//     if (!data.expiresAt || data.expiresAt.toDate() < new Date())
//       return res.status(403).json({ error: "OTP expired" });

//     await docRef.update({ verified: true });
//     return res.status(200).json({ message: "OTP verified successfully" });
//   } catch (err) {
//     console.error("Error verifying OTP:", err);
//     return res.status(500).json({ error: err.message });
//   }
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const { FieldValue } = require("firebase-admin/firestore");

// ✅ Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/* -------------------- 🔐 SECURE CONFIG HANDLING -------------------- */
// Prefer Firebase config → then environment variables
const config = functions.config() || {};

const SENDGRID_API_KEY =
  (config.sendgrid && config.sendgrid.key) || process.env.SENDGRID_API_KEY;

const FROM_EMAIL =
  (config.sendgrid && config.sendgrid.email) ||
  process.env.FROM_EMAIL ||
  "2025aim1001@iitrpr.ac.in"; // Use a verified sender or domain

if (!SENDGRID_API_KEY) {
  console.error("🚨 SendGrid API key is missing! Please set it before deploying.");
} else {
  console.log("✅ SendGrid API key loaded successfully");
}

sgMail.setApiKey(SENDGRID_API_KEY);

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

    // Beautiful HTML email template
    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: "Uniswap IIT Ropar",
      },
      subject: "🔐 Verify Your Email – Uniswap IIT Ropar",
      html: `
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
      `,
    };

    await sgMail.send(msg);
    console.log(`✅ OTP sent successfully to ${email}`);
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    return res.status(500).json({ error: err.message });
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
