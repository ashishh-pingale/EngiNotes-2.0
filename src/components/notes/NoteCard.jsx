import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { toggleNoteLike, checkIfUserLikedNote } from "../../services/notesService";
import { toggleBookmark, checkIfUserBookmarked } from "../../services/bookmarkService";
import {
  Laptop,
  Globe,
  Cpu,
  BarChart3,
  Zap,
  Cog,
  Building2,
  BatteryCharging,
  FileText,
  Eye,
  ArrowRight,
  Heart,
  Bookmark
} from "lucide-react";

const branchIcons = {
  CSE: {
    icon: <Laptop className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-blue-600 to-indigo-600",
    label: "Computer Science"
  },
  IT: {
    icon: <Globe className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-cyan-500 to-blue-600",
    label: "Information Tech"
  },
  AIML: {
    icon: <Cpu className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-indigo-600 to-purple-600",
    label: "AI & ML"
  },
  AIDS: {
    icon: <BarChart3 className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-blue-700 to-violet-600",
    label: "AI & Data Science"
  },
  ECE: {
    icon: <Zap className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-blue-500 to-cyan-500",
    label: "Electronics"
  },
  Mechanical: {
    icon: <Cog className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-slate-700 to-blue-800",
    label: "Mechanical"
  },
  Civil: {
    icon: <Building2 className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-teal-600 to-blue-600",
    label: "Civil Engineering"
  },
  Electrical: {
    icon: <BatteryCharging className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-amber-500 to-blue-600",
    label: "Electrical"
  }
};

export default function NoteCard({ note, onPreview }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(note.likes || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    setLikeCount(note.likes || 0);
    if (currentUser && note.id) {
      checkIfUserLikedNote(note.id, currentUser.uid).then(setLiked);
      checkIfUserBookmarked(note.id, currentUser.uid).then(setBookmarked);
    } else {
      setLiked(false);
      setBookmarked(false);
    }
  }, [note.id, note.likes, currentUser]);

  async function handleQuickLike(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      showToast("Please sign in to like study notes.", "info");
      navigate("/login");
      return;
    }
    setLikeLoading(true);
    try {
      const nowLiked = await toggleNoteLike(note.id, currentUser.uid, liked);
      setLiked(nowLiked);
      setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(0, prev - 1)));
      showToast(nowLiked ? "Liked note!" : "Removed like.", "success");
    } catch (err) {
      console.error("Card like error:", err);
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleQuickBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      showToast("Please sign in to save notes for later.", "info");
      navigate("/login");
      return;
    }
    setBookmarkLoading(true);
    try {
      const nowBookmarked = await toggleBookmark(note.id, currentUser.uid, bookmarked);
      setBookmarked(nowBookmarked);
      showToast(
        nowBookmarked ? "Saved to your study collection!" : "Removed from saved notes.",
        "success"
      );
    } catch (err) {
      console.error("Card bookmark error:", err);
      showToast("Could not update bookmark.", "error");
    } finally {
      setBookmarkLoading(false);
    }
  }

  const branchMeta = branchIcons[note.branch] || {
    icon: <FileText className="w-5 h-5 text-white" />,
    bg: "bg-gradient-to-tr from-blue-600 to-indigo-600",
    label: note.branch || "Engineering"
  };

  const uploadDate = note.createdAt?.seconds
    ? new Date(note.createdAt.seconds * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })
    : "Recently added";

  return (
    <div className="group bg-white dark:bg-slate-900/90 rounded-[28px] p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_16px_36px_rgba(37,99,235,0.12)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full relative">
      {/* Top Header Row: Circular Logo Badge + Top-Right Pill */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Circular Branch/Theme Icon */}
          <div
            className={`w-12 h-12 rounded-full ${branchMeta.bg} flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-105`}
          >
            {branchMeta.icon}
          </div>

          {/* Top-Right Pills (Bookmark + Like Button + Preview) */}
          <div className="flex items-center gap-1.5">
            {/* Quick Bookmark Button */}
            <button
              onClick={handleQuickBookmark}
              disabled={bookmarkLoading}
              className={`p-1.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                bookmarked
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60"
                  : "bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-slate-400 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border-slate-200/70 dark:border-slate-700"
              }`}
              title={bookmarked ? "Remove from saved notes" : "Save for later"}
              aria-label="Save note"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
            </button>

            {/* Quick Like Button */}
            <button
              onClick={handleQuickLike}
              disabled={likeLoading}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                liked
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60"
                  : "bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200/70 dark:border-slate-700"
              }`}
              title={liked ? "Liked Note" : "Like This Note"}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>{likeCount}</span>
            </button>

            {onPreview && (
              <button
                onClick={() => onPreview(note)}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50/50 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700 hover:border-blue-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>Preview</span>
                <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
              </button>
            )}
          </div>
        </div>

        {/* Brand / Subject + Timestamp Line */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <span className="truncate max-w-[180px]">{note.subject || branchMeta.label}</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal shrink-0">{uploadDate}</span>
        </div>

        {/* Note Title */}
        <Link to={`/notes/${note.id}`} className="block mt-1 mb-3.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[3rem] flex items-start">
            {note.title || "Untitled Note"}
          </h3>
        </Link>

        {/* Tag Pills Row */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1 rounded-lg">
            {note.branch || "General"}
          </span>

          <span className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1 rounded-lg">
            {note.year ? `Year ${note.year}` : "All Years"}
          </span>

          <span className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1 rounded-lg">
            {note.semester ? `Sem ${note.semester}` : "Full Notes"}
          </span>
        </div>
      </div>

      {/* Bottom Row / Footer: Stat + Uploader Info on Left, Theme Blue Action Button on Right */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        {/* Left: Metric / Uploader */}
        <div className="min-w-0">
          <div className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {note.downloads ? `${note.downloads} Downloads` : `${note.views || 0} Views`}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
            By {note.uploaderName || "Student"}{note.uploaderCollege ? ` • ${note.uploaderCollege}` : ""}
          </div>
        </div>

        {/* Right: Theme-Matched Blue Action Button */}
        <Link
          to={`/notes/${note.id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow hover:shadow-blue-500/25 inline-flex items-center gap-1.5 shrink-0"
        >
          View note <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
