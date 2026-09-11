import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================================================
// Cloudinary Configuration
// =======================================================

const CLOUD_NAME = "p7mrldyo";
const UPLOAD_PRESET = "enginotes_uploads";

const ACCEPTED_FILE_TYPE = "application/pdf";

// =======================================================
// Initialize Icons
// =======================================================

lucide.createIcons();

// =======================================================
// DOM Elements
// =======================================================

const uploadForm = document.getElementById("uploadForm");

const uploadBtn = document.getElementById("uploadBtn");
const uploadBtnText = document.getElementById("uploadBtnText");

const dropZone = document.getElementById("dropZone");

const fileInput = document.getElementById("fileInput");

const fileBadge = document.getElementById("fileBadge");

const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const removeFileBtn =
    document.querySelector(".remove-file-btn");

// Loading Overlay

const loadingOverlay =
    document.getElementById("uploadLoadingOverlay");

const loadingTitle =
    document.getElementById("loadingTitle");

const loadingMessage =
    document.getElementById("loadingMessage");

// Success Modal

const successModal =
    document.getElementById("successModal");

const successCloseBtn =
    document.getElementById("successCloseBtn");

const uploadAnotherBtn =
    document.getElementById("uploadAnotherBtn");

const browseNotesBtn =
    document.getElementById("browseNotesBtn");

// Error Modal

const errorModal =
    document.getElementById("errorModal");

const errorCloseBtn =
    document.getElementById("errorCloseBtn");

const retryUploadBtn =
    document.getElementById("retryUploadBtn");

const cancelUploadBtn =
    document.getElementById("cancelUploadBtn");

// =======================================================
// Initialization
// =======================================================

document.addEventListener("DOMContentLoaded", init);

function init() {

    bindEvents();
    setupDragAndDrop();

}

// =======================================================
// Event Listeners
// =======================================================

function bindEvents() {

    uploadForm.addEventListener(
        "submit",
        handleFormSubmit
    );

    dropZone.addEventListener(
        "click",
        handleDropZoneClick
    );

    fileInput.addEventListener(
        "change",
        handleFileSelect
    );

    removeFileBtn.addEventListener(
        "click",
        removeFile
    );

    successCloseBtn.addEventListener(
        "click",
        hideSuccessModal
    );

    uploadAnotherBtn.addEventListener(
        "click",
        uploadAnother
    );

    browseNotesBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "/main/browse.html";

        }
    );

    errorCloseBtn.addEventListener(
        "click",
        hideErrorModal
    );

    cancelUploadBtn.addEventListener(
        "click",
        hideErrorModal
    );

    retryUploadBtn.addEventListener(
        "click",
        hideErrorModal
    );

}

// =======================================================
// Drag & Drop
// =======================================================

function setupDragAndDrop() {

    ["dragenter", "dragover"].forEach(eventName => {

        dropZone.addEventListener(
            eventName,
            (event) => {

                event.preventDefault();

                dropZone.classList.add(
                    "drag-over"
                );

            }
        );

    });


    ["dragleave", "drop"].forEach(eventName => {

        dropZone.addEventListener(
            eventName,
            (event) => {

                event.preventDefault();

                dropZone.classList.remove(
                    "drag-over"
                );

            }
        );

    });


    dropZone.addEventListener(
        "drop",
        (event) => {

            const files =
                event.dataTransfer.files;

            if (!files.length) return;

            fileInput.files = files;

            handleFileSelect({
                target: fileInput
            });

        }
    );

}

// =======================================================
// File Handling
// =======================================================

function handleDropZoneClick(event) {

    if (
        event.target.closest(
            ".remove-file-btn"
        )
    ) {

        return;

    }

    fileInput.click();

}


function handleFileSelect(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    if (
        file.type !== ACCEPTED_FILE_TYPE
    ) {

        showErrorModal(
            "Please select a valid PDF file."
        );

        removeFile();

        return;

    }

    updateFileBadge(file);

}


function updateFileBadge(file) {

    fileName.textContent =
        file.name;

    fileSize.textContent =
        formatFileSize(file.size);

    fileBadge.classList.add(
        "active"
    );

}


function removeFile(event) {

    if (event) {

        event.stopPropagation();

    }

    fileInput.value = "";

    fileBadge.classList.remove(
        "active"
    );

}

// =======================================================
// Loading State
// =======================================================

function showLoading(
    title,
    message
) {

    loadingTitle.textContent =
        title;

    loadingMessage.textContent =
        message;

    loadingOverlay.classList.add(
        "show"
    );

    uploadBtn.disabled = true;

    uploadBtn.classList.add(
        "loading"
    );

    uploadBtnText.textContent =
        "Uploading...";

    uploadForm.classList.add(
        "form-disabled"
    );

}


function hideLoading() {

    loadingOverlay.classList.remove(
        "show"
    );

    uploadBtn.disabled = false;

    uploadBtn.classList.remove(
        "loading"
    );

    uploadBtnText.textContent =
        "Upload Note";

    uploadForm.classList.remove(
        "form-disabled"
    );

}

// =======================================================
// Success Modal
// =======================================================

function showSuccessModal() {

    successModal.classList.add(
        "show"
    );

}


function hideSuccessModal() {

    successModal.classList.remove(
        "show"
    );

}


function uploadAnother() {

    hideSuccessModal();

    uploadForm.reset();

    removeFile();

    document
        .getElementById("title")
        .focus();

}

// =======================================================
// Error Modal
// =======================================================

function showErrorModal(message) {

    document.getElementById(
        "errorMessage"
    ).textContent = message;

    errorModal.classList.add(
        "show"
    );

}


function hideErrorModal() {

    errorModal.classList.remove(
        "show"
    );

}

// =======================================================
// Utility
// =======================================================

function formatFileSize(bytes) {

    return (
        bytes /
        (1024 * 1024)
    ).toFixed(2) + " MB";

}

// =======================================================
// FORM SUBMISSION
// =======================================================

async function handleFormSubmit(event) {

    event.preventDefault();


    // ===================================================
    // CHECK AUTHENTICATION
    // ===================================================

    const user =
        auth.currentUser;

    if (!user) {

        showErrorModal(
            "You must be logged in to upload notes."
        );

        return;

    }


    if (!fileInput.files.length) {

        showErrorModal(
            "Please attach a PDF before submitting."
        );

        return;

    }


    const file =
        fileInput.files[0];


    const title =
        document.getElementById("title")
            .value.trim();


    const description =
        document.getElementById("description")
            .value.trim();

    const college =
        document.getElementById("college")
            .value.trim();


    const branch =
        document.getElementById("branch")
            .value;


    const year =
        document.getElementById("year")
            .value;


    const semester =
        document.getElementById("semester")
            .value;


    const subject =
        document.getElementById("subject")
            .value.trim();


    try {

        showLoading(

            "Uploading PDF...",

            "Please wait while we upload your file securely."

        );


        // ===================================================
        // GET USER NAME FROM FIRESTORE
        // ===================================================

        loadingTitle.textContent =
            "Loading Profile...";

        loadingMessage.textContent =
            "Getting your profile information.";


        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnap =
            await getDoc(
                userRef
            );


        let uploaderName =
            "Anonymous";


        if (
            userSnap.exists()
        ) {

            const userData =
                userSnap.data();


            uploaderName =
                userData.name ||
                userData.displayName ||
                "Anonymous";

        }


        // ===================================================
        // UPLOAD PDF TO CLOUDINARY
        // ===================================================

        loadingTitle.textContent =
            "Uploading PDF...";

        loadingMessage.textContent =
            "Please wait while we upload your file securely.";


        const cloudinaryResult =
            await uploadPDFToCloudinary(
                file
            );


        // ===================================================
        // SAVE NOTE TO FIRESTORE
        // ===================================================

        loadingTitle.textContent =
            "Saving Note...";

        loadingMessage.textContent =
            "Creating your note entry.";


        await addDoc(

            collection(
                db,
                "notes"
            ),

            {

                title,

                description,

                college,

                branch,

                year,

                semester,

                subject,

                pdfUrl:
                    cloudinaryResult.pdfUrl,

                publicId:
                    cloudinaryResult.publicId,

                uploaderId:
                    user.uid,

                uploaderName:
                    uploaderName,

                uploaderEmail:
                    user.email || "",

                uploadedAt:
                    serverTimestamp(),

                status:
                    "pending",

                downloads:
                    0,

                likes:
                    0,

                views:
                    0

            }

        );


        hideLoading();

        showSuccessModal();

    }

    catch (error) {

        console.error(
            "Upload Error:",
            error
        );

        hideLoading();

        showErrorModal(

            "Failed to upload your note. Please try again."

        );

    }

}

// =======================================================
// Cloudinary Upload
// =======================================================

async function uploadPDFToCloudinary(file) {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );


    try {

        const response =
            await fetch(

                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,

                {

                    method: "POST",

                    body: formData

                }

            );


        if (!response.ok) {

            throw new Error(
                "Cloudinary upload failed."
            );

        }


        const data =
            await response.json();


        return {

            pdfUrl:
                data.secure_url,

            publicId:
                data.public_id

        };

    }

    catch (error) {

        console.error(
            error
        );

        throw error;

    }

}

// =======================================================
// Close Modals using ESC
// =======================================================

document.addEventListener(

    "keydown",

    (event) => {

        if (
            event.key !== "Escape"
        ) return;

        hideSuccessModal();

        hideErrorModal();

    }

);

// =======================================================
// Close Modal by Clicking Outside
// =======================================================

successModal.addEventListener(

    "click",

    (event) => {

        if (
            event.target ===
            successModal
        ) {

            hideSuccessModal();

        }

    }

);


errorModal.addEventListener(

    "click",

    (event) => {

        if (
            event.target ===
            errorModal
        ) {

            hideErrorModal();

        }

    }

);

// =======================================================
// Refresh Lucide Icons
// =======================================================

lucide.createIcons();