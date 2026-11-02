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
  Building,
  GraduationCap,
  Users
} from "lucide-react";

export default function DiscoverPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch all users
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== currentUser?.uid);

        setUsers(allUsers);

        // 2. Fetch current user's follows
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
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 mt-1 inline-block">
                      {user.branch || "Engineering"}{user.year ? ` • Year ${user.year}` : ""}
                    </span>
                  </div>

                  {/* College */}
                  {user.college && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 line-clamp-1">
                      <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      {user.college}
                    </p>
                  )}

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                      {user.bio}
                    </p>
                  )}
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
