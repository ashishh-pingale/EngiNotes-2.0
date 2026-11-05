import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchReviews } from "../services/reviewService";
import { getOptimizedImageUrl } from "../utils/imageUtils";
import AddReviewModal from "../components/reviews/AddReviewModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { ReviewCardSkeletonGrid } from "../components/common/Skeletons";
import {
  Star,
  MessageSquarePlus,
  ArrowLeft,
  Calendar,
  Building,
  GraduationCap,
  MessageSquare
} from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadAllReviews() {
    setLoading(true);
    try {
      const data = await fetchReviews();
      setReviews(data);
    } catch (err) {
      console.error("Error loading reviews:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllReviews();
    window.addEventListener("enginotes_review_added", loadAllReviews);
    return () => window.removeEventListener("enginotes_review_added", loadAllReviews);
  }, []);

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-[calc(100vh-140px)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Reviews & Feedback
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real feedback and exam experiences shared by engineering students.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm hover:shadow inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {/* Reviews Summary Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{averageRating}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Average Student Rating</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{reviews.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Verified Reviews</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">100%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Peer Recommendation</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      {loading ? (
        <ReviewCardSkeletonGrid count={6} />
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/90 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No reviews yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            There are currently no reviews submitted by students. Be the first to share your experience with EngiNotes!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Add First Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => {
            const dateStr = r.createdAt?.seconds
              ? new Date(r.createdAt.seconds * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })
              : "Recently added";

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  {/* Rating Stars & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-4 h-4 ${idx < (r.rating || 5)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-slate-700"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {dateStr}
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    "{r.comment}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs overflow-hidden">
                    {r.authorAvatar && r.authorAvatar.startsWith("http") ? (
                      <img
                        src={getOptimizedImageUrl(r.authorAvatar, { width: 72, height: 72 })}
                        alt={r.authorName || "Student"}
                        loading="lazy"
                        decoding="async"
                        width="36"
                        height="36"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      r.authorName?.charAt(0)?.toUpperCase() || "S"
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {r.authorName || "Engineering Student"}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {r.branch ? `${r.branch}` : ""}
                      {r.year ? ` • Year ${r.year}` : ""}
                      {r.college ? ` • ${r.college}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <AddReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadAllReviews}
      />
    </div>
  );
}
