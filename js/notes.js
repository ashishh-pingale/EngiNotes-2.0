import { db, auth } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    increment,
    updateDoc,
    doc,
    addDoc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ======================================================
// Auth
// ======================================================

let currentUser = null;
let currentPreviewNote = null;
let hasLikedCurrentNote = false;
let currentUserName = "A user";


// ======================================================
// Notification Note ID
// ======================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const notificationNoteId =
    urlParams.get("note");


// ======================================================
// DOM Elements
// ======================================================

const notesContainer =
    document.getElementById("notesContainer");

const branchFilter =
    document.getElementById("branchFilter");

const yearFilter =
    document.getElementById("yearFilter");

const filterBtn =
    document.getElementById("filterBtn");

const notePreviewModal =
    document.getElementById("notePreviewModal");

const previewFrame =
    document.getElementById("previewFrame");

const previewTitle =
    document.getElementById("previewTitle");

const previewSubject =
    document.getElementById("previewSubject");

const previewSubject2 =
    document.getElementById("previewSubject2");

const previewUploader =
    document.getElementById("previewUploader");

const previewDate =
    document.getElementById("previewDate");

const previewViews =
    document.getElementById("previewViews");

const previewLikes =
    document.getElementById("previewLikes");

const previewBranch =
    document.getElementById("previewBranch");

const previewSemester =
    document.getElementById("previewSemester");

const previewCollege =
    document.getElementById("previewCollege");

const previewDescription =
    document.getElementById("previewDescription");

const closePreviewBtn =
    document.getElementById("closePreview");

const previewDownloads =
    document.getElementById("previewDownloads");

const downloadBtn =
    document.getElementById("downloadBtn");

const likeBtn =
    document.getElementById("likeBtn");

const searchInput =
    document.getElementById("searchInput");


// ======================================================
// FETCH NOTES
// ======================================================

async function fetchNotes() {

    console.log(
        "fetchNotes started"
    );

    try {

        notesContainer.innerHTML = "";

        const selectedBranch =
            branchFilter.value;

        const selectedYear =
            yearFilter.value;

        const searchText =
            searchInput.value
                .trim()
                .toLowerCase();


        // Only fetch APPROVED notes

        const notesQuery =
            query(
                collection(
                    db,
                    "notes"
                ),
                where(
                    "status",
                    "==",
                    "approved"
                )
            );


        const snapshot =
            await getDocs(
                notesQuery
            );


        let notesFound = false;


        snapshot.forEach(
            (docSnap) => {

                const note = {

                    id:
                        docSnap.id,

                    ...docSnap.data()

                };


                const matchesBranch =
                    selectedBranch === "" ||
                    note.branch === selectedBranch;


                const matchesYear =
                    selectedYear === "" ||
                    note.year === selectedYear;


                const matchesSearch =

                    searchText === "" ||

                    note.title
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||

                    note.subject
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||

                    note.uploaderName
                        ?.toLowerCase()
                        .includes(
                            searchText
                        );


                if (
                    matchesBranch &&
                    matchesYear &&
                    matchesSearch
                ) {

                    notesFound = true;


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.classList.add(
                        "note-card"
                    );


                    if (note.branch) {

                        card.classList.add(
                            note.branch.toLowerCase()
                        );

                    }


                    card.innerHTML = `

                        <span class="branch-badge">
                            ${note.branch ||
                        "General"
                        }
                        </span>


                        <h3>
                            ${note.title ||
                        "Untitled Note"
                        }
                        </h3>


                        <p class="subject-code">

                            ${note.subject ||
                        "Unknown Subject"
                        }

                            •
                            ${getYearText(
                            note.year
                        )
                        }

                            • Semester
                            ${note.semester ||
                        "-"
                        }

                        </p>


                        <div class="user-info">

                            <div class="avatar">

                                ${(
                            note.uploaderName ||
                            "U"
                        )
                            .charAt(0)
                            .toUpperCase()
                        }

                            </div>


                            <span>

                                Uploaded by

                                <strong>
                                    ${note.uploaderName ||
                        "Unknown"
                        }
                                </strong>

                            </span>

                        </div>


                        <div class="card-footer">

                            <button
                                class="btn-download-small"
                            >
                                Open PDF
                            </button>

                        </div>

                    `;


                    const openPdfBtn =
                        card.querySelector(
                            ".btn-download-small"
                        );


                    // ==========================================
                    // OPEN PREVIEW
                    // ==========================================
                    // Preview is PUBLIC.
                    // Logged-out users can open it too.

                    openPdfBtn.addEventListener(
                        "click",
                        async () => {

                            await openPreview(
                                note
                            );

                        }
                    );


                    notesContainer.appendChild(
                        card
                    );

                }

            }
        );


        if (!notesFound) {

            notesContainer.innerHTML = `

                <div class="no-notes">

                    <h2>
                        No Notes Found 📚
                    </h2>

                    <p>
                        There are no approved notes
                        matching your filters.
                    </p>

                </div>

            `;

        }

    }

    catch (error) {

        console.error(
            "Error fetching notes:",
            error
        );


        notesContainer.innerHTML = `

            <div class="no-notes">

                <h2>
                    Something went wrong
                </h2>

                <p>
                    Please refresh the page.
                </p>

            </div>

        `;

    }

}


// ======================================================
// OPEN NOTE FROM NOTIFICATION
// ======================================================

async function openNoteFromNotification() {

    if (!notificationNoteId) {

        return;

    }


    console.log(
        "Opening notification note:",
        notificationNoteId
    );


    try {

        const noteRef =
            doc(
                db,
                "notes",
                notificationNoteId
            );


        const noteSnap =
            await getDoc(
                noteRef
            );


        if (!noteSnap.exists()) {

            console.error(
                "Notification note not found:",
                notificationNoteId
            );

            return;

        }


        const note = {

            id:
                noteSnap.id,

            ...noteSnap.data()

        };


        console.log(
            "Notification note found:",
            note
        );


        await openPreview(
            note
        );

    }

    catch (error) {

        console.error(
            "Failed to open notification note:",
            error
        );

    }

}


// ======================================================
// PREVIEW FUNCTIONS
// ======================================================

async function checkIfLiked(
    noteId
) {

    // Logged-out users cannot have a personal like state

    if (!currentUser) {

        hasLikedCurrentNote = false;

        likeBtn.innerHTML =
            `🤍 Like`;

        return;

    }


    const likeRef =
        doc(
            db,
            "noteLikes",
            `${noteId}_${currentUser.uid}`
        );


    const likeSnap =
        await getDoc(
            likeRef
        );


    hasLikedCurrentNote =
        likeSnap.exists();


    likeBtn.innerHTML =
        hasLikedCurrentNote
            ? "❤️ Liked"
            : "🤍 Like";

}


// ======================================================
// OPEN PREVIEW
// ======================================================

async function openPreview(
    note
) {

    currentPreviewNote =
        note;


    try {

        await updateDoc(

            doc(
                db,
                "notes",
                note.id
            ),

            {
                views:
                    increment(1)
            }

        );


        note.views =
            (note.views || 0) + 1;

    }

    catch (err) {

        console.error(
            "Failed to update views:",
            err
        );

    }


    previewTitle.textContent =
        note.title || "Untitled Note";


    previewSubject.textContent =
        note.subject || "Unknown Subject";


    previewSubject2.textContent =
        note.subject || "Unknown Subject";


    previewViews.textContent =
        note.views || 0;


    previewDownloads.textContent =
        note.downloads || 0;


    previewLikes.textContent =
        note.likes || 0;


    previewUploader.textContent =
        note.uploaderName || "Unknown";


    if (
        note.uploadedAt?.toDate
    ) {

        previewDate.textContent =
            note.uploadedAt
                .toDate()
                .toLocaleDateString();

    }

    else {

        previewDate.textContent =
            "-";

    }


    previewBranch.textContent =
        note.branch || "-";


    previewSemester.textContent =
        note.semester || "-";

    previewCollege.textContent =
        note.college || "-";


    previewDescription.textContent =
        note.description || "No description available.";


    previewFrame.src =
        note.pdfUrl;


    notePreviewModal.classList.add(
        "show"
    );


    await checkIfLiked(
        note.id
    );

}


// ======================================================
// CLOSE PREVIEW
// ======================================================

function closePreview() {

    notePreviewModal.classList.remove(
        "show"
    );


    previewFrame.src =
        "";

}


closePreviewBtn.addEventListener(
    "click",
    closePreview
);


notePreviewModal.addEventListener(
    "click",
    (e) => {

        if (
            e.target ===
            notePreviewModal
        ) {

            closePreview();

        }

    }
);


// ======================================================
// DOWNLOAD
// ======================================================

downloadBtn.addEventListener(
    "click",
    async () => {

        // DOWNLOAD REMAINS LOGIN-ONLY

        if (!currentUser) {

            window.location.href =
                "login.html";

            return;

        }


        if (!currentPreviewNote) {

            return;

        }


        try {

            await updateDoc(

                doc(
                    db,
                    "notes",
                    currentPreviewNote.id
                ),

                {
                    downloads:
                        increment(1)
                }

            );


            currentPreviewNote.downloads =
                (
                    currentPreviewNote.downloads ||
                    0
                ) + 1;


            previewDownloads.textContent =
                currentPreviewNote.downloads;

        }

        catch (err) {

            console.error(
                err
            );

        }


        window.open(
            currentPreviewNote.pdfUrl,
            "_blank",
            "noopener,noreferrer"
        );

    }
);


// ======================================================
// LIKE
// ======================================================

likeBtn.addEventListener(
    "click",
    async () => {

        // LIKE REMAINS LOGIN-ONLY

        if (!currentUser) {

            window.location.href =
                "login.html";

            return;

        }


        if (!currentPreviewNote) {

            return;

        }


        const likeRef =
            doc(
                db,
                "noteLikes",
                `${currentPreviewNote.id}_${currentUser.uid}`
            );


        try {

            // ==============================
            // UNLIKE
            // ==============================

            if (
                hasLikedCurrentNote
            ) {

                await deleteDoc(
                    likeRef
                );


                await updateDoc(

                    doc(
                        db,
                        "notes",
                        currentPreviewNote.id
                    ),

                    {
                        likes:
                            increment(-1)
                    }

                );


                hasLikedCurrentNote =
                    false;


                currentPreviewNote.likes =
                    Math.max(
                        0,
                        (
                            currentPreviewNote.likes ||
                            0
                        ) - 1
                    );

            }


            // ==============================
            // LIKE
            // ==============================

            else {

                await setDoc(

                    likeRef,

                    {

                        noteId:
                            currentPreviewNote.id,

                        userId:
                            currentUser.uid,

                        likedAt:
                            serverTimestamp()

                    }

                );


                await updateDoc(

                    doc(
                        db,
                        "notes",
                        currentPreviewNote.id
                    ),

                    {
                        likes:
                            increment(1)
                    }

                );


                // ==============================
                // CREATE LIKE NOTIFICATION
                // ==============================

                if (
                    currentPreviewNote.uploaderId &&
                    currentPreviewNote.uploaderId !==
                    currentUser.uid
                ) {

                    try {

                        await addDoc(

                            collection(
                                db,
                                "notifications"
                            ),

                            {

                                recipientId:
                                    currentPreviewNote.uploaderId,

                                senderId:
                                    currentUser.uid,

                                type:
                                    "like",

                                message:
                                    `${currentUserName} liked your note.`,

                                relatedId:
                                    currentPreviewNote.id,

                                read:
                                    false,

                                createdAt:
                                    serverTimestamp()

                            }

                        );


                        console.log(
                            "LIKE NOTIFICATION CREATED"
                        );

                    }

                    catch (error) {

                        console.error(
                            "LIKE NOTIFICATION ERROR:",
                            error.code,
                            error.message
                        );

                    }

                }


                hasLikedCurrentNote =
                    true;


                currentPreviewNote.likes =
                    (
                        currentPreviewNote.likes ||
                        0
                    ) + 1;

            }


            previewLikes.textContent =
                currentPreviewNote.likes;


            likeBtn.innerHTML =
                hasLikedCurrentNote
                    ? "❤️ Liked"
                    : "🤍 Like";

        }

        catch (err) {

            console.error(
                "Like Error:",
                err
            );

        }

    }
);


// ======================================================
// UTILITY
// ======================================================

function getYearText(
    year
) {

    switch (
    String(year)
    ) {

        case "1":
            return "1st Year";

        case "2":
            return "2nd Year";

        case "3":
            return "3rd Year";

        case "4":
            return "4th Year";

        default:
            return "Year";

    }

}


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser =
            user;


        // ==========================================
        // LOAD CURRENT USER DATA
        // ==========================================
        // Only logged-in users have a user document.

        if (user) {

            try {

                const userSnap =
                    await getDoc(

                        doc(
                            db,
                            "users",
                            user.uid
                        )

                    );


                if (
                    userSnap.exists()
                ) {

                    currentUserName =
                        userSnap.data().name ||
                        "A user";

                }

            }

            catch (error) {

                console.error(
                    "Failed to load current user:",
                    error
                );

            }

        }


        // ==========================================
        // LOAD NOTES
        // ==========================================
        // IMPORTANT:
        // This runs for BOTH logged-in and logged-out users.

        await fetchNotes();


        // ==========================================
        // OPEN NOTE FROM NOTIFICATION
        // ==========================================

        if (
            notificationNoteId
        ) {

            await openNoteFromNotification();

        }

    }
);


// ======================================================
// EVENTS
// ======================================================

// Search and filters

searchInput.addEventListener(
    "input",
    fetchNotes
);


branchFilter.addEventListener(
    "change",
    fetchNotes
);


yearFilter.addEventListener(
    "change",
    fetchNotes
);

// filterBtn.addEventListener(
//     "click",
//     fetchNotes
// );