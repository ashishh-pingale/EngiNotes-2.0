import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadNotePdf } from "../services/cloudinary";
import { createNoteSubmission } from "../services/notesService";
import Modal from "../components/common/Modal";
import {
  UploadCloud,
  FileCheck,
  FileText,
  AlertCircle,
  X,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const branches = ["CSE", "IT", "AIML", "AIDS", "ECE", "Mechanical", "Civil", "Electrical"];
const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

export default function UploadPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [branch, setBranch] = useState(userProfile?.branch || "CSE");
  const [year, setYear] = useState(userProfile?.year || "1");
  const [semester, setSemester] = useState("1");
  const [description, setDescription] = useState("");

  // Progress & Status
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      setErrorMsg("Please upload a valid PDF document (.pdf).");
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMsg("File size exceeds 25 MB. Please choose a smaller file.");
      return;
    }
    setErrorMsg("");
    setFile(selectedFile);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a PDF file to upload.");
      return;
    }
    if (!title.trim() || !subject.trim()) {
      setErrorMsg("Please fill in both Title and Subject.");
      return;
    }

    setUploading(true);
    setProgress(10);
    setErrorMsg("");

    try {
      // 1. Upload file to Cloudinary with progress tracking
      const fileUrl = await uploadNotePdf(file, (pct) => {
        setProgress(Math.max(10, Math.min(pct, 90)));
      });

      // 2. Submit record to Firestore
      await createNoteSubmission({
        title: title.trim(),
        subject: subject.trim(),
        branch,
        year,
        semester,
        description: description.trim(),
        fileUrl,
        pdfUrl: fileUrl,
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uploaderId: currentUser?.uid || "anonymous",
        uploaderName: userProfile?.name || currentUser?.displayName || "Student",
        uploaderAvatar: userProfile?.profilePicture || "",
        uploaderCollege: userProfile?.college || ""
      });

      setProgress(100);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setErrorMsg(err.message || "Upload failed. Please check your network and try again.");
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setFile(null);
    setTitle("");
    setSubject("");
    setDescription("");
    setProgress(0);
    setShowSuccessModal(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Peer Contributions
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Share Your Study Notes
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Help thousands of classmates by uploading clean handwritten notes, lecture slides, or exam summaries.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/90 p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
        {/* Drag & Drop Zone */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 dark:text-slate-200">
            Upload PDF Document <span className="text-red-500">*</span>
          </label>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]"
                : file
                ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Click to browse or drag & drop your PDF
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Only PDF files up to 25 MB are accepted
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Note Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems Unit 1 to 3 Handwritten Notes"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Database Management Systems"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            >
              {branches.map((b) => (
                <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            >
              <option value="1" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">1st Year</option>
              <option value="2" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">2nd Year</option>
              <option value="3" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">3rd Year</option>
              <option value="4" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">4th Year</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            >
              {semesters.map((s) => (
                <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Description & Topics Covered
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief summary of what's inside these notes (chapters, questions, formula sheets)..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Uploading to cloud...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {uploading ? `Uploading Note (${progress}%)...` : "Submit Notes for Review"}
        </button>
      </form>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Upload Successful!">
        <div className="text-center space-y-5 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your note has been submitted!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Thank you for contributing. Your notes are now pending moderator review and will be publicly visible upon approval.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={resetForm}
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Upload Another
            </button>
            <button
              onClick={() => navigate("/browse")}
              className="py-3 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Notes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
