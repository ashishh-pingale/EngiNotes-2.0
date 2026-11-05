import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Modal from "../components/common/Modal";
import {
  Mail,
  Send,
  MessageSquare,
  Building,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await addDoc(collection(db, "contactMessages"), {
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
        status: "unread",
        createdAt: serverTimestamp()
      });

      setShowSuccessModal(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Contact submit error:", err);
      setErrorMsg("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Get in Touch
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Have questions, suggestions, or want to report an issue with a study note? We would love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Contact Information</h3>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Fill out the form and our student coordinator team will get back to you within 24-48 hours.
            </p>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span>support@enginotes.org</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <span>Engineering Student Network</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 text-xs text-blue-100">
            <span className="font-bold">Note:</span> If you are reporting a copyrighted or inaccurate document, please mention the note title in your message.
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900/90 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Your Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              >
                <option value="General Inquiry" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">General Inquiry</option>
                <option value="Note Quality or Syllabus Issue" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Note Quality / Syllabus Issue</option>
                <option value="Bug Report" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Technical Bug Report</option>
                <option value="Feature Suggestion" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Feature Suggestion</option>
                <option value="College Club Collaboration" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">College Club / Student Chapter Collaboration</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Message
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" /> {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Message Sent!">
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thank you for reaching out!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your inquiry has been submitted to the EngiNotes student moderation board. We will reply to your email shortly.
          </p>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
