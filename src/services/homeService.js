import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { fetchTopReviews } from "./reviewService";

export async function getHomePageMetrics() {
  try {
    // 1. Fetch approved notes
    const notesQuery = query(collection(db, "notes"), where("status", "==", "approved"));
    const notesSnap = await getDocs(notesQuery);
    const approvedNotes = notesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 2. Fetch all registered users
    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 3. Compute distinct colleges
    const collegesSet = new Set();
    users.forEach((u) => {
      if (u.college && typeof u.college === "string" && u.college.trim()) {
        collegesSet.add(u.college.trim().toLowerCase());
      }
    });
    approvedNotes.forEach((n) => {
      if (n.college && typeof n.college === "string" && n.college.trim()) {
        collegesSet.add(n.college.trim().toLowerCase());
      }
      if (n.uploaderCollege && typeof n.uploaderCollege === "string" && n.uploaderCollege.trim()) {
        collegesSet.add(n.uploaderCollege.trim().toLowerCase());
      }
    });

    // 4. Compute total downloads
    const totalDownloads = approvedNotes.reduce(
      (sum, n) => sum + (Number(n.downloads) || 0),
      0
    );

    // 5. Compute real branch note counts
    const branchCounts = {};
    approvedNotes.forEach((n) => {
      const code = (n.branch || "").toUpperCase().trim();
      branchCounts[code] = (branchCounts[code] || 0) + 1;
    });

    // 6. Real user reviews from reviews collection (with resilient fallback)
    const testimonials = await fetchTopReviews(3);

    return {
      notesCount: approvedNotes.length,
      usersCount: users.length,
      collegesCount: collegesSet.size || (users.length > 0 ? 1 : 0),
      downloadsCount: totalDownloads,
      branchCounts,
      testimonials
    };
  } catch (error) {
    console.error("Error fetching homepage dynamic metrics:", error);
    return null;
  }
}
