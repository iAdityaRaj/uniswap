require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Initialize Firebase only once (same pattern as otpFunctions)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// -------------------- secure config handling --------------------
console.log("🔍 Firebase Config Snapshot:", JSON.stringify(functions.config(), null, 2));
const config = functions.config() || {};

// prefer firebase functions config, then environment variables
const SENDGRID_API_KEY =
  (config.sendgrid && (config.sendgrid.key || config.sendgrid.api_key)) ||
  process.env.SENDGRID_API_KEY ||
  process.env.SENDGRID_KEY;

const FROM_EMAIL =
  (config.sendgrid && (config.sendgrid.from || config.sendgrid.email)) ||
  process.env.FROM_EMAIL ||
  process.env.FROM;

// warn but don't throw (prevents emulator crash)
if (!SENDGRID_API_KEY) {
  console.warn("⚠️ SendGrid API key is missing. Emails will NOT be sent until configured.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid API key loaded successfully");
}

// -------------------- notifyProposalEmail (HTTPS) --------------------
exports.notifyProposalEmail = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const {
      recipientId,
      recipientEmail, // optional - server will lookup if not provided
      senderId,
      senderName,
      itemTitle,
      startDate,
      endDate,
      text,
      itemImage,
      chatId,
    } = req.body || {};

    // resolve recipient email if not provided
    let toEmail = recipientEmail;
    if (!toEmail && recipientId) {
      const u = await db.doc(`users/${recipientId}`).get();
      if (u.exists) toEmail = u.data().email;
    }

    if (!toEmail) {
      console.warn("notifyProposalEmail: No recipient email found", { recipientId, recipientEmail });
      return res.status(400).send("No recipient email found");
    }

    // opt-out check (optional)
    if (recipientId) {
      const userSnap = await db.doc(`users/${recipientId}`).get();
      if (userSnap.exists) {
        const user = userSnap.data();
        if (user.notifications && user.notifications.email === false) {
          console.log("User has opted out of email notifications:", recipientId);
          return res.status(200).send("User opted out");
        }
      }
    }

    // Build nice date strings
    const niceStart = startDate ? new Date(startDate).toLocaleDateString() : "";
    const niceEnd = endDate ? new Date(endDate).toLocaleDateString() : "";

    // Compose message (rich + plain)
    const senderPretty = senderName || "Someone";
    const chatDeepLink = chatId ? `uniswap://chat/${chatId}` : "";
    const webChatUrl = chatId ? `https://uniswap-iitrpr.web.app/chats/${chatId}` : "";

    const subject = `New message on Uniswap — rental proposal for "${itemTitle || ""}"`;

    // Plain-text fallback (spam filters + accessibility)
    const textBody = `${senderPretty} sent you a rental proposal for "${itemTitle || ""}" (${niceStart} → ${niceEnd}).\n\n${text || ""}\n\nOpen the Uniswap app to reply: ${webChatUrl || "open your Uniswap app"}`;

    // Rich HTML body (mobile-friendly)
    const htmlBody = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { margin:0; padding:0; background:#f4f6f8; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial; color:#111; }
          a { color:#0b66ff; text-decoration:none; }
          .container { max-width:680px; margin:28px auto; padding:20px; background:#fff; border-radius:12px; box-shadow:0 6px 18px rgba(17,24,39,0.06); }
          .brand { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
          .logo { width:46px; height:46px; background:#0A66C2; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-weight:700; border-radius:10px; font-size:20px; }
          h1 { font-size:18px; margin:0; color:#0b3a7a; }
          p.lead { margin:12px 0 18px; font-size:15px; color:#334155; }
          .card { border:1px solid #eef2ff; padding:14px; border-radius:10px; background:linear-gradient(180deg,#ffffff,#fbfdff); }
          .item-title { font-size:16px; font-weight:700; color:#0b274f; margin:0 0 6px; }
          .meta { font-size:13px; color:#475569; margin-bottom:8px; }
          .dates { display:flex; gap:12px; margin-top:8px; flex-wrap:wrap; }
          .date-pill { background:#eef2ff; color:#0b3a7a; padding:6px 10px; border-radius:999px; font-weight:600; font-size:13px; }
          .btn-wrap { margin-top:18px; display:flex; gap:12px; flex-wrap:wrap; }
          .cta { background:linear-gradient(90deg,#0b66ff,#0066cc); color:#fff; padding:12px 16px; border-radius:10px; display:inline-block; font-weight:700; }
          .secondary { background:transparent; border:1px solid #e6eefc; color:#0b3a7a; padding:10px 14px; border-radius:10px; text-decoration:none; display:inline-block; font-weight:600; }
          .footer { font-size:12px; color:#94a3b8; margin-top:18px; text-align:center; }
          @media (max-width:480px) {
            .container { margin:16px; padding:14px; }
            h1 { font-size:16px; }
          }
        </style>
      </head>
      <body>
        <div style="background:#f4f6f8;padding:18px 0;">
          <div class="container" role="article" aria-label="Rental proposal from ${senderPretty}">
            <div class="brand">
              <div class="logo">U</div>
              <div>
                <h1>Uniswap — Rental proposal</h1>
                <div style="font-size:13px;color:#6b7280;margin-top:4px;">${senderPretty} sent you a proposal</div>
              </div>
            </div>

            <p class="lead">
              Someone wants to borrow your item on Uniswap. See the details below and open the chat to accept or reject.
            </p>

            <div class="card" aria-hidden="false">
              <div class="item">
                <div class="item-title">${itemTitle || "Untitled item"}</div>
                <div class="meta">From <strong>${senderPretty}</strong></div>
                <div class="dates">
                  <div class="date-pill">Start: ${niceStart || "—"}</div>
                  <div class="date-pill">End: ${niceEnd || "—"}</div>
                </div>
                ${itemImage ? `<div style="margin-top:12px;"><img src="${itemImage}" alt="${itemTitle || ""}" style="max-width:110px;border-radius:8px;"/></div>` : ""}
              </div>

              <div class="btn-wrap">
                ${chatDeepLink ? `<a class="cta" href="${chatDeepLink}" target="_blank" rel="noopener">Open in app</a>` : ""}
                ${webChatUrl ? `<a class="secondary" href="${webChatUrl}" target="_blank" rel="noopener">Open in browser</a>` : ""}
              </div>
            </div>

            <div style="margin-top:14px;font-size:14px;color:#475569;">
              <strong>Note:</strong> Accepting here will create a rental entry and notify the borrower. If you don't want to share this item, you may reject the request.
            </div>

            <div class="footer">
              © ${new Date().getFullYear()} Uniswap — Please do not reply to this email.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // If SendGrid key missing, skip actual send (dev-friendly)
    if (!SENDGRID_API_KEY) {
      console.warn("Skipping email send because SendGrid key missing. Would have sent to:", toEmail);
      return res.status(200).send("Okay (email skipped in dev)");
    }

    const msg = {
      to: toEmail,
      from: { email: FROM_EMAIL || "no-reply@yourdomain.com", name: "Uniswap" },
      subject,
      text: textBody,
      html: htmlBody,
    };

    await sgMail.send(msg);
    console.log("Email sent to", toEmail);
    return res.status(200).send("Email sent");
  } catch (err) {
    console.error("notifyProposalEmail error:", err);
    return res.status(500).send("Internal Server Error");
  }
});