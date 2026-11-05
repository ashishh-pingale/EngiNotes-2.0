import { db } from "./firebase";
import {
  collection,
  query,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";

/**
 * Submit a report for a note (e.g. copyright, incorrect content, inappropriate).
 */
export async function submitNoteReport({
  noteId,
  noteTitle,
  noteUploaderId,
  reporterId,
  reporterName,
  reporterEmail,
  reason,
  details
}) {
  if (!noteId || !reporterId || !reason) {
    throw new Error("Missing required report parameters");
  }

  const reportData = {
    noteId,
    noteTitle: noteTitle || "Untitled Note",
    noteUploaderId: noteUploaderId || "",
    reporterId,
    reporterName: reporterName || "Anonymous Reporter",
    reporterEmail: reporterEmail || "",
    reason,
    details: details?.trim() || "",
    status: "pending", // pending | resolved | dismissed
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "noteReports"), reportData);
  return { id: docRef.id, ...reportData };
}

/**
 * Fetch all note reports for admin moderation.
 */
export async function fetchNoteReports() {
  try {
    const snap = await getDocs(collection(db, "noteReports"));
    const reports = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    reports.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return reports;
  } catch (err) {
    console.error("Error fetching note reports:", err);
    return [];
  }
}

/**
 * Update report status (resolved | dismissed).
 */
export async function updateReportStatus(reportId, status, resolutionNote = "") {
  if (!reportId) return;
  const ref = doc(db, "noteReports", reportId);
  await updateDoc(ref, {
    status,
    resolutionNote,
    resolvedAt: serverTimestamp()
  });
}

/**
 * Delete a report record.
 */
export async function deleteReport(reportId) {
  if (!reportId) return;
  await deleteDoc(doc(db, "noteReports", reportId));
}

