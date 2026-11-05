import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { fetchTopReviews } from "./reviewService";

const CACHE_KEY = "enginotes_home_metrics_v2";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache window

/**
 * Returns cached metrics synchronously for instant (0ms) First Contentful Paint.
 */
export function getCachedHomePageMetrics() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data && Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS) {
      return parsed.data;
    }
  } catch {}
  return null;
}

export async function getHomePageMetrics() {
  const cached = getCachedHomePageMetrics();

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

    const result = {
      notesCount: approvedNotes.length,
      usersCount: users.length,
      collegesCount: collegesSet.size || (users.length > 0 ? 1 : 0),
      downloadsCount: totalDownloads,
      branchCounts,
      testimonials
    };

    // Save fresh snapshot to cache for subsequent 0ms loads
    try {
      const payload = JSON.stringify({ data: result, timestamp: Date.now() });
      sessionStorage.setItem(CACHE_KEY, payload);
      localStorage.setItem(CACHE_KEY, payload);
    } catch {}

    return result;
  } catch (error) {
    console.error("Error fetching homepage dynamic metrics:", error);
    return cached || null;
  }
}
