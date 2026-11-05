import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

/**
 * LocalStorage cache helper for user ratings
 */
function getLocalUserRatings(userId) {
  if (!userId) return {};
  try {
    return JSON.parse(localStorage.getItem(`enginotes_ratings_${userId}`) || "{}");
  } catch {
    return {};
  }
}

function saveLocalUserRating(userId, noteId, rating) {
  if (!userId || !noteId) return;
  try {
    const existing = getLocalUserRatings(userId);
    existing[noteId] = rating;
    localStorage.setItem(`enginotes_ratings_${userId}`, JSON.stringify(existing));
  } catch (e) {
    // ignore quota errors
  }
}

/**
 * Fetches the rating given by a specific user for a note.
 * Returns a number between 1 and 5, or null if unrated.
 */
export async function getUserRatingForNote(noteId, userId) {
  if (!noteId || !userId) return null;

  // 1. Check local cache first
  const localRatings = getLocalUserRatings(userId);
  if (localRatings[noteId]) {
    return localRatings[noteId];
  }

  // 2. Check Firestore noteRatings collection
  try {
    const ratingDocId = `${userId}_${noteId}`;
    const snap = await getDoc(doc(db, "noteRatings", ratingDocId));
    if (snap.exists()) {
      const val = snap.data().rating;
      if (typeof val === "number") {
        saveLocalUserRating(userId, noteId, val);
        return val;
      }
    }
  } catch (err) {
    // Remote rules might restrict read
    console.info("getUserRating remote check:", err?.message || err);
  }

  return null;
}

/**
 * Rates a note (1 to 5 stars).
 * Updates:
 * 1. noteRatings/{userId}_{noteId} document
 * 2. notes/{noteId} cumulative stats (ratingsCount, ratingSum, rating)
 * 3. LocalStorage cache for immediate UI feedback
 */
export async function rateNote(noteId, userId, score, currentNoteData = null) {
  if (!noteId || !userId) {
    throw new Error("Missing noteId or userId");
  }

  const numericScore = Math.min(5, Math.max(1, Math.round(Number(score))));
  const ratingDocId = `${userId}_${noteId}`;

  // Check if user previously rated this note
  let previousScore = await getUserRatingForNote(noteId, userId);

  // Save to local cache immediately
  saveLocalUserRating(userId, noteId, numericScore);

  // 1. Record individual rating in noteRatings collection
  try {
    await setDoc(doc(db, "noteRatings", ratingDocId), {
      noteId,
      userId,
      rating: numericScore,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Could not write to noteRatings collection:", err?.message || err);
  }

  // 2. Fetch or use existing note document to calculate new average
  let newRatingsCount = 1;
  let newRatingSum = numericScore;
  let newAverage = numericScore;

  try {
    const noteRef = doc(db, "notes", noteId);
    let noteData = currentNoteData;

    if (!noteData) {
      const noteSnap = await getDoc(noteRef);
      if (noteSnap.exists()) {
        noteData = noteSnap.data();
      }
    }

    if (noteData) {
      const currentCount = Number(noteData.ratingsCount) || 0;
      const currentSum = Number(noteData.ratingSum) || (Number(noteData.rating) ? noteData.rating * currentCount : 0);

      if (previousScore) {
        // Updating existing rating
        newRatingsCount = Math.max(1, currentCount);
        newRatingSum = Math.max(1, currentSum - previousScore + numericScore);
      } else {
        // New rating from user
        newRatingsCount = currentCount + 1;
        newRatingSum = currentSum + numericScore;
      }

      newAverage = Math.round((newRatingSum / newRatingsCount) * 10) / 10;

      await updateDoc(noteRef, {
        ratingsCount: newRatingsCount,
        ratingSum: newRatingSum,
        rating: newAverage
      });
    }
  } catch (updateErr) {
    console.warn("Could not update note rating stats in Firestore:", updateErr?.message || updateErr);
  }

  return {
    userRating: numericScore,
    rating: newAverage,
    ratingsCount: newRatingsCount,
    ratingSum: newRatingSum
  };
}

/**
 * Formats a rating value into a clean display string
 * e.g. 4.8 or "New" if 0 or unrated
 */
export function formatRating(rating, ratingsCount = 0) {
  if (!rating || Number(ratingsCount) === 0) {
    return "New";
  }
  const num = Number(rating);
  return num % 1 === 0 ? `${num}.0` : num.toFixed(1);
}
