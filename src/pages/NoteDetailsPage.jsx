import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  getNoteById,
  recordNoteView,
  recordNoteDownload,
  fetchApprovedNotes
} from "../services/notesService";
import { rateNote, getUserRatingForNote } from "../services/ratingService";
import StarRating from "../components/common/StarRating";
import { downloadNotePDF } from "../utils/downloadUtils";
import { getOptimizedImageUrl } from "../utils/imageUtils";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  toggleBookmark,
  checkIfUserBookmarked
} from "../services/bookmarkService";
import {
  fetchNoteComments,
  addNoteComment,
  deleteNoteComment
} from "../services/commentService";
import ReportNoteModal from "../components/notes/ReportNoteModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import NoteCard from "../components/notes/NoteCard";
import {
  Bookmark,
  Download,
  Share2,
  Eye,
  Calendar,
  Building,
  ArrowLeft,
  FileText,
  UserCheck,
  ExternalLink,
  MessageSquare,
  Send,
  Trash2,
  Flag
} from "lucide-react";

export default function NoteDetailsPage() {
  const { noteId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedNotes, setRelatedNotes] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getNoteById(noteId);
        if (data) {
          setNote(data);
          setRating(Number(data.rating) || 0);
          setRatingsCount(Number(data.ratingsCount) || 0);
          recordNoteView(noteId);

          if (currentUser) {
            getUserRatingForNote(noteId, currentUser.uid).then(setUserRating);
            checkIfUserBookmarked(noteId, currentUser.uid).then(setBookmarked);
          } else {
            setUserRating(null);
            setBookmarked(false);
          }

          // Load related notes from same branch
          if (data.branch) {
            fetchApprovedNotes({ branch: data.branch }).then((rel) => {
              setRelatedNotes(rel.filter((r) => r.id !== noteId).slice(0, 3));
            });
          }

          // Load comments
          setCommentsLoading(true);
          fetchNoteComments(noteId)
            .then(setComments)
            .finally(() => setCommentsLoading(false));
        }
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [noteId, currentUser]);

  async function handlePostComment(e) {
    e.preventDefault();
    if (!currentUser) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const created = await addNoteComment(
        note.id || noteId,
        newCommentText,
        currentUser,
        userProfile,
        note?.uploaderId,
        note?.title
      );
      setComments((prev) => [...prev, created]);
      setNewCommentText("");
      showToast("Question posted to class discussion!", "success");
    } catch (err) {
      console.error("Error posting comment:", err);
      showToast("Failed to post question. Please try again.", "error");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteNoteComment(commentId, note?.id || noteId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      showToast("Comment deleted.", "info");
    } catch (err) {
      console.error("Failed to delete comment:", err);
      showToast("Could not delete comment.", "error");
    }
  }

  async function handleRateNote(score) {
    if (!currentUser) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setRatingSubmitting(true);
    try {
      const targetNoteId = note.id || noteId;
      const res = await rateNote(targetNoteId, currentUser.uid, score, note);
      setUserRating(res.userRating);
      setRating(res.rating);
      setRatingsCount(res.ratingsCount);
      showToast(`You rated this note ${score} stars! Thank you for helping classmates.`, "success");
    } catch (e) {
      console.error("Rate note error:", e);
      showToast("Could not save rating. Please try again.", "error");
    } finally {
      setRatingSubmitting(false);
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
        downloadNotePDF(downloadUrl, note.title || `${note.subject || "Notes"}_Sem${note.semester || "1"}`);
        showToast("Starting download...", "info");
      }
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <LoadingSpinner text="Loading note details..." />
      </div>
    );
  }

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

          {/* Class Questions & Discussion Section */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Class Questions & Discussion
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ask questions, clarify derivations, or leave study tips for peers.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {comments.length} {comments.length === 1 ? "question" : "questions"}
              </span>
            </div>

            {/* Post Input */}
            {currentUser ? (
              <form onSubmit={handlePostComment} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Ask a question about this lecture note or share a helpful insight..."
                    className="w-full p-3.5 pr-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newCommentText.trim()}
                    className="absolute right-3 bottom-3.5 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                    title="Post question"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between gap-4 text-xs">
                <span className="text-blue-800 dark:text-blue-300">
                  Have a question about this material? Sign in to join the peer discussion.
                </span>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold shrink-0 hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Comments Thread */}
            {commentsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading discussion...</div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-1 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-6">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No questions yet
                </p>
                <p className="text-xs">
                  Be the first classmate to start a discussion on these notes!
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800">
                {comments.map((c) => {
                  const isAuthor = currentUser && currentUser.uid === c.authorId;
                  const isAdmin = userProfile?.role === "admin";
                  const canDelete = isAuthor || isAdmin;
                  const timeStr = c.createdAt?.seconds
                    ? new Date(c.createdAt.seconds * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "Just now";

                  return (
                    <div key={c.id} className="pt-3.5 first:pt-0 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        {c.authorAvatar ? (
                          <img
                            src={getOptimizedImageUrl(c.authorAvatar, { width: 72, height: 72 })}
                            alt={c.authorName || "User"}
                            loading="lazy"
                            decoding="async"
                            width="36"
                            height="36"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (c.authorName || "S").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <Link
                              to={`/profile/${c.authorId}`}
                              className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                            >
                              {c.authorName || "Student"}
                            </Link>
                            {c.authorBranch && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {c.authorBranch}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {timeStr}
                            </span>
                          </div>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-line">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
                <span className="block text-xs text-slate-400 dark:text-slate-500">Rating</span>
                <span className="text-base font-bold text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1">
                  ★ {rating > 0 ? (rating % 1 === 0 ? `${rating}.0` : rating.toFixed(1)) : "New"}
                  {ratingsCount > 0 && <span className="text-xs text-slate-400 font-normal">({ratingsCount})</span>}
                </span>
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

              {/* Interactive 5-Star Rating Card */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Rate this Material
                  </span>
                  {userRating ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Your rating: {userRating} ★
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Tap a star
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <StarRating
                    value={rating}
                    userRating={userRating}
                    onRate={handleRateNote}
                    disabled={ratingSubmitting}
                    size="lg"
                  />

                  <button
                    onClick={handleBookmark}
                    disabled={bookmarkLoading}
                    className={`py-2 px-3.5 rounded-xl font-semibold text-xs border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50 ${
                      bookmarked
                        ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-amber-600"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                    <span>{bookmarked ? "Saved" : "Save"}</span>
                  </button>
                </div>
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
                    src={getOptimizedImageUrl(note.uploaderAvatar, { width: 96, height: 96 })}
                    alt="Uploader"
                    loading="lazy"
                    decoding="async"
                    width="48"
                    height="48"
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

            {/* Report Button */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this Material</span>
            </button>
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

      {/* Report Modal */}
      <ReportNoteModal
        note={note}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
