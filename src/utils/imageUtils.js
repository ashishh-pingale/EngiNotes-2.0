/**
 * Optimizes an image URL for performance and modern formats.
 * Automatically injects Cloudinary transformations (WebP/AVIF auto-format, quality auto, resize)
 * to save bandwidth and improve Lighthouse scores.
 */
export function getOptimizedImageUrl(url, { width = 96, height = 96, crop = "fill" } = {}) {
  if (!url || typeof url !== "string") return "";

  // Cloudinary optimization: convert to modern format (f_auto), compress (q_auto), and resize
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (!url.includes("f_auto") && !url.includes("q_auto")) {
      return url.replace(
        "/upload/",
        `/upload/f_auto,q_auto,w_${width},h_${height},c_${crop}/`
      );
    }
  }

  return url;
}

