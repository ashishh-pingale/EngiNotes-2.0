import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "firebase/firestore";

const STORAGE_PREFIX = "enginotes_saved_notes_";

function getLocalBookmarks(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBookmarks(userId, noteIds) {
  if (!userId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(noteIds));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
}

/**
 * Toggles bookmark status for a user and note with multi-tier resilience:
 * 1. User document field `users/{userId}.bookmarks` (arrayUnion/arrayRemove)
 * 2. Root collection `bookmarks/{userId}_{noteId}` (for future query indexing)
 * 3. Client-side localStorage cache
 */
export async function toggleBookmark(noteId, userId, currentBookmarked) {
  if (!noteId || !userId) {
    throw new Error("Missing noteId or userId");
  }

  const willBookmark = !currentBookmarked;
  const userRef = doc(db, "users", userId);
  const rootBookmarkRef = doc(db, "bookmarks", `${userId}_${noteId}`);

  let remoteSuccess = false;

  // Tier 1: Update user document directly (guaranteed permitted by firestore.rules)
  try {
    if (willBookmark) {
      await updateDoc(userRef, {
        bookmarks: arrayUnion(noteId)
      });
    } else {
      await updateDoc(userRef, {
        bookmarks: arrayRemove(noteId)
      });
    }
    remoteSuccess = true;
  } catch (userDocErr) {
    // If user document didn't exist or updateDoc threw, try setDoc with merge
    try {
      if (willBookmark) {
        await setDoc(userRef, { bookmarks: arrayUnion(noteId) }, { merge: true });
      } else {
        await setDoc(userRef, { bookmarks: arrayRemove(noteId) }, { merge: true });
      }
      remoteSuccess = true;
    } catch (mergeErr) {
      console.warn("User doc bookmark update failed:", mergeErr);
    }
  }

  // Tier 2: Best-effort update to root /bookmarks collection (works if deployed rules are present)
  try {
    if (willBookmark) {
      await setDoc(rootBookmarkRef, {
        userId,
        noteId,
        savedAt: serverTimestamp()
      });
    } else {
      await deleteDoc(rootBookmarkRef);
    }
    remoteSuccess = true;
  } catch (rootErr) {
    console.warn("Root /bookmarks collection write failed (safe to ignore if rules not deployed):", rootErr);
  }

  // Tier 3: Local storage cache (always updated immediately)
  try {
    const localList = getLocalBookmarks(userId);
    let updatedLocal;
    if (willBookmark) {
      updatedLocal = Array.from(new Set([...localList, noteId]));
    } else {
      updatedLocal = localList.filter((id) => id !== noteId);
    }
    saveLocalBookmarks(userId, updatedLocal);
  } catch (localErr) {
    console.warn("Local storage update warning:", localErr);
  }

  return willBookmark;
}

/**
 * Checks if a specific note is bookmarked by a user.
 */
export async function checkIfUserBookmarked(noteId, userId) {
  if (!noteId || !userId) return false;

  // 1. Fast path: check local storage cache
  const localList = getLocalBookmarks(userId);
  if (localList.includes(noteId)) return true;

  // 2. Check user document `bookmarks` array
  try {
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const bms = userSnap.data()?.bookmarks;
      if (Array.isArray(bms) && bms.includes(noteId)) {
        // Refresh local cache
        saveLocalBookmarks(userId, bms);
        return true;
      }
    }
  } catch (err) {
    console.warn("User document bookmark check warning:", err);
  }

  // 3. Fallback: check root /bookmarks collection
  try {
    const snap = await getDoc(doc(db, "bookmarks", `${userId}_${noteId}`));
    if (snap.exists()) {
      return true;
    }
  } catch {
    // Ignore permission or network errors
  }

  return false;
}

/**
 * Fetches all notes bookmarked by a user.
 * Returns hydrated note objects.
 */
export async function fetchUserBookmarkedNotes(userId) {
  if (!userId) return [];

  let noteIds = [];

  // 1. Try reading from user document
  try {
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const bms = userSnap.data()?.bookmarks;
      if (Array.isArray(bms) && bms.length > 0) {
        noteIds = bms;
      }
    }
  } catch (err) {
    console.warn("Failed reading bookmarks from user doc:", err);
  }

  // 2. Fallback: query root /bookmarks collection
  if (!noteIds || noteIds.length === 0) {
    try {
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        noteIds = snap.docs.map((d) => d.data().noteId).filter(Boolean);
      }
    } catch (err) {
      console.warn("Failed reading from /bookmarks collection:", err);
    }
  }

  // 3. Fallback: check local storage cache
  if (!noteIds || noteIds.length === 0) {
    noteIds = getLocalBookmarks(userId);
  }

  if (!noteIds || noteIds.length === 0) return [];

  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(noteIds));

  // Fetch individual note documents
  const notePromises = uniqueIds.map(async (nId) => {
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
  const validNotes = results.filter(Boolean);

  // Cache hydrated notes for instant offline accessibility
  if (validNotes.length > 0) {
    try {
      localStorage.setItem(`enginotes_cached_saved_notes_${userId}`, JSON.stringify(validNotes));
    } catch {}
    return validNotes;
  }

  // If network fetch yielded no notes (e.g. offline mode), return local cache
  try {
    const cached = JSON.parse(localStorage.getItem(`enginotes_cached_saved_notes_${userId}`) || "[]");
    if (cached.length > 0) return cached;
  } catch {}

  return validNotes;
}
