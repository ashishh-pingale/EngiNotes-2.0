import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  recordNoteDownload,
  recordNoteView
} from "../../services/notesService";
import { rateNote, getUserRatingForNote } from "../../services/ratingService";
import StarRating from "../common/StarRating";
import {
  toggleBookmark,
  checkIfUserBookmarked
} from "../../services/bookmarkService";
import { downloadNotePDF } from "../../utils/downloadUtils";
import {
  Bookmark,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Calendar,
  Building,
  Flag
} from "lucide-react";
import ReportNoteModal from "./ReportNoteModal";

export default function NotePreviewModal({ note, isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (note) {
      setRating(Number(note.rating) || 0);
      setRatingsCount(Number(note.ratingsCount) || 0);
      recordNoteView(note.id);

      if (currentUser && note.id) {
        getUserRatingForNote(note.id, currentUser.uid).then(setUserRating);
        checkIfUserBookmarked(note.id, currentUser.uid).then(setBookmarked);
      } else {
        setUserRating(null);
        setBookmarked(false);
      }
    }
  }, [note, currentUser]);

  if (!note) return null;

  async function handleRateNote(score) {
    if (!currentUser) {
      onClose();
      navigate("/login");
      return;
    }
    setRatingSubmitting(true);
    try {
      const res = await rateNote(note.id, currentUser.uid, score, note);
      setUserRating(res.userRating);
      setRating(res.rating);
      setRatingsCount(res.ratingsCount);
      showToast(`You rated this note ${score} stars!`, "success");
    } catch (e) {
      console.error("Rate note error:", e);
      showToast("Could not record rating.", "error");
    } finally {
      setRatingSubmitting(false);
    }
  }

  async function handleBookmark() {
    if (!currentUser) {
      onClose();
      navigate("/login");
      return;
    }
    setBookmarkLoading(true);
    try {
      const nowBookmarked = await toggleBookmark(note.id, currentUser.uid, bookmarked);
      setBookmarked(nowBookmarked);
      if (nowBookmarked) {
        showToast("Saved to your study bookmarks!", "success");
      } else {
        showToast("Removed from bookmarks", "info");
      }
    } catch (e) {
      console.error("Bookmark toggle failed:", e);
    } finally {
      setBookmarkLoading(false);
    }
  }

  const pdfUrl = note.pdfUrl || note.fileUrl;

  function handleDownload() {
    recordNoteDownload(note.id);
    if (pdfUrl) {
      downloadNotePDF(pdfUrl, note.title || `${note.subject || "Notes"}_Sem${note.semester || "1"}`);
      showToast("Starting download...", "info");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Note Preview" maxWidth="max-w-4xl">
      <div className="flex flex-col lg:flex-row gap-6 max-h-[80vh] overflow-y-auto">
        {/* PDF Frame */}
        <div className="lg:w-3/5 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 min-h-[350px] lg:min-h-[480px] flex flex-col">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={note.title || "Note Preview"}
              className="w-full flex-1 min-h-[400px] border-0 bg-white"
              allow="fullscreen"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FileText className="w-12 h-12 mb-2 text-slate-500" />
              <p className="text-sm">No preview document available.</p>
            </div>
          )}
        </div>

        {/* Note Metadata & Actions */}
        <div className="lg:w-2/5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 inline-block mb-2">
                {note.branch} • Sem {note.semester || "1"}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {note.title}
              </h2>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{note.subject}</p>
            </div>

            {note.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {note.description}
              </p>
            )}

            {/* Uploader Card */}
            <div className="p-3 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
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
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {note.uploaderName || "Anonymous"}
                </p>
                {note.uploaderCollege && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {note.uploaderCollege}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-xs text-slate-400 dark:text-slate-500">Views</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{note.views || 0}</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-xs text-slate-400 dark:text-slate-500">Downloads</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{note.downloads || 0}</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-xs text-slate-400 dark:text-slate-500">Likes</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{likeCount}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Interactive Rating Strip */}
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Rate Material
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  ★ {rating > 0 ? (rating % 1 === 0 ? `${rating}.0` : rating.toFixed(1)) : "New"} {ratingsCount > 0 ? `(${ratingsCount})` : ""}
                </span>
              </div>
              <StarRating
                value={rating}
                userRating={userRating}
                onRate={handleRateNote}
                disabled={ratingSubmitting}
                size="md"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 ${
                  bookmarked
                    ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                {bookmarked ? "Bookmarked" : "Save for Later"}
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-dashed border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Note</span>
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Document
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <Link
                to={`/notes/${note.id}`}
                onClick={onClose}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Open Full Note Page <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Flag className="w-3 h-3" /> Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportNoteModal
        note={note}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </Modal>
  );
}
