import React, { useState } from "react";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { submitNoteReport } from "../../services/reportService";
import { AlertTriangle, Send } from "lucide-react";

const REASONS = [
  { id: "copyright", label: "Copyright infringement / Plagiarism" },
  { id: "quality", label: "Illegible or poor handwriting / corrupted file" },
  { id: "wrong_info", label: "Wrong syllabus, subject, or misleading title" },
  { id: "inappropriate", label: "Harmful, abusive, or inappropriate content" },
  { id: "other", label: "Other problem" }
];

export default function ReportNoteModal({ note, isOpen, onClose }) {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState(REASONS[0].id);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!note) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
      showToast("Please log in to report content.", "info");
      return;
    }

    setSubmitting(true);
    try {
      const selectedReasonObj = REASONS.find((r) => r.id === reason);
      await submitNoteReport({
        noteId: note.id,
        noteTitle: note.title,
        noteUploaderId: note.uploaderId,
        reporterId: currentUser.uid,
        reporterName: userProfile?.name || currentUser.displayName || "Student",
        reporterEmail: currentUser.email || "",
        reason: selectedReasonObj?.label || reason,
        details
      });

      showToast("Report submitted. Our moderation team has been notified.", "success");
      setDetails("");
      onClose();
    } catch (err) {
      console.error("Report submission failed:", err);
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Study Material"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p>
            Help keep EngiNotes safe and high-quality. If this material violates copyright or quality standards, let us know.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Reason for reporting
          </label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  reason === r.id
                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 font-semibold text-blue-700 dark:text-blue-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Additional details (Optional)
          </label>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the issue (e.g., page 4 is illegible, duplicate content)..."
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

