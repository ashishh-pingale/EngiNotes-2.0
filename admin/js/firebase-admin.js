import { db, auth } from "../../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ======================================
// Dashboard
// ======================================

const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const usersCount = document.getElementById("usersCount");
const downloadsCount = document.getElementById("downloadsCount");


// ======================================
// Tables
// ======================================

const recentUploadsTable = document.getElementById("recentUploadsTable");
const pendingNotesTable = document.getElementById("pendingNotesTable");
const approvedNotesTable = document.getElementById("approvedNotesTable");
const rejectedNotesTable = document.getElementById("rejectedNotesTable");
const usersTable = document.getElementById("usersTable");
const contactMessagesTable = document.getElementById("contactMessagesTable");


// ======================================
// Search & Filters
// ======================================

const pendingSearch = document.getElementById("pendingSearch");
const approvedSearch = document.getElementById("approvedSearch");
const rejectedSearch = document.getElementById("rejectedSearch");
const userSearch = document.getElementById("userSearch");

const branchFilter = document.getElementById("branchFilter");
const yearFilter = document.getElementById("yearFilter");


// ======================================
// Settings
// ======================================

const websiteName = document.getElementById("websiteName");
const uploadLimit = document.getElementById("uploadLimit");
const allowRegistrations = document.getElementById("allowRegistrations");
const allowUploads = document.getElementById("allowUploads");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");


// ======================================
// Logout
// ======================================

const logoutBtn = document.getElementById("logoutBtn");


// ======================================
// Preview Modal
// ======================================

const toastContainer = document.getElementById("toastContainer");
const userModal = document.getElementById("userModal");
const previewModal = document.getElementById("previewModal");
const previewFrame = document.getElementById("previewFrame");
const closePreviewBtn = previewModal.querySelector(".close-modal");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const closeDeleteModal = document.getElementById("closeDeleteModal");
let noteToDelete = null;
let contactMessageToDelete = null;

function openDeleteModal(noteId, noteTitle) {

    noteToDelete = noteId;

    document.getElementById("deleteMessage").textContent =
        `Are you sure you want to delete "${noteTitle}"? This action cannot be undone.`;

    deleteModal.classList.add("show");

}

function closeDelete() {

    noteToDelete = null;
    contactMessageToDelete = null;

    deleteModal.querySelector("h3").textContent =
        "Delete Note";

    deleteModal.querySelector("h2").textContent =
        "Delete this note?";

    deleteModal.classList.remove("show");

}
cancelDeleteBtn.addEventListener("click", closeDelete);

closeDeleteModal.addEventListener("click", closeDelete);

deleteModal.addEventListener("click", (e) => {

    if (e.target === deleteModal) {

        closeDelete();

    }

});


// ======================================
// Helpers
// ======================================

function formatDate(timestamp) {

    if (!timestamp) return "-";

    return new Date(
        timestamp.seconds * 1000
    ).toLocaleDateString();

}

function capitalize(text) {

    return text.charAt(0).toUpperCase() + text.slice(1);

}

function statusBadge(status) {

    return `
        <span class="badge ${status}">
            ${capitalize(status)}
        </span>
    `;

}


// ======================================
// Preview Modal
// ======================================

function openPreview(url) {

    console.log("Opening preview:", url);

    previewFrame.src = url;
    previewModal.classList.add("show");

}

function closePreview() {

    previewFrame.src = "";
    previewModal.classList.remove("show");

}

closePreviewBtn.addEventListener("click", closePreview);

previewModal.addEventListener("click", (e) => {

    if (e.target === previewModal) {

        closePreview();

    }

});

function openUserModal(user) {

    document.getElementById("userModalName").textContent =
        user.name || "Unknown User";

    document.getElementById("userModalEmail").textContent =
        user.email || "-";

    document.getElementById("userModalUID").textContent =
        user.uid || user.id || "-";

    document.getElementById("userModalJoined").textContent =
        formatDate(user.createdAt);

    document.getElementById("userModalUploads").textContent =
        user.uploadCount || 0;

    document.getElementById("userModalApproved").textContent =
        user.approvedCount || 0;

    document.getElementById("userModalPending").textContent =
        user.pendingCount || 0;

    document.getElementById("userModalRejected").textContent =
        user.rejectedCount || 0;

    document.getElementById("userModalAvatar").src =
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=2563eb&color=fff`;

    userModal.classList.add("show");

}

document.getElementById("closeUserModal")
    .addEventListener("click", () => {

        userModal.classList.remove("show");

    });

userModal.addEventListener("click", (e) => {

    if (e.target === userModal) {

        userModal.classList.remove("show");

    }

});

function showToast(type, title, message) {

    const icons = {

        success: "fa-circle-check",
        error: "fa-circle-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"

    };

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerHTML = `

        <i class="fa-solid ${icons[type]}"></i>

        <div class="toast-text">

            <h4>${title}</h4>

            <p>${message}</p>

        </div>

    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {

        toast.style.animation = "toastOut .3s forwards";

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}


// ======================================
// Dashboard
// ======================================

async function loadDashboardStats() {

    try {

        const notesSnapshot = await getDocs(
            collection(db, "notes")
        );

        const usersSnapshot = await getDocs(
            collection(db, "users")
        );

        let pending = 0;
        let approved = 0;
        let downloads = 0;

        notesSnapshot.forEach(docSnap => {

            const note = docSnap.data();

            if (note.status === "pending") pending++;

            if (note.status === "approved") approved++;

            downloads += note.downloads || 0;

        });

        pendingCount.textContent = pending;
        approvedCount.textContent = approved;
        usersCount.textContent = usersSnapshot.size;
        downloadsCount.textContent = downloads;

    }

    catch (error) {

        console.error(error);

    }

}


// ======================================
// Recent Uploads
// ======================================

async function loadRecentUploads() {

    try {

        const recentQuery = query(

            collection(db, "notes"),

            orderBy("uploadedAt", "desc"),

            limit(5)

        );

        const snapshot = await getDocs(recentQuery);

        recentUploadsTable.innerHTML = "";

        snapshot.forEach(docSnap => {

            const note = docSnap.data();

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>${note.title}</td>

                <td>${note.uploaderName}</td>

                <td>${note.branch}</td>

                <td>
                    ${statusBadge(note.status)}
                </td>

                <td>

                    <button class="table-btn view-btn">
                        View
                    </button>

                </td>

            `;

            row.querySelector(".view-btn")
                .addEventListener("click", () => {
                    console.log("VIEW BUTTON CLICKED");

                    openPreview(note.pdfUrl);

                });

            recentUploadsTable.appendChild(row);

        });

    }

    catch (error) {

        console.error(error);

    }

}

// ======================================
// Confirm Delete Function
// ======================================

async function confirmDeleteNote() {
    console.log("DELETE CLICKED");

    if (!noteToDelete) return;

    try {

        await deleteDoc(
            doc(db, "notes", noteToDelete)
        );

        closeDelete();

        await refreshAdmin();

        showToast(
            "success",
            "Deleted",
            "Note deleted successfully."
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "error",
            "Delete Failed",
            "Unable to delete note."
        );

    }

}
confirmDeleteBtn.addEventListener(
    "click",
    async () => {

        if (contactMessageToDelete) {

            await confirmDeleteContactMessage();

        } else {

            await confirmDeleteNote();

        }

    }
);

async function confirmDeleteContactMessage() {

    if (!contactMessageToDelete) return;

    try {

        await deleteContactMessage(
            contactMessageToDelete
        );

        contactMessages =
            contactMessages.filter(
                message =>
                    message.id !== contactMessageToDelete
            );

        closeDelete();

        const contactModal =
            document.getElementById(
                "contactMessageModal"
            );

        if (contactModal) {

            contactModal.style.display = "none";

        }

        renderContactMessages(
            getFilteredContactMessages()
        );

        showToast(
            "success",
            "Message Deleted",
            "The contact message was deleted successfully."
        );

        contactMessageToDelete = null;

    }

    catch (error) {

        console.error(
            "Error deleting contact message:",
            error
        );

        showToast(
            "error",
            "Delete Failed",
            "Unable to delete the contact message."
        );

    }

}


// ======================================
// Refresh Helper
// ======================================

async function refreshAdmin() {

    await Promise.all([

        loadDashboardStats(),

        loadRecentUploads(),

        loadPendingNotes(),

        loadApprovedNotes(),

        loadRejectedNotes(),

        loadUsers(),

        loadContactMessages()

    ]);

}

// ======================================
// Pending Notes
// ======================================

let pendingNotesCache = [];

// Load Pending Notes
async function loadPendingNotes() {

    try {

        const pendingQuery = query(
            collection(db, "notes"),
            where("status", "==", "pending"),
            orderBy("uploadedAt", "desc")
        );

        const snapshot = await getDocs(pendingQuery);

        pendingNotesCache = [];

        snapshot.forEach(docSnap => {

            pendingNotesCache.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        renderPendingNotes(pendingNotesCache);

    }

    catch (error) {

        console.error("Error loading pending notes:", error);

    }

}


// ======================================
// Render Pending Notes
// ======================================

function renderPendingNotes(notes) {

    pendingNotesTable.innerHTML = "";

    if (notes.length === 0) {

        pendingNotesTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center">
                    No Pending Notes Found
                </td>
            </tr>
        `;

        return;

    }

    notes.forEach(note => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${note.title}</td>

            <td>${note.subject}</td>

            <td>${note.uploaderName}</td>

            <td>${note.branch}</td>

            <td>${note.year}</td>

            <td>${formatDate(note.uploadedAt)}</td>

            <td>
                <div class="action-buttons">
                <button class="table-btn approve-btn">
                    Approve
                </button>

                <button class="table-btn reject-btn">
                    Reject
                </button>

                <button class="table-btn view-btn">
                    View
                </button>
                </div>

            </td>

        `;

        // Approve
        row.querySelector(".approve-btn")
            .addEventListener("click", () => {
                console.log("BUTTON CLICKED");

                approveNote(note.id);

            });

        // Reject
        row.querySelector(".reject-btn")
            .addEventListener("click", () => {

                rejectNote(note.id);

            });

        // Preview
        row.querySelector(".view-btn")
            .addEventListener("click", () => {

                openPreview(note.pdfUrl);

            });

        pendingNotesTable.appendChild(row);

    });

}



// ======================================
// Approve Note
// ======================================

async function approveNote(noteId) {

    try {

        await updateDoc(
            doc(db, "notes", noteId),
            {
                status: "approved"
            }
        );

        await refreshAdmin();
        showToast(
            "success",
            "Note Approved",
            "The note has been approved successfully."
        );


    }

    catch (error) {

        showToast(
            "error",
            "Approval Failed",
            "Unable to approve the note."
        );


    }

}



// ======================================
// Reject Note
// ======================================

async function rejectNote(noteId) {

    try {

        await updateDoc(
            doc(db, "notes", noteId),
            {
                status: "rejected"
            }
        );

        await refreshAdmin();
        showToast(
            "warning",
            "Note Rejected",
            "The note has been moved to rejected."
        );

    }

    catch (error) {

        showToast(
            "error",
            "Reject Failed",
            "Unable to reject the note."
        );

    }

}



// ======================================
// Search Pending Notes
// ======================================

pendingSearch.addEventListener("input", () => {

    filterPendingNotes();

});



// ======================================
// Branch Filter
// ======================================

branchFilter.addEventListener("change", () => {

    filterPendingNotes();

});



// ======================================
// Year Filter
// ======================================

yearFilter.addEventListener("change", () => {

    filterPendingNotes();

});



// ======================================
// Filter Logic
// ======================================

function filterPendingNotes() {

    const search = pendingSearch.value.toLowerCase();

    const branch = branchFilter.value;

    const year = yearFilter.value;

    const filtered = pendingNotesCache.filter(note => {

        const matchesSearch =

            note.title.toLowerCase().includes(search) ||

            note.subject.toLowerCase().includes(search) ||

            note.uploaderName.toLowerCase().includes(search);

        const matchesBranch =

            branch === "" ||

            note.branch === branch;

        const matchesYear =

            year === "" ||

            note.year === year;

        return (

            matchesSearch &&

            matchesBranch &&

            matchesYear

        );

    });

    renderPendingNotes(filtered);

}
// ======================================
// Approved Notes
// ======================================

let approvedNotesCache = [];

async function loadApprovedNotes() {

    try {

        const approvedQuery = query(
            collection(db, "notes"),
            where("status", "==", "approved"),
            orderBy("uploadedAt", "desc")
        );

        const snapshot = await getDocs(approvedQuery);

        approvedNotesCache = [];

        snapshot.forEach(docSnap => {

            approvedNotesCache.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        renderApprovedNotes(approvedNotesCache);

    }

    catch (error) {

        console.error("Approved Notes Error:", error);

    }

}


function renderApprovedNotes(notes) {

    approvedNotesTable.innerHTML = "";

    if (notes.length === 0) {

        approvedNotesTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center">
                    No Approved Notes
                </td>
            </tr>
        `;

        return;

    }

    notes.forEach(note => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${note.title}</td>

            <td>${note.subject}</td>

            <td>${note.uploaderName}</td>

            <td>${note.downloads || 0}</td>

            <td>${formatDate(note.uploadedAt)}</td>

            <td>
                <div class="action-buttons">
                <button class="table-btn view-btn">
                    View
                </button>

                <button class="table-btn reject-btn">
                    Reject
                </button>
                </div>

            </td>

        `;

        row.querySelector(".view-btn")
            .addEventListener("click", () => {

                openPreview(note.pdfUrl);

            });

        row.querySelector(".reject-btn")
            .addEventListener("click", () => {

                rejectNote(note.id);

            });

        approvedNotesTable.appendChild(row);

    });

}



// ======================================
// Rejected Notes
// ======================================

let rejectedNotesCache = [];

async function loadRejectedNotes() {

    try {

        const rejectedQuery = query(
            collection(db, "notes"),
            where("status", "==", "rejected"),
            orderBy("uploadedAt", "desc")
        );

        const snapshot = await getDocs(rejectedQuery);

        rejectedNotesCache = [];

        snapshot.forEach(docSnap => {

            rejectedNotesCache.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderRejectedNotes(rejectedNotesCache);

    }

    catch (error) {

        console.error(error);

    }

}


function renderRejectedNotes(notes) {

    rejectedNotesTable.innerHTML = "";

    if (notes.length === 0) {

        rejectedNotesTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center">
                    No Rejected Notes
                </td>
            </tr>
        `;

        return;

    }

    notes.forEach(note => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${note.title}</td>

            <td>${note.uploaderName}</td>

            <td>${formatDate(note.uploadedAt)}</td>

            <td>Rejected by Admin</td>

            <td>
                <div class="action-buttons">
                <button class="table-btn approve-btn">
                    Restore
                </button>

                <button class="table-btn delete-btn">
                    Delete
                </button>

                <button class="table-btn view-btn">
                    View
                </button>
                <div>

            </td>

        `;

        row.querySelector(".approve-btn")
            .addEventListener("click", () => {

                approveNote(note.id);

            });

        row.querySelector(".delete-btn")
            .addEventListener("click", () => {

                deleteNote(note.id, note.title);

            });

        row.querySelector(".view-btn")
            .addEventListener("click", () => {

                openPreview(note.pdfUrl);

            });

        rejectedNotesTable.appendChild(row);

    });

}



// ======================================
// Delete Note
// ======================================

function deleteNote(noteId, noteTitle) {

    openDeleteModal(noteId, noteTitle);

}



// ======================================
// Approved Search
// ======================================

approvedSearch.addEventListener("input", () => {

    const search = approvedSearch.value.toLowerCase();

    renderApprovedNotes(

        approvedNotesCache.filter(note =>

            note.title.toLowerCase().includes(search) ||

            note.subject.toLowerCase().includes(search) ||

            note.uploaderName.toLowerCase().includes(search)

        )

    );

});



// ======================================
// Rejected Search
// ======================================

rejectedSearch.addEventListener("input", () => {

    const search = rejectedSearch.value.toLowerCase();

    renderRejectedNotes(

        rejectedNotesCache.filter(note =>

            note.title.toLowerCase().includes(search) ||

            note.uploaderName.toLowerCase().includes(search)

        )

    );

});

// ======================================
// Users
// ======================================

let usersCache = [];

async function loadUsers() {

    try {

        const snapshot = await getDocs(
            collection(db, "users")
        );

        usersCache = [];

        snapshot.forEach(docSnap => {

            usersCache.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderUsers(usersCache);

    }

    catch (error) {

        console.error("Users Error:", error);

    }

}



// ======================================
// Render Users
// ======================================

function renderUsers(users) {

    usersTable.innerHTML = "";

    if (users.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center">
                    No Users Found
                </td>
            </tr>
        `;

        return;

    }

    users.forEach(user => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${user.name || "Unknown"}</td>

            <td>${user.email}</td>

            <td>${user.uploadCount || 0}</td>

            <td>
                ${user.role || "student"}
            </td>

            <td>
                ${formatDate(user.createdAt)}
            </td>

            <td>

                <button class="table-btn view-user-btn">
                    View
                </button>

            </td>

        `;

        row.querySelector(".view-user-btn")
            .addEventListener("click", () => {
                openUserModal(user);
            });

        usersTable.appendChild(row);

    });

}

// ======================================
// CONTACT MESSAGES
// ======================================

let contactMessages = [];

async function loadContactMessages() {

    if (!contactMessagesTable) return;

    try {

        contactMessages = await getContactMessages();

        renderContactMessages(contactMessages);

    } catch (error) {

        console.error("Error loading contact messages:", error);

        contactMessagesTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    Unable to load contact messages.
                </td>
            </tr>
        `;
    }
}


// ======================================
// RENDER CONTACT MESSAGES
// ======================================

function renderContactMessages(messages) {

    contactMessagesTable.innerHTML = "";

    if (!messages.length) {

        contactMessagesTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No contact messages found.
                </td>
            </tr>
        `;

        return;
    }

    messages.forEach(message => {

        const row = document.createElement("tr");

        const senderCell = document.createElement("td");
        senderCell.textContent = message.name || "-";

        const emailCell = document.createElement("td");
        emailCell.textContent = message.email || "-";

        const subjectCell = document.createElement("td");
        subjectCell.textContent = message.subject || "-";

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(message.createdAt);

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");
        statusBadge.className = `badge ${message.status || "unread"}`;
        statusBadge.textContent =
            message.status === "read" ? "Read" : "Unread";

        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement("td");

        const actionWrapper = document.createElement("div");
        actionWrapper.className = "action-buttons";

        const viewButton = document.createElement("button");
        viewButton.className = "view-btn";
        viewButton.innerHTML = `
            <i class="fa-solid fa-eye"></i>
        `;
        viewButton.title = "View message";

        viewButton.addEventListener("click", () => {
            openContactMessage(message.id);
        });

        actionWrapper.appendChild(viewButton);

        actionCell.appendChild(actionWrapper);

        row.appendChild(senderCell);
        row.appendChild(emailCell);
        row.appendChild(subjectCell);
        row.appendChild(dateCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        contactMessagesTable.appendChild(row);

    });
}


// ======================================
// OPEN CONTACT MESSAGE
// ======================================

function openContactMessage(messageId) {

    const message = contactMessages.find(
        item => item.id === messageId
    );

    if (!message) return;

    const modal = document.getElementById("contactMessageModal");

    document.getElementById("contactModalName").textContent =
        message.name || "-";

    document.getElementById("contactModalEmail").textContent =
        message.email || "-";

    document.getElementById("contactModalSubject").textContent =
        message.subject || "-";

    document.getElementById("contactModalDate").textContent =
        formatDate(message.createdAt);

    document.getElementById("contactModalMessage").textContent =
        message.message || "-";

    modal.style.display = "flex";

    // Mark as read when opened
    if (message.status !== "read") {

        markContactMessageAsRead(message.id)
            .then(() => {

                message.status = "read";

                renderContactMessages(
                    getFilteredContactMessages()
                );

            })
            .catch(error => {

                console.error(
                    "Error marking message as read:",
                    error
                );

            });
    }



    const deleteButton =
        document.getElementById("deleteContactBtn");

    if (deleteButton) {

        deleteButton.onclick = () => {
            // Close the contact message modal first
            modal.style.display = "none";
            // Then open the delete confirmation modal
            openContactDeleteModal(message.id);

        };

    }

}


// ======================================
// CLOSE CONTACT MESSAGE MODAL
// ======================================

function closeContactMessageModal() {

    const modal =
        document.getElementById("contactMessageModal");

    if (modal) {
        modal.style.display = "none";
    }
}

document
    .getElementById("closeContactMessageModal")
    ?.addEventListener(
        "click",
        closeContactMessageModal
    );

document
    .getElementById("closeContactMessageBtn")
    ?.addEventListener(
        "click",
        closeContactMessageModal
    );

// ======================================
// CONTACT MESSAGE DELETE
// ======================================

function openContactDeleteModal(messageId) {

    const message = contactMessages.find(
        item => item.id === messageId
    );

    if (!message) return;

    contactMessageToDelete = messageId;

    document.getElementById("deleteMessage").textContent =
        `Are you sure you want to permanently delete the message from "${message.name || "this user"}"? This action cannot be undone.`;

    deleteModal.querySelector("h3").textContent =
        "Delete Contact Message";

    deleteModal.querySelector("h2").textContent =
        "Delete this message?";

    deleteModal.classList.add("show");

}


// ======================================
// SEARCH + FILTER
// ======================================

function getFilteredContactMessages() {

    const searchInput =
        document.getElementById("contactSearch");

    const statusFilter =
        document.getElementById("contactStatusFilter");

    const search =
        searchInput?.value
            .trim()
            .toLowerCase() || "";

    const status =
        statusFilter?.value || "";

    return contactMessages.filter(message => {

        const matchesSearch =
            !search ||
            (message.name || "").toLowerCase().includes(search) ||
            (message.email || "").toLowerCase().includes(search) ||
            (message.subject || "").toLowerCase().includes(search) ||
            (message.message || "").toLowerCase().includes(search);

        const matchesStatus =
            !status ||
            message.status === status;

        return matchesSearch && matchesStatus;

    });
}


document
    .getElementById("contactSearch")
    ?.addEventListener("input", () => {

        renderContactMessages(
            getFilteredContactMessages()
        );

    });


document
    .getElementById("contactStatusFilter")
    ?.addEventListener("change", () => {

        renderContactMessages(
            getFilteredContactMessages()
        );

    });

// ======================================
// Current Admin Profile
// ======================================

export function getCurrentAdmin() {

    return new Promise((resolve) => {

        const unsubscribe = onAuthStateChanged(auth, async (user) => {

            unsubscribe();

            if (!user) {
                resolve(null);
                return;
            }

            try {

                const userRef = doc(db, "users", user.uid);

                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {

                    resolve({
                        uid: user.uid,
                        name: user.displayName || "User",
                        email: user.email || "",
                        role: "student",
                        photoURL: user.photoURL || ""
                    });

                    return;
                }

                const userData = userSnap.data();

                resolve({

                    uid: user.uid,

                    name:
                        userData.name ||
                        user.displayName ||
                        "User",

                    email:
                        userData.email ||
                        user.email ||
                        "",

                    role:
                        userData.role ||
                        "student",

                    photoURL:
                        userData.profileImage ||
                        user.photoURL ||
                        ""

                });

            } catch (error) {

                console.error(
                    "Error loading current admin:",
                    error
                );

                resolve(null);

            }

        });

    });

}


// ======================================
// User Search
// ======================================

userSearch.addEventListener("input", () => {

    const search = userSearch.value.toLowerCase();

    renderUsers(

        usersCache.filter(user =>

            (user.name || "")
                .toLowerCase()
                .includes(search)

            ||

            (user.email || "")
                .toLowerCase()
                .includes(search)

        )

    );

});



// ======================================
// Settings
// ======================================

async function loadSettings() {

    // Placeholder

    websiteName.value = "EngiNotes";

    uploadLimit.value = 20;

    allowRegistrations.checked = true;

    allowUploads.checked = true;

}



// ======================================
// Save Settings
// ======================================

saveSettingsBtn.addEventListener("click", () => {

    showToast(
        "info",
        "Settings",
        "Settings feature will be connected later."
    );
});



// ======================================
// Logout
// ======================================

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "/main/login.html";

    }

    catch (error) {

        console.error(error);

    }

});



// ======================================
// Initialize
// ======================================

async function initAdmin() {

    await refreshAdmin();

    await loadSettings();

}

document.addEventListener(

    "DOMContentLoaded",

    initAdmin

);

// ======================================
// CONTACT MESSAGES
// ======================================

export async function getContactMessages() {

    try {

        const messagesQuery = query(
            collection(db, "contactMessages"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(messagesQuery);

        const messages = [];

        snapshot.forEach(docSnap => {

            messages.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        return messages;

    }

    catch (error) {

        console.error(
            "Error loading contact messages:",
            error
        );

        throw error;

    }

}


// ======================================
// MARK CONTACT MESSAGE AS READ
// ======================================

export async function markContactMessageAsRead(messageId) {

    try {

        await updateDoc(
            doc(db, "contactMessages", messageId),
            {
                status: "read"
            }
        );

    }

    catch (error) {

        console.error(
            "Error marking contact message as read:",
            error
        );

        throw error;

    }

}


// ======================================
// DELETE CONTACT MESSAGE
// ======================================

export async function deleteContactMessage(messageId) {

    try {

        await deleteDoc(
            doc(db, "contactMessages", messageId)
        );

    }

    catch (error) {

        console.error(
            "Error deleting contact message:",
            error
        );

        throw error;

    }

}