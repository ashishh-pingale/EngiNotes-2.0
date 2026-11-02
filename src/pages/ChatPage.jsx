import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchFollowedUsers, subscribeToMessages, sendMessage } from "../services/chatService";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  User,
  Search,
  Sparkles
} from "lucide-react";

export default function ChatPage() {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load connected / followed users
  useEffect(() => {
    if (!currentUser) return;
    async function loadContacts() {
      setLoading(true);
      try {
        const users = await fetchFollowedUsers(currentUser.uid);
        setContacts(users);

        // Check if uid query param is set
        const targetUid = searchParams.get("uid");
        if (targetUid) {
          const found = users.find((u) => u.uid === targetUid);
          if (found) {
            setSelectedUser(found);
          } else {
            // Fetch target user profile directly
            const snap = await getDoc(doc(db, "users", targetUid));
            if (snap.exists()) {
              const uData = { uid: targetUid, ...snap.data() };
              setContacts((prev) => [uData, ...prev]);
              setSelectedUser(uData);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, [currentUser, searchParams]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const unsubscribe = subscribeToMessages(
      currentUser.uid,
      selectedUser.uid,
      (newMessages) => {
        setMessages(newMessages);
      }
    );

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!inputText.trim() || !selectedUser || !currentUser) return;

    const text = inputText;
    setInputText("");
    try {
      await sendMessage(
        currentUser.uid,
        userProfile?.name || currentUser.displayName || "Student",
        selectedUser.uid,
        text
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  const filteredContacts = contacts.filter((c) =>
    (c.name || "Student").toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden h-[750px] flex">
        {/* Contacts Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/60 ${
            selectedUser ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chats</h2>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50">
                {contacts.length} Connected
              </span>
            </div>

            {/* Search contacts */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                placeholder="Search peers..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <LoadingSpinner size="sm" text="Loading peers..." />
            ) : filteredContacts.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400 dark:text-slate-500 text-sm space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>No connections yet.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Follow students from the Discover page to start chatting!
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.uid}
                  onClick={() => setSelectedUser(contact)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedUser?.uid === contact.uid
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-r-4 border-blue-600"
                      : "hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                    {contact.profilePicture ? (
                      <img
                        src={contact.profilePicture}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      contact.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {contact.name || "Student"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {contact.college || contact.branch || "Tap to chat"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/40 ${
            !selectedUser ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                    {selectedUser.profilePicture ? (
                      <img
                        src={selectedUser.profilePicture}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      selectedUser.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedUser.name || "Student"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedUser.college ? `${selectedUser.college} • ` : ""}{selectedUser.branch || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-blue-400" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Start the conversation</p>
                    <p className="text-xs">Say hello or ask for study recommendations!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm"
                          }`}
                        >
                          {m.message}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                          {m.timestamp?.seconds
                            ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : ""}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Select a peer to chat</h3>
              <p className="text-sm max-w-sm text-slate-500 dark:text-slate-400">
                Choose a classmate from the sidebar on the left or connect with new students via the Discover page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
