import React, { useState } from "react";
import { Star } from "lucide-react";

const STAR_LABELS = {
  1: "Poor (1)",
  2: "Fair (2)",
  3: "Good (3)",
  4: "Very Good (4)",
  5: "Excellent (5)"
};

/**
 * StarRating component supporting both interactive rating and display badge modes.
 *
 * @param {number} value - Current average or active rating (0 - 5)
 * @param {number} count - Total ratings count (optional)
 * @param {number} userRating - User's existing rating (if any)
 * @param {function} onRate - Callback when user clicks a star: (score) => void
 * @param {boolean} readonly - Display-only badge mode
 * @param {string} size - "sm" | "md" | "lg"
 * @param {boolean} showCount - Whether to render total reviews count
 */
export default function StarRating({
  value = 0,
  count = 0,
  userRating = null,
  onRate,
  readonly = false,
  size = "md",
  showCount = true,
  disabled = false
}) {
  const [hoverScore, setHoverScore] = useState(0);

  const starSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6"
  };

  const starClass = starSizes[size] || starSizes.md;
  const activeRating = hoverScore || userRating || (readonly ? Number(value) : 0);

  // If readonly mode, render compact badge or inline star row
  if (readonly) {
    const formattedValue =
      Number(value) > 0
        ? (Number(value) % 1 === 0 ? `${Number(value)}.0` : Number(value).toFixed(1))
        : count > 0 ? "Rated" : "New";

    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold text-xs shadow-2xs">
        <Star className={`${starClass} fill-amber-400 text-amber-400 shrink-0`} />
        <span>{formattedValue}</span>
        {showCount && Number(count) > 0 && (
          <span className="text-[11px] font-normal text-amber-600/80 dark:text-amber-400/80">
            ({count})
          </span>
        )}
      </div>
    );
  }

  // Interactive Mode
  return (
    <div className="flex flex-col items-center sm:items-start gap-1.5">
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHoverScore(0)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = activeRating >= starIndex;
          return (
            <button
              key={starIndex}
              type="button"
              disabled={disabled}
              onMouseEnter={() => setHoverScore(starIndex)}
              onClick={() => onRate && onRate(starIndex)}
              className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              title={STAR_LABELS[starIndex]}
              aria-label={`Rate ${starIndex} of 5 stars`}
            >
              <Star
                className={`${starClass} transition-colors ${
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                    : "text-slate-300 dark:text-slate-600 hover:text-amber-300"
                }`}
              />
            </button>
          );
        })}
      </div>

      {hoverScore > 0 ? (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 animate-in fade-in duration-100">
          {STAR_LABELS[hoverScore]}
        </span>
      ) : userRating ? (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Your rating: <strong className="text-amber-600 dark:text-amber-400">{userRating} / 5</strong>
        </span>
      ) : null}
    </div>
  );
}
