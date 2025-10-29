// import { initializeApp } from "firebase/app";

// import { getFirestore } from "firebase/firestore";


// import {
//   initializeAuth,
//   getReactNativePersistence,
// } from "firebase/auth";
// import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// import { getFirestore } from "firebase/firestore";


// const firebaseConfig = {
//   apiKey: "AIzaSyDYXSlFc4UqH-8XzHeeeUz59mPVPhr3mjM",
//   authDomain: "uniswap-iitrpr.firebaseapp.com",
//   projectId: "uniswap-iitrpr",
//   storageBucket: "uniswap-iitrpr.firebasestorage.app",
//   messagingSenderId: "335342727897",
//   appId: "1:335342727897:web:058c4a61d6f0c3f51d84c8",
//   measurementId: "G-H8QPVQKL2T"
// };


// export const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });

// export const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app);


const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

module.exports = { admin, db };