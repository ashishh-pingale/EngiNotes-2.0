import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { addReview } from "../../services/reviewService";
import { Star, MessageSquarePlus, LogIn, CheckCircle } from "lucide-react";

export default function AddReviewModal({ isOpen, onClose, onSuccess }) {
  const { currentUser, userProfile } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("2");
  const [college, setCollege] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (userProfile?.branch) setBranch(userProfile.branch);
      if (userProfile?.year) setYear(String(userProfile.year));
      if (userProfile?.college) setCollege(userProfile.college);
      setError("");
    }
  }, [isOpen, userProfile]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a few words about your experience.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addReview({
        authorName: userProfile?.name || currentUser?.displayName || "Engineering Student",
        authorId: currentUser?.uid || "anonymous",
        authorAvatar: userProfile?.profilePicture || "",
        college: college.trim() || userProfile?.college || "Engineering College",
        branch,
        year,
        rating,
        comment: comment.trim()
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setComment("");
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to add review:", err);
      setError(err?.message || "Failed to save review. Please check connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Review" maxWidth="max-w-lg">
      {!currentUser ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <LogIn className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to Write a Review</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Please log in with your student account to share feedback and help other engineering peers.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
              onClick={onClose}
            >
              Sign In
            </Link>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : submitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thank You!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your review has been successfully posted to EngiNotes.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
          )}

          {/* Star Rating Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 dark:text-slate-700"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Academic Branch & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {["CSE", "IT", "AIML", "AIDS", "ECE", "Mechanical", "Civil", "Electrical"].map(
                  (b) => (
                    <option key={b} value={b} className="dark:bg-slate-900">
                      {b}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Academic Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {["1", "2", "3", "4"].map((y) => (
                  <option key={y} value={y} className="dark:bg-slate-900">
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* College */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Engineering College
            </label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Pune Institute of Computer Technology"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Review Comment */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Your Review / Feedback
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How has EngiNotes helped your semester exam prep, notes study, or peer collaboration?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 leading-relaxed resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              {loading ? "Posting..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
