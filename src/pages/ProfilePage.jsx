import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import LoadingSpinner from "../components/common/LoadingSpinner";
import NoteCard from "../components/notes/NoteCard";
import NotePreviewModal from "../components/notes/NotePreviewModal";
import Modal from "../components/common/Modal";
import {
  User,
  Building,
  GraduationCap,
  Calendar,
  Edit3,
  MessageSquare,
  UserPlus,
  UserCheck,
  BookOpen,
  Star,
  Bookmark,
  Users,
  Download
} from "lucide-react";
import { fetchUserBookmarkedNotes } from "../services/bookmarkService";

export default function ProfilePage() {
  const { uid: paramUid } = useParams();
  const { currentUser, userProfile: myProfile } = useAuth();
  const navigate = useNavigate();

  const profileUid = paramUid || currentUser?.uid;
  const isOwnProfile = currentUser && currentUser.uid === profileUid;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs: "uploads", "saved"
  const [activeTab, setActiveTab] = useState("uploads");
  const [uploadedNotes, setUploadedNotes] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Follow state & lists
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Followers / Following Modal
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers"); // "followers" | "following"
  const [modalUsersLoading, setModalUsersLoading] = useState(false);
  const [modalUsersList, setModalUsersList] = useState([]);

  // Preview Modal
  const [previewNote, setPreviewNote] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!profileUid) return;

    async function loadProfile() {
      setLoading(true);
      try {
        // 1. Fetch user doc
        const uRef = doc(db, "users", profileUid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          setProfileData(uSnap.data());
        }

        // 2. Fetch user's uploaded notes
        const notesQ = query(
          collection(db, "notes"),
          where("uploaderId", "==", profileUid)
        );
        const notesSnap = await getDocs(notesQ);
        const notesList = notesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUploadedNotes(notesList);

        // Fetch user's bookmarked / saved notes if this is the user's profile
        if (currentUser && currentUser.uid === profileUid) {
          try {
            const bookmarks = await fetchUserBookmarkedNotes(profileUid);
            setSavedNotes(bookmarks);
          } catch (bmErr) {
            console.warn("Error fetching bookmarked notes:", bmErr);
          }
        }

        // 3. Fetch followers (people who follow this profile)
        const followersQ = query(
          collection(db, "follows"),
          where("followingId", "==", profileUid)
        );
        const followersSnap = await getDocs(followersQ);
        const followerIds = followersSnap.docs.map((d) => d.data().followerId);
        setFollowers(followerIds);

        // 4. Fetch following (people this profile follows)
        const followingQ = query(
          collection(db, "follows"),
          where("followerId", "==", profileUid)
        );
        const followingSnap = await getDocs(followingQ);
        const followingIds = followingSnap.docs.map((d) => d.data().followingId);
        setFollowing(followingIds);

        // 5. Check follow status if viewing another user
        if (currentUser && currentUser.uid !== profileUid) {
          const matchingDoc = followersSnap.docs.find(
            (d) => d.data().followerId === currentUser.uid
          );
          if (matchingDoc) {
            setIsFollowing(true);
            setFollowDocId(matchingDoc.id);
          } else {
            setIsFollowing(false);
            setFollowDocId(null);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileUid, currentUser]);

  async function handleToggleFollow() {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isFollowing && followDocId) {
        await deleteDoc(doc(db, "follows", followDocId));
        setIsFollowing(false);
        setFollowDocId(null);
        setFollowers((prev) => prev.filter((id) => id !== currentUser.uid));
      } else {
        const newDoc = doc(collection(db, "follows"));
        await setDoc(newDoc, {
          followerId: currentUser.uid,
          followingId: profileUid,
          createdAt: serverTimestamp()
        });
        setIsFollowing(true);
        setFollowDocId(newDoc.id);
        setFollowers((prev) => [...prev, currentUser.uid]);
      }
    } catch (e) {
      console.error("Follow error:", e);
    }
  }

  async function openFollowModal(type) {
    setFollowModalType(type);
    setFollowModalOpen(true);
    setModalUsersLoading(true);

    const ids = type === "followers" ? followers : following;
    if (!ids || ids.length === 0) {
      setModalUsersList([]);
      setModalUsersLoading(false);
      return;
    }

    try {
      const userPromises = ids.map(async (id) => {
        try {
          const userSnap = await getDoc(doc(db, "users", id));
          if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
          }
          return { id, name: "Engineering Student", college: "", branch: "" };
        } catch {
          return { id, name: "Engineering Student", college: "", branch: "" };
        }
      });
      const resolvedUsers = await Promise.all(userPromises);
      setModalUsersList(resolvedUsers);
    } catch (err) {
      console.error("Error loading follow users:", err);
      setModalUsersList([]);
    } finally {
      setModalUsersLoading(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading user profile..." />;

  const displayData = isOwnProfile ? myProfile || profileData : profileData;
  const name = displayData?.name || "Student";
  const college = displayData?.college;
  const branch = displayData?.branch;
  const year = displayData?.year;
  const bio = displayData?.bio;
  const avatar = displayData?.profilePicture;

  const uploadsCount = uploadedNotes.length;
  const totalDownloads = uploadedNotes.reduce((acc, n) => acc + (n.downloads || 0), 0);
  const ratedNotes = uploadedNotes.filter((n) => Number(n.ratingsCount) > 0);
  const totalRatingsCount = uploadedNotes.reduce((acc, n) => acc + (Number(n.ratingsCount) || 0), 0);
  const avgRating = ratedNotes.length > 0
    ? Math.round((ratedNotes.reduce((acc, n) => acc + (Number(n.rating) || 0), 0) / ratedNotes.length) * 10) / 10
    : 0;

  let contributorBadge = {
    title: "Engineering Explorer",
    emoji: "🌱",
    color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
  };

  if (uploadsCount >= 10 || totalDownloads >= 200 || (avgRating >= 4.5 && totalRatingsCount >= 10)) {
    contributorBadge = {
      title: "Campus Legend",
      emoji: "🥇",
      color: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80"
    };
  } else if (uploadsCount >= 5 || totalDownloads >= 50 || (avgRating >= 4.0 && totalRatingsCount >= 5)) {
    contributorBadge = {
      title: "Scholar Contributor",
      emoji: "🥈",
      color: "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/80"
    };
  } else if (uploadsCount >= 1) {
    contributorBadge = {
      title: "Note Contributor",
      emoji: "🥉",
      color: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/80"
    };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg ring-4 ring-blue-50 dark:ring-slate-800 shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${contributorBadge.color}`}>
                    <span>{contributorBadge.emoji}</span>
                    <span>{contributorBadge.title}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                  {branch && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {branch}{year ? ` • Year ${year}` : ""}
                    </span>
                  )}
                  {college && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {college}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2">
                {isOwnProfile ? (
                  <Link
                    to="/profile/edit"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Edit Profile
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handleToggleFollow}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isFollowing
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900"
                          : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Follow
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/chat?uid=${profileUid}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Message
                    </button>
                  </>
                )}
              </div>
            </div>

            {bio ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">{bio}</p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No bio added yet.</p>
            )}

            {/* Community Network: Followers & Following Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => openFollowModal("followers")}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/80 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 transition-all cursor-pointer group shadow-2xs"
                title="Click to view followers"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 block">
                    {followers.length}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">
                    Followers
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openFollowModal("following")}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all cursor-pointer group shadow-2xs"
                title="Click to view following"
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 block">
                    {following.length}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                    Following
                  </span>
                </div>
              </button>
            </div>

            {/* Separator & Study Material Metrics */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm block">
                      {uploadedNotes.length}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Uploaded Notes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm block">
                      {uploadedNotes.reduce((acc, n) => acc + (n.downloads || 0), 0)}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Total Downloads</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm block">
                      {avgRating > 0 ? (avgRating % 1 === 0 ? `${avgRating}.0` : avgRating.toFixed(1)) : "New"} ★
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {totalRatingsCount > 0 ? `${totalRatingsCount} Ratings` : "Avg Rating"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6 sm:space-x-8">
          <button
            onClick={() => setActiveTab("uploads")}
            className={`py-3.5 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "uploads"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Uploaded Study Materials ({uploadedNotes.length})
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("saved")}
              className={`py-3.5 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "saved"
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-bold"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved Notes ({savedNotes.length})
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "uploads" ? (
        uploadedNotes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/90 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">No notes uploaded yet</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              {isOwnProfile
                ? "Share your lecture notes and exam summaries to help fellow classmates."
                : "This student has not submitted any public notes yet."}
            </p>
            {isOwnProfile && (
              <Link
                to="/upload"
                className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Upload Notes
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {uploadedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPreview={(n) => {
                  setPreviewNote(n);
                  setIsPreviewOpen(true);
                }}
              />
            ))}
          </div>
        )
      ) : (
        /* Saved / Bookmarked Notes Tab */
        savedNotes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/90 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">No saved notes yet</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Click the bookmark ribbon icon on any study material card to save it here for instant exam revision.
            </p>
            <Link
              to="/browse"
              className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Explore Study Materials
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {savedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPreview={(n) => {
                  setPreviewNote(n);
                  setIsPreviewOpen(true);
                }}
              />
            ))}
          </div>
        )
      )}

      {/* Preview Modal */}
      <NotePreviewModal
        note={previewNote}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Followers / Following List Modal */}
      <Modal
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        title={followModalType === "followers" ? `Followers (${followers.length})` : `Following (${following.length})`}
        maxWidth="max-w-md"
      >
        {modalUsersLoading ? (
          <div className="py-8">
            <LoadingSpinner text={`Loading ${followModalType}...`} />
          </div>
        ) : modalUsersList.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold">
              {followModalType === "followers"
                ? "No followers yet."
                : "Not following anyone yet."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {followModalType === "followers"
                ? "When classmates follow this profile, they will appear here."
                : "Connect with classmates from the Discover page to see them here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1 space-y-1">
            {modalUsersList.map((u) => {
              const displayName = (u.name || u.displayName || u.fullName || u.email?.split("@")[0] || "").trim() || "Engineering Student";
              return (
                <div
                  key={u.id}
                  className="p-3 flex items-center justify-between gap-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/80"
                >
                  <div
                    onClick={() => {
                      setFollowModalOpen(false);
                      navigate(`/profile/${u.id}`);
                    }}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden shadow-sm ring-2 ring-blue-50 dark:ring-slate-800">
                      {u.profilePicture ? (
                        <img
                          src={u.profilePicture}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {u.branch ? (
                          <span className="font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px]">
                            {u.branch}
                          </span>
                        ) : null}
                        {u.college ? (
                          <span className="truncate text-slate-500 dark:text-slate-400 text-xs">
                            {u.college}
                          </span>
                        ) : !u.branch ? (
                          <span>Engineering Peer</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setFollowModalOpen(false);
                        navigate(`/profile/${u.id}`);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all cursor-pointer shadow-xs"
                    >
                      View
                    </button>
                    {currentUser && currentUser.uid !== u.id && (
                      <button
                        onClick={() => {
                          setFollowModalOpen(false);
                          navigate(`/chat?uid=${u.id}`);
                        }}
                        className="p-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all cursor-pointer shadow-xs"
                        title="Message student"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
