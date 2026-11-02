import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function clean(val, fallback = "") {
  if (!val) return fallback;
  return String(val)
    .replace(/[,;]+$/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

const firebaseConfig = {
  apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY, "dummy-api-key"),
  authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "enginotes-dummy.firebaseapp.com"),
  projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID, "enginotes-dummy"),
  storageBucket: clean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "enginotes-dummy.appspot.com"),
  messagingSenderId: clean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "000000000000"),
  appId: clean(import.meta.env.VITE_FIREBASE_APP_ID, "1:000000000000:web:000000000000")
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
