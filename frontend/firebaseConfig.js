import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDYXSlFc4UqH-8XzHeeeUz59mPVPhr3mjM",
  authDomain: "uniswap-iitrpr.firebaseapp.com",
  projectId: "uniswap-iitrpr",
  storageBucket: "uniswap-iitrpr.firebasestorage.app",
  messagingSenderId: "335342727897",
  appId: "1:335342727897:web:058c4a61d6f0c3f51d84c8",
  measurementId: "G-H8QPVQKL2T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
