import { db, auth } from "../../js/firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// =============================================
// CLOUDINARY
// =============================================

const CLOUD_NAME = "p7mrldyo";
const PROFILE_UPLOAD_PRESET = "enginotes_profile_uploads";


// =============================================
// DOM
// =============================================

const profileForm =
    document.getElementById("profileForm");

const nameInput =
    document.getElementById("profileNameInput");

const collegeInput =
    document.getElementById("profileCollegeInput");

const branchInput =
    document.getElementById("profileBranchInput");

const yearInput =
    document.getElementById("profileYearInput");

const bioInput =
    document.getElementById("profileBioInput");

const bioCount =
    document.getElementById("bioCount");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const formMessage =
    document.getElementById("formMessage");

const profilePictureInput =
    document.getElementById("profilePictureInput");

const profilePicturePreview =
    document.getElementById("profilePicturePreview");


// =============================================
// GLOBAL
// =============================================

let currentUser = null;

let existingProfileImage = "";


// =============================================
// AUTH
// =============================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "/main/login.html";

            return;

        }

        currentUser = user;

        await loadProfile();

    }
);


// =============================================
// LOAD PROFILE
// =============================================

async function loadProfile() {

    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            formMessage.textContent =
                "Profile not found.";

            formMessage.className =
                "form-message error";

            return;

        }

        const data =
            userSnap.data();


        // -----------------------------
        // Text fields
        // -----------------------------

        nameInput.value =
            data.name || "";

        collegeInput.value =
            data.college || "";

        branchInput.value =
            data.branch || "";

        yearInput.value =
            data.year || "";

        bioInput.value =
            data.bio || "";


        // -----------------------------
        // Existing profile picture
        // -----------------------------

        existingProfileImage =
            data.profileImage || "";


        if (existingProfileImage) {

            profilePicturePreview.innerHTML = `
                <img
                    src="${existingProfileImage}"
                    alt="Profile Picture">
            `;

        }
        else {

            profilePicturePreview.textContent =
                (data.name || "U")
                    .charAt(0)
                    .toUpperCase();

        }


        updateBioCount();

    }

    catch (error) {

        console.error(
            "Error loading profile:",
            error
        );

        formMessage.textContent =
            "Unable to load your profile.";

        formMessage.className =
            "form-message error";

    }

}


// =============================================
// BIO CHARACTER COUNT
// =============================================

function updateBioCount() {

    bioCount.textContent =
        bioInput.value.length;

}

bioInput.addEventListener(
    "input",
    updateBioCount
);


// =============================================
// PROFILE IMAGE PREVIEW
// =============================================

profilePictureInput.addEventListener(
    "change",
    () => {

        const file =
            profilePictureInput.files[0];

        if (!file) {

            return;

        }


        // Check type

        if (!file.type.startsWith("image/")) {

            alert(
                "Please select a valid image."
            );

            profilePictureInput.value = "";

            return;

        }


        // Check size - 5MB

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "Profile picture must be smaller than 5MB."
            );

            profilePictureInput.value = "";

            return;

        }


        const imageUrl =
            URL.createObjectURL(file);


        profilePicturePreview.innerHTML = `
            <img
                src="${imageUrl}"
                alt="Profile Preview">
        `;

    }
);


// =============================================
// CLOUDINARY PROFILE IMAGE UPLOAD
// =============================================

async function uploadProfilePicture(file) {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );

    formData.append(
        "upload_preset",
        PROFILE_UPLOAD_PRESET
    );



    const response =
        await fetch(

            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

            {
                method: "POST",
                body: formData
            }

        );


    if (!response.ok) {

        throw new Error(
            "Profile picture upload failed."
        );

    }


    const data =
        await response.json();


    return {

        imageUrl:
            data.secure_url,

        publicId:
            data.public_id

    };

}


// =============================================
// SAVE PROFILE
// =============================================

profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            return;

        }


        const name =
            nameInput.value.trim();

        const college =
            collegeInput.value.trim();

        const branch =
            branchInput.value;

        const year =
            yearInput.value;

        const bio =
            bioInput.value.trim();


        // -----------------------------
        // Validation
        // -----------------------------

        if (!name) {

            formMessage.textContent =
                "Please enter your name.";

            formMessage.className =
                "form-message error";

            return;

        }

        if (!college) {

            formMessage.textContent =
                "Please enter your college or university.";

            formMessage.className =
                "form-message error";

            return;

        }


        saveProfileBtn.disabled = true;

        saveProfileBtn.textContent =
            "Saving...";


        try {

            let profileImage =
                existingProfileImage;

            let profileImagePublicId =
                null;


            // -----------------------------
            // Upload new picture if selected
            // -----------------------------

            if (
                profilePictureInput.files.length > 0
            ) {

                formMessage.textContent =
                    "Uploading profile picture...";

                formMessage.className =
                    "form-message";


                const file =
                    profilePictureInput.files[0];


                const uploadResult =
                    await uploadProfilePicture(file);


                profileImage =
                    uploadResult.imageUrl;

                profileImagePublicId =
                    uploadResult.publicId;

            }


            // -----------------------------
            // Update Firestore
            // -----------------------------

            const userRef =
                doc(
                    db,
                    "users",
                    currentUser.uid
                );


            const updateData = {

                name: name,
                
                college: college,

                branch: branch,

                year: year,

                bio: bio

            };


            // Only add image fields
            // when a new image was uploaded

            if (
                profilePictureInput.files.length > 0
            ) {

                updateData.profileImage =
                    profileImage;

                updateData.profileImagePublicId =
                    profileImagePublicId;

            }


            await updateDoc(
                userRef,
                updateData
            );


            // -----------------------------
            // Success
            // -----------------------------

            formMessage.textContent =
                "Profile updated successfully!";

            formMessage.className =
                "form-message success";


            saveProfileBtn.textContent =
                "Saved ✓";


            setTimeout(
                () => {

                    window.location.href =
                        `/main/Users/user_profile.html?uid=${currentUser.uid}`;

                },
                1000
            );

        }

        catch (error) {

            console.error(
                "Profile update error:",
                error
            );


            formMessage.textContent =
                "Unable to update profile. Please try again.";

            formMessage.className =
                "form-message error";


            saveProfileBtn.disabled =
                false;

            saveProfileBtn.textContent =
                "Save Changes";

        }

    }
);