import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";

/**
 * Toggles bookmark status for a user and note.
 * Idempotent doc ID: `${userId}_${noteId}`
 */
export async function toggleBookmark(noteId, userId, currentBookmarked) {
  if (!noteId || !userId) {
    throw new Error("Missing noteId or userId");
  }

  const bookmarkId = `${userId}_${noteId}`;
  const bookmarkRef = doc(db, "bookmarks", bookmarkId);

  if (currentBookmarked) {
    await deleteDoc(bookmarkRef);
    return false;
  } else {
    await setDoc(bookmarkRef, {
      userId,
      noteId,
      savedAt: serverTimestamp()
    });
    return true;
  }
}

/**
 * Checks if a specific note is bookmarked by a user.
 */
export async function checkIfUserBookmarked(noteId, userId) {
  if (!noteId || !userId) return false;
  try {
    const bookmarkId = `${userId}_${noteId}`;
    const snap = await getDoc(doc(db, "bookmarks", bookmarkId));
    return snap.exists();
  } catch (err) {
    console.warn("Error checking bookmark status:", err);
    return false;
  }
}

/**
 * Fetches all notes bookmarked by a user.
 * Returns hydrated note objects.
 */
export async function fetchUserBookmarkedNotes(userId) {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);

    if (snap.empty) return [];

    const noteIds = snap.docs.map((d) => d.data().noteId).filter(Boolean);
    if (noteIds.length === 0) return [];

    // Fetch individual note documents
    const notePromises = noteIds.map(async (nId) => {
      try {
        const noteSnap = await getDoc(doc(db, "notes", nId));
        if (noteSnap.exists()) {
          const data = noteSnap.data();
          const docUrl = data.pdfUrl || data.fileUrl || "";
          return {
            id: noteSnap.id,
            ...data,
            pdfUrl: docUrl,
            fileUrl: docUrl
          };
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(notePromises);
    return results.filter(Boolean);
  } catch (err) {
    console.error("Error fetching bookmarked notes:", err);
    return [];
  }
}

