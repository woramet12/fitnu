// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Fallback config จากคีย์ที่คุณส่งมา เพื่อให้ก๊อป–วางแล้วรันได้ทันที แม้ไม่มี .env
const fallbackConfig = {
  apiKey: "AIzaSyD3afhPnB6KuRRDIwsCmRvwdazWaK4QikE",
  authDomain: "fitnu-app.firebaseapp.com",
  projectId: "fitnu-app",
  storageBucket: "fitnu-app.firebasestorage.app",
  messagingSenderId: "148294242275",
  appId: "1:148294242275:web:a7f5de44c62922aec59ad6",
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fallbackConfig.appId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
