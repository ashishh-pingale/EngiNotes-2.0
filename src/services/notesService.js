import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";

export async function fetchApprovedNotes(filters = {}) {
  try {
    let q = query(collection(db, "notes"), where("status", "==", "approved"));

    if (filters.branch) {
      q = query(collection(db, "notes"), where("status", "==", "approved"), where("branch", "==", filters.branch));
    }

    const snapshot = await getDocs(q);
    let notes = snapshot.docs.map(doc => {
      const data = doc.data();
      const docUrl = data.pdfUrl || data.fileUrl || "";
      return {
        id: doc.id,
        ...data,
        pdfUrl: docUrl,
        fileUrl: docUrl
      };
    });

    if (filters.year) {
      notes = notes.filter(n => String(n.year) === String(filters.year));
    }

    if (filters.semester && filters.semester !== "all") {
      notes = notes.filter(n => String(n.semester) === String(filters.semester));
    }

    if (filters.subject && filters.subject !== "all") {
      const targetSub = filters.subject.toLowerCase();
      notes = notes.filter(n => n.subject && n.subject.toLowerCase().includes(targetSub));
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      notes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(s)) ||
        (n.subject && n.subject.toLowerCase().includes(s)) ||
        (n.uploaderName && n.uploaderName.toLowerCase().includes(s)) ||
        (n.branch && n.branch.toLowerCase().includes(s))
      );
    }

    // Sort by createdAt desc
    notes.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return notes;
  } catch (error) {
    console.error("Error fetching approved notes:", error);
    return [];
  }
}

/**
 * Fetch approved notes with cursor pagination and index fallback.
 */
export async function fetchApprovedNotesPaginated({ branch = "", limitSize = 12, lastDoc = null } = {}) {
  try {
    let constraints = [
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(limitSize)
    ];

    if (branch) {
      constraints.unshift(where("branch", "==", branch));
    }

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, "notes"), ...constraints);
    const snapshot = await getDocs(q);

    const notes = snapshot.docs.map((doc) => {
      const data = doc.data();
      const docUrl = data.pdfUrl || data.fileUrl || "";
      return {
        id: doc.id,
        ...data,
        pdfUrl: docUrl,
        fileUrl: docUrl,
        _doc: doc
      };
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === limitSize;

    return { notes, lastVisible, hasMore };
  } catch (err) {
    console.info("fetchApprovedNotesPaginated notice (using resilient query):", err?.message || err);
    const all = await fetchApprovedNotes({ branch });
    return {
      notes: all.slice(0, limitSize),
      lastVisible: null,
      hasMore: all.length > limitSize,
      allFallback: all
    };
  }
}

export async function getNoteById(noteId) {
  try {
    const docRef = doc(db, "notes", noteId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const docUrl = data.pdfUrl || data.fileUrl || "";
      return {
        id: snap.id,
        ...data,
        pdfUrl: docUrl,
        fileUrl: docUrl
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting note:", error);
    return null;
  }
}

export async function recordNoteView(noteId) {
  try {
    const docRef = doc(db, "notes", noteId);
    await updateDoc(docRef, { views: increment(1) });
  } catch (err) {
    console.warn("Could not increment note view:", err);
  }
}

export async function recordNoteDownload(noteId) {
  try {
    const docRef = doc(db, "notes", noteId);
    await updateDoc(docRef, { downloads: increment(1) });
  } catch (err) {
    console.warn("Could not increment note download:", err);
  }
}

export async function toggleNoteLike(noteId, userId, currentLiked) {
  if (!noteId || !userId) {
    throw new Error("Missing noteId or userId");
  }

  const likeDocId = `${noteId}_${userId}`;
  const noteLikesRef = doc(db, "noteLikes", likeDocId);
  const noteRef = doc(db, "notes", noteId);
  const subLikeRef = doc(db, "notes", noteId, "likes", userId);

  if (currentLiked) {
    // 1. Delete from noteLikes collection
    try {
      await deleteDoc(noteLikesRef);
    } catch (err) {
      console.warn("Could not delete from noteLikes:", err);
    }

    // 2. Fallback delete from subcollection
    try {
      await deleteDoc(subLikeRef);
    } catch {
      // ignore
    }

    // 3. Decrement note counter
    try {
      await updateDoc(noteRef, { likes: increment(-1) });
    } catch (err) {
      console.warn("Could not decrement likes counter:", err);
    }

    return false;
  } else {
    // 1. Create in noteLikes collection
    let recorded = false;
    try {
      await setDoc(noteLikesRef, {
        noteId,
        userId,
        likedAt: serverTimestamp()
      });
      recorded = true;
    } catch (err) {
      console.warn("Could not write to noteLikes, trying subcollection:", err);
    }

    // 2. Fallback create in subcollection
    try {
      await setDoc(subLikeRef, {
        userId,
        likedAt: serverTimestamp()
      });
      recorded = true;
    } catch {
      // ignore
    }

    // 3. Increment note counter
    try {
      await updateDoc(noteRef, { likes: increment(1) });
    } catch (err) {
      console.warn("Could not increment likes counter:", err);
    }

    return true;
  }
}

export async function checkIfUserLikedNote(noteId, userId) {
  if (!noteId || !userId) return false;

  try {
    const likeDocId = `${noteId}_${userId}`;
    const snap = await getDoc(doc(db, "noteLikes", likeDocId));
    if (snap.exists()) return true;

    // Check subcollection fallback
    try {
      const subSnap = await getDoc(doc(db, "notes", noteId, "likes", userId));
      if (subSnap.exists()) return true;
    } catch {
      // ignore
    }

    return false;
  } catch (err) {
    console.warn("Error checking note like status:", err);
    return false;
  }
}

export async function createNoteSubmission(noteData) {
  try {
    const docUrl = noteData.pdfUrl || noteData.fileUrl || "";
    const docRef = await addDoc(collection(db, "notes"), {
      ...noteData,
      pdfUrl: docUrl,
      fileUrl: docUrl,
      status: "pending",
      views: 0,
      downloads: 0,
      rating: 0,
      ratingsCount: 0,
      ratingSum: 0,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
}

export { rateNote, getUserRatingForNote, formatRating } from "./ratingService";
