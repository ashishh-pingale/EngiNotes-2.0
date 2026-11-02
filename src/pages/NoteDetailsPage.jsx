import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  getNoteById,
  recordNoteView,
  recordNoteDownload,
  toggleNoteLike,
  checkIfUserLikedNote,
  fetchApprovedNotes
} from "../services/notesService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  toggleBookmark,
  checkIfUserBookmarked
} from "../services/bookmarkService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import NoteCard from "../components/notes/NoteCard";
import {
  Heart,
  Bookmark,
  Download,
  Share2,
  Eye,
  Calendar,
  Building,
  ArrowLeft,
  FileText,
  UserCheck,
  ExternalLink
} from "lucide-react";

export default function NoteDetailsPage() {
  const { noteId } = useParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [copied, setCopied] = useState(false);
  const [relatedNotes, setRelatedNotes] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getNoteById(noteId);
        if (data) {
          setNote(data);
          setLikeCount(data.likes || 0);
          recordNoteView(noteId);

          if (currentUser) {
            checkIfUserLikedNote(noteId, currentUser.uid).then(setLiked);
            checkIfUserBookmarked(noteId, currentUser.uid).then(setBookmarked);
          } else {
            setLiked(false);
            setBookmarked(false);
          }

          // Load related notes from same branch
          if (data.branch) {
            fetchApprovedNotes({ branch: data.branch }).then((rel) => {
              setRelatedNotes(rel.filter((r) => r.id !== noteId).slice(0, 3));
            });
          }
        }
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [noteId, currentUser]);

  async function handleLike() {
    if (!currentUser) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setLikeLoading(true);
    try {
      const targetNoteId = note.id || noteId;
      const nowLiked = await toggleNoteLike(targetNoteId, currentUser.uid, liked);
      setLiked(nowLiked);
      setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(0, prev - 1)));
      showToast(nowLiked ? "Added note to your likes!" : "Unliked note", "info");
    } catch (e) {
      console.error("Like toggle error:", e);
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleBookmark() {
    if (!currentUser) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setBookmarkLoading(true);
    try {
      const targetNoteId = note.id || noteId;
      const nowBookmarked = await toggleBookmark(targetNoteId, currentUser.uid, bookmarked);
      setBookmarked(nowBookmarked);
      if (nowBookmarked) {
        showToast("Saved note to your study bookmarks!", "success");
      } else {
        showToast("Removed note from bookmarks", "info");
      }
    } catch (e) {
      console.error("Bookmark toggle error:", e);
    } finally {
      setBookmarkLoading(false);
    }
  }

  function handleDownload() {
    if (note) {
      recordNoteDownload(note.id);
      const downloadUrl = note.pdfUrl || note.fileUrl;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      }
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingSpinner text="Loading note details..." />;

  if (!note) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Note Not Found</h2>
        <p className="text-slate-500 text-sm">
          The requested study material may have been removed or does not exist.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Notes
        </Link>
      </div>
    );
  }

  const pdfUrl = note.pdfUrl || note.fileUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Previous Page
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: PDF Frame (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 min-h-[500px] lg:min-h-[750px] flex flex-col">
            {/* Viewer Top Action Bar */}
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">
                  {note.title || "Document Viewer"}
                </span>
              </div>
              {pdfUrl && (
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-xs"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open Fullscreen</span>
                  </a>
                </div>
              )}
            </div>

            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title={note.title || "Note Preview"}
                className="w-full flex-1 min-h-[650px] border-0 bg-white"
                allow="fullscreen"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <FileText className="w-16 h-16 text-slate-600 mb-3" />
                <p>No document preview available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Note Metadata & Author info */}
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {note.branch}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Year {note.year} • Sem {note.semester}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">{note.title}</h1>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mt-1">{note.subject}</p>
            </div>

            {/* Stats Counter Bar */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500">Views</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{note.views || 0}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500">Downloads</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{note.downloads || 0}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500">Likes</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{likeCount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" /> Download Full PDF
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`py-3 px-3.5 rounded-2xl font-semibold text-xs sm:text-sm border flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                    liked
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
                  {liked ? "Liked" : "Like Note"}
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={bookmarkLoading}
                  className={`py-3 px-3.5 rounded-2xl font-semibold text-xs sm:text-sm border flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                    bookmarked
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                  {bookmarked ? "Bookmarked" : "Save Note"}
                </button>
              </div>

              <button
                onClick={handleShare}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                {copied ? "Link Copied to Clipboard!" : "Share Material Link"}
              </button>
            </div>

            {/* Description */}
            {note.description && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Description & Syllabus Topics
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {note.description}
                </p>
              </div>
            )}
          </div>

          {/* Uploader Card */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Uploaded By
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                {note.uploaderAvatar ? (
                  <img
                    src={note.uploaderAvatar}
                    alt="Uploader"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  note.uploaderName?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                  {note.uploaderName || "Anonymous Student"}
                </h3>
                {note.uploaderCollege && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-slate-400" />
                    {note.uploaderCollege}
                  </p>
                )}
              </div>
            </div>

            {note.uploaderId && (
              <Link
                to={`/profile/${note.uploaderId}`}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center block text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View Contributor Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Related Notes from same branch */}
      {relatedNotes.length > 0 && (
        <div className="pt-12 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            More Notes from {note.branch}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedNotes.map((rel) => (
              <NoteCard key={rel.id} note={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
