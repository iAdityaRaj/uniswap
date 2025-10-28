const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.restrictSignupDomain = functions.https.onRequest((req, res) => {
  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Restrict to IIT Ropar domain
  const allowedDomain = "@iitrpr.ac.in";
  if (email.endsWith(allowedDomain)) {
    return res.status(200).json({ success: true, message: "Valid IIT Ropar email" });
  } else {
    return res.status(403).json({ success: false, message: "Access denied: not an IIT Ropar email" });
  }
});

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.restrictSignupDomain = onRequest((req, res) => {
  const { email } = req.body;

  // Validate that email exists
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Valid email is required" });
  }

  // Normalize and check domain
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

  // Additional optional check — only allow emails starting  (student pattern)
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
