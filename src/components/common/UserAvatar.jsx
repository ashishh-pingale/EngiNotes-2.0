import React, { useState, useEffect } from "react";
import { getOptimizedImageUrl } from "../../utils/imageUtils";

/**
 * Reusable UserAvatar component that gracefully handles:
 * 1. Image loading errors (e.g. 403 Forbidden on Google avatars, broken URLs)
 * 2. referrerPolicy="no-referrer" for Google cross-origin avatars
 * 3. Fallback to the first initial of the user's first name
 * 4. Flex centering with overflow-hidden and shrink-0 to prevent layout shift or misaligned broken alt text
 */
export default function UserAvatar({
  src,
  name,
  size = "md", // "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  className = "",
  textClassName = "",
  sizePx = 96
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error state whenever the source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Extract first initial of the first name
  const displayName = (name || "Student").trim();
  const firstName = displayName.split(/\s+/)[0] || "Student";
  const initial = firstName.charAt(0).toUpperCase() || "S";

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-xl font-bold",
    "2xl": "w-24 h-24 sm:w-28 sm:h-28 text-3xl font-extrabold"
  };

  const baseSize = sizeClasses[size] || sizeClasses.md;
  const optimizedSrc = src ? getOptimizedImageUrl(src, { width: sizePx, height: sizePx }) : "";

  return (
    <div
      className={`rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold flex items-center justify-center shrink-0 overflow-hidden select-none shadow-sm ${baseSize} ${className}`}
    >
      {optimizedSrc && !hasError ? (
        <img
          src={optimizedSrc}
          alt=""
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={textClassName}>{initial}</span>
      )}
    </div>
  );
}
