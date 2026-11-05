/**
 * Optimized PDF Download Utility
 * Automatically injects Cloudinary attachment headers with clean filenames,
 * and handles blob-based downloads with anchor fallbacks.
 */

export function sanitizeFileName(name) {
  if (!name) return "Engineering_Notes";
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60);
}

export function getOptimizedPdfUrl(url, title = "Engineering_Notes") {
  if (!url) return "";

  const cleanTitle = sanitizeFileName(title);

  // If Cloudinary resource, inject attachment flag for direct download
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (!url.includes("fl_attachment")) {
      return url.replace("/upload/", `/upload/fl_attachment:${cleanTitle}/`);
    }
  }

  return url;
}

export async function downloadNotePDF(url, title = "Engineering_Notes") {
  if (!url) return;

  const cleanName = sanitizeFileName(title);
  const targetFileName = `${cleanName}.pdf`;
  const optimizedUrl = getOptimizedPdfUrl(url, cleanName);

  try {
    // Attempt blob fetch for direct download with clean filename
    const res = await fetch(optimizedUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = targetFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      return;
    }
  } catch (err) {
    // CORS or network fallback
    console.info("Using direct anchor download fallback:", err?.message || err);
  }

  // Anchor fallback with optimized attachment URL
  const link = document.createElement("a");
  link.href = optimizedUrl;
  link.download = targetFileName;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

