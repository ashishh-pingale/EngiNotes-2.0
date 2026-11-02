import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Download,
  Mail,
  Shield,
  Search,
  Trash2,
  Check,
  Eye,
  FileText,
  X
} from "lucide-react";

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  // Stats
  const [pendingNotes, setPendingNotes] = useState([]);
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  // Reject Modal
  const [rejectModalNote, setRejectModalNote] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Search filter
  const [search, setSearch] = useState("");

  // Letter-by-letter live filtering across dashboard views
  const filteredPendingNotes = useMemo(() => {
    if (!search.trim()) return pendingNotes;
    const s = search.trim().toLowerCase();
    return pendingNotes.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(s)) ||
        (n.subject && n.subject.toLowerCase().includes(s)) ||
        (n.uploaderName && n.uploaderName.toLowerCase().includes(s)) ||
        (n.branch && n.branch.toLowerCase().includes(s))
    );
  }, [pendingNotes, search]);

  const filteredApprovedNotes = useMemo(() => {
    if (!search.trim()) return approvedNotes;
    const s = search.trim().toLowerCase();
    return approvedNotes.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(s)) ||
        (n.subject && n.subject.toLowerCase().includes(s)) ||
        (n.uploaderName && n.uploaderName.toLowerCase().includes(s)) ||
        (n.branch && n.branch.toLowerCase().includes(s))
    );
  }, [approvedNotes, search]);

  const filteredUsersList = useMemo(() => {
    if (!search.trim()) return usersList;
    const s = search.trim().toLowerCase();
    return usersList.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.college && u.college.toLowerCase().includes(s)) ||
        (u.branch && u.branch.toLowerCase().includes(s))
    );
  }, [usersList, search]);

  const filteredContactMessages = useMemo(() => {
    if (!search.trim()) return contactMessages;
    const s = search.trim().toLowerCase();
    return contactMessages.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(s)) ||
        (m.email && m.email.toLowerCase().includes(s)) ||
        (m.subject && m.subject.toLowerCase().includes(s)) ||
        (m.message && m.message.toLowerCase().includes(s))
    );
  }, [contactMessages, search]);

  async function loadAdminData() {
    setLoading(true);
    try {
      // 1. Fetch notes
      const notesSnap = await getDocs(collection(db, "notes"));
      const allNotes = notesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setPendingNotes(allNotes.filter((n) => n.status === "pending"));
      setApprovedNotes(allNotes.filter((n) => n.status === "approved"));

      // 2. Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      setUsersList(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // 3. Fetch contact messages
      const msgsSnap = await getDocs(collection(db, "contactMessages"));
      setContactMessages(msgsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleApprove(note) {
    try {
      const noteRef = doc(db, "notes", note.id);
      await updateDoc(noteRef, {
        status: "approved",
        approvedAt: serverTimestamp()
      });

      // Notify uploader
      if (note.uploaderId && note.uploaderId !== "anonymous") {
        try {
          await addDoc(collection(db, "notifications"), {
            userId: note.uploaderId,
            recipientId: note.uploaderId,
            senderId: currentUser?.uid || "admin",
            type: "approval",
            message: `Great news! Your note "${note.title}" has been approved by admin.`,
            noteId: note.id,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (notifErr) {
          console.warn("Could not dispatch approval notification:", notifErr);
        }
      }

      await loadAdminData();
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve note: " + (err.message || "Missing or insufficient permissions"));
    }
  }

  async function handleConfirmReject() {
    if (!rejectModalNote) return;

    try {
      const noteRef = doc(db, "notes", rejectModalNote.id);
      await updateDoc(noteRef, {
        status: "rejected",
        rejectReason: rejectReason || "Content did not meet moderation guidelines.",
        rejectedAt: serverTimestamp()
      });

      // Notify uploader
      if (rejectModalNote.uploaderId && rejectModalNote.uploaderId !== "anonymous") {
        try {
          await addDoc(collection(db, "notifications"), {
            userId: rejectModalNote.uploaderId,
            recipientId: rejectModalNote.uploaderId,
            senderId: currentUser?.uid || "admin",
            type: "rejection",
            message: `Your note submission "${rejectModalNote.title}" was not approved: ${rejectReason || "Quality guidelines not met."}`,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (notifErr) {
          console.warn("Could not dispatch rejection notification:", notifErr);
        }
      }

      setRejectModalNote(null);
      setRejectReason("");
      await loadAdminData();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject note: " + (err.message || "Missing or insufficient permissions"));
    }
  }

  async function handleDeleteNote(noteId) {
    if (!window.confirm("Are you sure you want to permanently delete this note?")) return;
    try {
      await deleteDoc(doc(db, "notes", noteId));
      await loadAdminData();
    } catch (err) {
      console.error("Delete note error:", err);
    }
  }

  async function handleDeleteMessage(msgId) {
    try {
      await deleteDoc(doc(db, "contactMessages", msgId));
      setContactMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error("Delete message error:", err);
    }
  }

  async function handleMarkMessageRead(msgId) {
    try {
      await updateDoc(doc(db, "contactMessages", msgId), { status: "read" });
      setContactMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: "read" } : m))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  }

  const totalDownloads = approvedNotes.reduce((acc, n) => acc + (n.downloads || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" /> Staff Moderation Portal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{pendingNotes.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved Notes</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{approvedNotes.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{usersList.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Downloads Served</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalDownloads}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" /> Pending Notes ({pendingNotes.length})
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              className={`pb-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "approved"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <CheckCircle className="w-4 h-4" /> Approved ({approvedNotes.length})
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`pb-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" /> Registered Users ({usersList.length})
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={`pb-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "messages"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Mail className="w-4 h-4" /> Messages ({contactMessages.length})
            </button>
          </div>

          {/* Search bar inside admin table */}
          <div className="pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter entries..."
                className="pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content Tables */}
        <div className="p-6">
          {loading ? (
            <LoadingSpinner text="Fetching dashboard data..." />
          ) : activeTab === "pending" ? (
            /* Pending Notes Table */
            filteredPendingNotes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                {search.trim() ? `No pending notes matching "${search.trim()}".` : "No notes currently waiting for approval!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Title / Subject</th>
                      <th className="py-3 px-4">Branch & Sem</th>
                      <th className="py-3 px-4">Uploader</th>
                      <th className="py-3 px-4">File</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPendingNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{note.title}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-normal">{note.subject}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                            {note.branch}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">
                            Sem {note.semester || 1}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {note.uploaderName || "Anonymous"}
                        </td>
                        <td className="py-4 px-4 text-xs">
                          {(note.pdfUrl || note.fileUrl) ? (
                            <a
                              href={note.pdfUrl || note.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View PDF
                            </a>
                          ) : (
                            "No file"
                          )}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleApprove(note)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectModalNote(note)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "approved" ? (
            /* Approved Notes Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Title / Subject</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Downloads</th>
                    <th className="py-3 px-4">Likes</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredApprovedNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>{note.title}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-normal">{note.subject}</div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium">{note.branch}</td>
                      <td className="py-4 px-4 text-xs">{note.downloads || 0}</td>
                      <td className="py-4 px-4 text-xs">{note.likes || 0}</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === "users" ? (
            /* Users Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">User Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4 rounded-r-xl">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                          {u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        {u.name || "Student"}
                      </td>
                      <td className="py-4 px-4 text-xs">{u.email}</td>
                      <td className="py-4 px-4 text-xs">{u.college || "-"}</td>
                      <td className="py-4 px-4 text-xs">{u.branch || "-"}</td>
                      <td className="py-4 px-4 text-xs">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold ${
                            u.role === "admin"
                              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {u.role || "user"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Contact Messages Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Sender</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredContactMessages.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                        <div>{m.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">{m.email}</div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {m.subject}
                      </td>
                      <td className="py-4 px-4 text-xs max-w-xs truncate">{m.message}</td>
                      <td className="py-4 px-4 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            m.status === "unread"
                              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {m.status || "unread"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {m.status === "unread" && (
                          <button
                            onClick={() => handleMarkMessageRead(m.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(m.id)}
                          className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={!!rejectModalNote}
        onClose={() => setRejectModalNote(null)}
        title="Reason for Rejection"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please provide feedback to the uploader explaining why this note was rejected.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Blurry scan quality, missing Unit 2, or duplicate submission..."
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalNote(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
