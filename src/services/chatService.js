import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

export async function fetchFollowedUsers(currentUserId) {
  if (!currentUserId) return [];
  try {
    const q = query(collection(db, "follows"), where("followerId", "==", currentUserId));
    const snapshot = await getDocs(q);

    const users = [];
    for (const docSnap of snapshot.docs) {
      const followData = docSnap.data();
      const targetId = followData.followingId;
      const targetUserSnap = await getDoc(doc(db, "users", targetId));
      if (targetUserSnap.exists()) {
        users.push({
          uid: targetId,
          ...targetUserSnap.data()
        });
      }
    }
    return users;
  } catch (error) {
    console.error("Error fetching followed users:", error);
    return [];
  }
}

export function subscribeToMessages(currentUserId, otherUserId, callback) {
  if (!currentUserId || !otherUserId) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));

    return onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.senderId === currentUserId && data.receiverId === otherUserId) ||
          (data.senderId === otherUserId && data.receiverId === currentUserId)
        ) {
          messages.push({
            id: doc.id,
            ...data
          });
        }
      });
      callback(messages);
    }, (err) => {
      console.warn("Messages subscription error:", err);
      callback([]);
    });
  } catch (err) {
    console.error("Error setting up chat subscription:", err);
    return () => {};
  }
}

export async function sendMessage(currentUserId, currentUserName, receiverId, messageText) {
  if (!messageText || !messageText.trim() || !receiverId || !currentUserId) return;

  try {
    await addDoc(collection(db, "chats"), {
      senderId: currentUserId,
      receiverId: receiverId,
      message: messageText.trim(),
      timestamp: serverTimestamp()
    });

    // Create notification for receiver
    await addDoc(collection(db, "notifications"), {
      userId: receiverId,
      type: "message",
      message: `${currentUserName || "Someone"} sent you a message.`,
      senderId: currentUserId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
