import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  serverTimestamp
} from "firebase/firestore";

const LOCAL_STORAGE_KEY = "enginotes_user_reviews";

function getLocalReviews() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReview(review) {
  try {
    const existing = getLocalReviews();
    // Prepend new review
    existing.unshift(review);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn("Could not save review to localStorage:", err);
  }
}

export async function addReview(reviewData) {
  // 1. Sanitize all fields so no field is undefined (Firestore rejects undefined)
  const cleanData = {
    authorName: String(reviewData.authorName || "Engineering Student").trim(),
    authorId: String(reviewData.authorId || "anonymous").trim(),
    authorAvatar: String(reviewData.authorAvatar || "").trim(),
    college: String(reviewData.college || "Engineering College").trim(),
    branch: String(reviewData.branch || "CSE").trim(),
    year: String(reviewData.year || "2").trim(),
    rating: Math.max(1, Math.min(5, Number(reviewData.rating) || 5)),
    comment: String(reviewData.comment || "").trim()
  };

  try {
    // Attempt Firestore write
    const docRef = await addDoc(collection(db, "reviews"), {
      ...cleanData,
      createdAt: serverTimestamp()
    });

    const firestoreReview = {
      id: docRef.id,
      ...cleanData,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      isLocal: false
    };

    // Cache locally as well for instant responsiveness
    saveLocalReview(firestoreReview);
    window.dispatchEvent(new CustomEvent("enginotes_review_added", { detail: firestoreReview }));
    return firestoreReview;
  } catch (error) {
    console.warn(
      "Firestore write failed (likely Firestore security rules require 'match /reviews/{id} { allow read, write: if request.auth != null; }'). Falling back to local persistence:",
      error
    );

    // Save locally as a graceful fallback so the user's review is NEVER lost
    const localReview = {
      id: "local_" + Date.now(),
      ...cleanData,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      isLocal: true,
      syncPending: true,
      errorNotice: error?.message || "Saved locally (Firestore rules update needed in Firebase console)"
    };

    saveLocalReview(localReview);
    window.dispatchEvent(new CustomEvent("enginotes_review_added", { detail: localReview }));
    return localReview;
  }
}

export async function fetchReviews() {
  let firestoreReviews = [];

  try {
    const q = query(collection(db, "reviews"));
    const snap = await getDocs(q);
    firestoreReviews = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));
  } catch (error) {
    console.warn("Could not fetch reviews from Firestore:", error);
  }

  const localReviews = getLocalReviews();

  // Merge and deduplicate by id or authorId+comment
  const map = new Map();
  [...localReviews, ...firestoreReviews].forEach((r) => {
    const key = r.id || `${r.authorId}_${r.comment}`;
    if (!map.has(key)) {
      map.set(key, r);
    }
  });

  const merged = Array.from(map.values());

  // Sort by createdAt descending
  merged.sort((a, b) => {
    const timeA = typeof a.createdAt === "number" ? a.createdAt : (a.createdAt?.seconds || 0);
    const timeB = typeof b.createdAt === "number" ? b.createdAt : (b.createdAt?.seconds || 0);
    return timeB - timeA;
  });

  return merged;
}

export async function fetchTopReviews(count = 3) {
  const allReviews = await fetchReviews();
  return allReviews.slice(0, count);
}
