import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  Search,
  UserPlus,
  UserCheck,
  MessageSquare,
  GraduationCap,
  Users,
  Trophy,
  Award,
  Crown,
  FileText,
  Star
} from "lucide-react";

export default function DiscoverPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch all users
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 2. Fetch notes to compute contribution metrics
        const notesSnap = await getDocs(collection(db, "notes"));
        const userStatsMap = {};
        notesSnap.docs.forEach((docSnap) => {
          const n = docSnap.data();
          if (n.uploaderId && n.status === "approved") {
            if (!userStatsMap[n.uploaderId]) {
              userStatsMap[n.uploaderId] = { uploads: 0, ratingSum: 0, ratingsCount: 0, downloads: 0 };
            }
            userStatsMap[n.uploaderId].uploads += 1;
            userStatsMap[n.uploaderId].ratingSum += Number(n.ratingSum) || (Number(n.rating) ? Number(n.rating) * (Number(n.ratingsCount) || 1) : 0);
            userStatsMap[n.uploaderId].ratingsCount += Number(n.ratingsCount) || 0;
            userStatsMap[n.uploaderId].downloads += n.downloads || 0;
          }
        });

        // Compute top contributors
        const ranked = allUsers
          .map((u) => {
            const stats = userStatsMap[u.id] || { uploads: 0, ratingSum: 0, ratingsCount: 0, downloads: 0 };
            const avgRating = stats.ratingsCount > 0 ? Math.round((stats.ratingSum / stats.ratingsCount) * 10) / 10 : 0;
            const score = stats.uploads * 10 + avgRating * 10 + stats.ratingsCount * 2 + stats.downloads * 0.5;
            return { ...u, stats: { ...stats, avgRating }, score };
          })
          .filter((u) => u.stats.uploads > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        setTopContributors(ranked);
        setUsers(allUsers.filter((u) => u.id !== currentUser?.uid));

        // 3. Fetch current user's follows
        if (currentUser) {
          const followsSnap = await getDocs(collection(db, "follows"));
          const map = {};
          followsSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.followerId === currentUser.uid) {
              map[data.followingId] = docSnap.id;
            }
          });
          setFollowingMap(map);
        }
      } catch (err) {
        console.error("Error loading discover users:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  async function handleToggleFollow(targetUser) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const followId = followingMap[targetUser.id];
    try {
      if (followId) {
        // Unfollow
        await deleteDoc(doc(db, "follows", followId));
        setFollowingMap((prev) => {
          const next = { ...prev };
          delete next[targetUser.id];
          return next;
        });
      } else {
        // Follow
        const newDocRef = doc(collection(db, "follows"));
        await setDoc(newDocRef, {
          followerId: currentUser.uid,
          followingId: targetUser.id,
          createdAt: serverTimestamp()
        });
        setFollowingMap((prev) => ({
          ...prev,
          [targetUser.id]: newDocRef.id
        }));
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  }

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(s)) ||
      (u.college && u.college.toLowerCase().includes(s)) ||
      (u.branch && u.branch.toLowerCase().includes(s))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Discover Engineering Peers
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Connect with top contributors, find batchmates from your college, and share questions collaboratively.
        </p>
      </div>

      {/* Top Campus Contributors Leaderboard */}
      {topContributors.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-indigo-950/30 rounded-3xl border border-blue-100/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Top Campus Contributors
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recognizing the students powering our study community with top lecture materials.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Community Honor Roll
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topContributors.map((c, idx) => {
              const rankColor =
                idx === 0
                  ? "from-amber-400 to-amber-600 text-white"
                  : idx === 1
                  ? "from-slate-300 to-slate-500 text-white"
                  : "from-amber-700 to-amber-900 text-white";

              const badgeLabel =
                idx === 0
                  ? "🥇 Campus Legend"
                  : idx === 1
                  ? "🥈 Scholar"
                  : "🥉 Contributor";

              return (
                <div
                  key={c.id}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 relative overflow-hidden"
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${rankColor} text-[11px] font-extrabold flex items-center justify-center absolute top-2.5 right-2.5 shadow-2xs`}>
                    #{idx + 1}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {c.profilePicture ? (
                      <img src={c.profilePicture} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      (c.name || "U").charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/profile/${c.id}`}
                      className="font-bold text-sm text-slate-900 dark:text-white truncate block hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {c.name || "Student"}
                    </Link>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {c.branch ? `${c.branch} • ` : ""}{badgeLabel}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-500" /> {c.stats.uploads} notes
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {c.stats.avgRating > 0 ? `${c.stats.avgRating} ★` : "New"}
                        {c.stats.ratingsCount > 0 && <span className="text-slate-400">({c.stats.ratingsCount})</span>}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, college or branch..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* User Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Finding contributors..." />
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/90 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200">No peers found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {search ? "No students matched your search criteria." : "No registered peers available yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => {
            const isFollowing = !!followingMap[user.id];

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4 text-center">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md ring-4 ring-blue-50 dark:ring-blue-950/40">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>

                  {/* Name & Branch */}
                  <div>
                    <Link
                      to={`/profile/${user.id}`}
                      className="font-bold text-slate-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {user.name || "Engineering Student"}
                    </Link>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 mt-1.5 inline-block">
                      {user.branch || "Engineering"}{user.year ? ` • Year ${user.year}` : ""}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleToggleFollow(user)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isFollowing
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:hover:border-red-900"
                        : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Follow
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/chat?uid=${user.id}`)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
