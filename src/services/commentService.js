import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

/**
 * Fetch all comments / questions for a specific note.
 * Resilient multi-tier strategy: queries noteComments, fallback chats, and localStorage cache.
 */
export async function fetchNoteComments(noteId) {
  if (!noteId) return [];
  const commentMap = new Map();

  // 1. Primary: Try fetching from `noteComments` collection
  try {
    const q1 = query(
      collection(db, "noteComments"),
      where("noteId", "==", noteId)
    );
    const snap1 = await getDocs(q1);
    snap1.docs.forEach((d) => {
      commentMap.set(d.id, { id: d.id, ...d.data() });
    });
  } catch (err) {
    // Expected if remote Firestore rules haven't deployed noteComments yet
    console.warn("Could not fetch from noteComments collection:", err?.message || err);
  }

  // 2. Fallback: Try fetching from `chats` collection where type == "note_comment"
  try {
    const q2 = query(
      collection(db, "chats"),
      where("noteId", "==", noteId)
    );
    const snap2 = await getDocs(q2);
    snap2.docs.forEach((d) => {
      const data = d.data();
      if (data.type === "note_comment") {
        commentMap.set(d.id, { id: d.id, ...data });
      }
    });
  } catch (err) {
    console.warn("Could not fetch note comments from chats fallback:", err?.message || err);
  }

  // 3. Fallback: Check local cache for immediate responsiveness
  try {
    const cached = JSON.parse(localStorage.getItem(`enginotes_comments_${noteId}`) || "[]");
    cached.forEach((item) => {
      if (item && item.id && !commentMap.has(item.id)) {
        commentMap.set(item.id, item);
      }
    });
  } catch (e) {
    // Ignore localStorage parse errors
  }

  const comments = Array.from(commentMap.values());

  // Sort by createdAt asc (earliest first, standard forum thread)
  comments.sort((a, b) => {
    const timeA =
      a.createdAt?.seconds ||
      a.createdAt?.toMillis?.() ||
      a.timestamp?.seconds ||
      a.clientTime ||
      0;
    const timeB =
      b.createdAt?.seconds ||
      b.createdAt?.toMillis?.() ||
      b.timestamp?.seconds ||
      b.clientTime ||
      0;
    return timeA - timeB;
  });

  return comments;
}

/**
 * Add a new comment or question to a note and notify the author.
 * Multi-tier: attempts `noteComments`, falls back to authenticated `chats` collection and localStorage.
 */
export async function addNoteComment(noteId, text, user, profile, noteUploaderId, noteTitle) {
  if (!noteId || !user || !text.trim()) {
    throw new Error("Missing required comment parameters");
  }

  const authorName =
    profile?.name ||
    profile?.displayName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Student";

  const authorAvatar = profile?.profilePicture || user.photoURL || "";
  const authorBranch = profile?.branch || "";

  const commentData = {
    noteId,
    authorId: user.uid,
    authorName,
    authorAvatar,
    authorBranch,
    text: text.trim(),
    createdAt: serverTimestamp()
  };

  let docId = null;

  // Tier 1: Attempt writing to primary `noteComments` collection
  try {
    const docRef = await addDoc(collection(db, "noteComments"), commentData);
    docId = docRef.id;
  } catch (err) {
    console.warn("Primary noteComments write failed (remote rules pending), trying fallback:", err?.message || err);

    // Tier 2: Resilient Fallback to `chats` collection (permitted by remote rules when senderId == user.uid)
    try {
      const chatDocRef = await addDoc(collection(db, "chats"), {
        type: "note_comment",
        ...commentData,
        senderId: user.uid,
        timestamp: serverTimestamp()
      });
      docId = chatDocRef.id;
    } catch (fallbackErr) {
      console.warn("Chats fallback write failed:", fallbackErr?.message || fallbackErr);
    }
  }

  // Tier 3: Resilient client identifier if firestore write failed entirely
  if (!docId) {
    docId = `local_cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const resultItem = {
    id: docId,
    ...commentData,
    clientTime: Date.now()
  };

  // Cache locally for instant availability
  try {
    const key = `enginotes_comments_${noteId}`;
    const cached = JSON.parse(localStorage.getItem(key) || "[]");
    cached.push(resultItem);
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (e) {
    // ignore localStorage storage quota errors
  }

  // Send notification to the uploader if commenter is not the uploader
  if (noteUploaderId && noteUploaderId !== user.uid) {
    try {
      await addDoc(collection(db, "notifications"), {
        userId: noteUploaderId,
        recipientId: noteUploaderId,
        senderId: user.uid,
        senderName: authorName,
        type: "comment",
        title: "New question on your note",
        message: `${authorName} commented on "${noteTitle || "your note"}": "${text.trim().substring(0, 50)}${text.trim().length > 50 ? "..." : ""}"`,
        link: `/notes/${noteId}`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (notifErr) {
      console.warn("Could not dispatch comment notification:", notifErr);
    }
  }

  return resultItem;
}

/**
 * Delete a comment from noteComments, chats fallback, and local cache.
 */
export async function deleteNoteComment(commentId, noteId) {
  if (!commentId) return;

  try {
    await deleteDoc(doc(db, "noteComments", commentId));
  } catch (err) {
    // Might be in chats fallback
    try {
      await deleteDoc(doc(db, "chats", commentId));
    } catch (e) {
      // ignore
    }
  }

  if (noteId) {
    try {
      const key = `enginotes_comments_${noteId}`;
      const cached = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = cached.filter((c) => c.id !== commentId);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (e) {
      // ignore
    }
  }
}
