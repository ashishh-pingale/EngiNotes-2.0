/* ===========================================================
   EngiNotes - User Profile
   =========================================================== */

import { auth, db } from "../../js/firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    onSnapshot,
    addDoc,
    deleteDoc,
    serverTimestamp
}
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
}
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* ===========================================================
   DOM ELEMENTS
   =========================================================== */

const backBtn =
    document.getElementById("backBtn");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileName =
    document.getElementById("profileName");

const aboutCollege =
    document.getElementById("aboutCollege");

const profileBranch =
    document.getElementById("profileBranch");

const profileYear =
    document.getElementById("profileYear");

const aboutBranch =
    document.getElementById("aboutBranch");

const aboutYear =
    document.getElementById("aboutYear");

const profileJoined =
    document.getElementById("profileJoined");

const profileBio =
    document.getElementById("profileBio");

const connectBtn =
    document.getElementById("connectBtn");

const messageBtn =
    document.getElementById("messageBtn");

const uploadsCount =
    document.getElementById("uploadsCount");

const likesCount =
    document.getElementById("likesCount");

const viewsCount =
    document.getElementById("viewsCount");

const downloadsCount =
    document.getElementById("downloadsCount");


/* ===========================================================
   FOLLOWERS / FOLLOWING
   =========================================================== */

const followersBtn =
    document.getElementById("followersBtn");

const followingBtn =
    document.getElementById("followingBtn");

const followingCount =
    document.getElementById("followingCount");

const socialModal =
    document.getElementById("socialModal");

const socialModalTitle =
    document.getElementById("socialModalTitle");

const socialUserList =
    document.getElementById("socialUserList");

const socialModalClose =
    document.getElementById("socialModalClose");

const socialModalBackdrop =
    document.getElementById("socialModalBackdrop");


const recentUploads =
    document.getElementById("recentUploads");

const editProfileBtn =
    document.getElementById("editProfileBtn");


/* ===========================================================
   GLOBAL VARIABLES
   =========================================================== */

let currentUser = null;

let profileUserId = null;

let profileUser = null;

let userNotes = [];


/* ===========================================================
   GET PROFILE USER ID
   =========================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );

profileUserId =
    params.get("uid");


if (!profileUserId) {

    alert("Invalid Profile");

    window.location.href =
        "/main/index.html";

}


/* ===========================================================
   AUTH
   =========================================================== */

onAuthStateChanged(

    auth,

    async (user) => {

        if (!user) {

            window.location.href =
                "/main/login.html";

            return;

        }

        currentUser =
            user;

        await initializeProfile();

    }

);


/* ===========================================================
   INITIALIZATION
   =========================================================== */

async function initializeProfile() {

    await loadUserProfile();

    await loadUserStatistics();

    preventSelfFollow();

    listenSocialCounts();

    checkFollowStatus();

}


/* ===========================================================
   BACK BUTTON
   =========================================================== */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            if (
                document.referrer &&
                document.referrer !==
                window.location.href
            ) {

                window.history.back();

            }

            else {

                window.location.href =
                    "/main/discover.html";

            }

        }
    );

}


/* ===========================================================
   LOAD USER PROFILE
   =========================================================== */

async function loadUserProfile() {

    try {

        const userRef =
            doc(
                db,
                "users",
                profileUserId
            );

        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            profileName.textContent =
                "User Not Found";

            return;

        }


        profileUser =
            userSnap.data();


        profileName.textContent =
            profileUser.name ||
            "Anonymous";


        profileBranch.textContent =
            profileUser.branch ||
            "-";


        profileYear.textContent =
            profileUser.year ||
            "-";

        aboutCollege.textContent =
            profileUser.college ||
            "-";

        aboutBranch.textContent =
            profileUser.branch || "-";

        aboutYear.textContent =
            profileUser.year || "-";


        profileBio.textContent =
            profileUser.bio ||
            "This user hasn't added a bio yet.";


        /* =========================
           PROFILE IMAGE
        ========================= */

        if (
            profileUser.profileImage
        ) {

            profileAvatar.innerHTML = `

                <img
                    src="${profileUser.profileImage}"
                    alt="Profile Picture"
                >

            `;

        }

        else {

            generateAvatar(
                profileUser.name
            );

        }


        formatJoinedDate(
            profileUser.createdAt
        );

    }

    catch (error) {

        console.error(
            "Profile Error:",
            error
        );

    }

}


/* ===========================================================
   SELF PROFILE CHECK
   =========================================================== */

function preventSelfFollow() {

    if (
        currentUser.uid ===
        profileUserId
    ) {

        connectBtn.style.display =
            "none";

        messageBtn.style.display =
            "none";


        if (editProfileBtn) {

            editProfileBtn.style.display =
                "inline-flex";

        }

    }

    else {

        if (editProfileBtn) {

            editProfileBtn.style.display =
                "none";

        }

    }

}


/* ===========================================================
   GENERATE AVATAR
   =========================================================== */

function generateAvatar(name) {

    if (!name) {

        profileAvatar.textContent =
            "U";

        return;

    }


    profileAvatar.textContent =
        name
            .trim()
            .charAt(0)
            .toUpperCase();

}


/* ===========================================================
   FORMAT JOIN DATE
   =========================================================== */

function formatJoinedDate(timestamp) {

    if (!timestamp) {

        profileJoined.textContent =
            "-";

        return;

    }


    const date =
        timestamp.toDate();


    profileJoined.textContent =
        date.toLocaleDateString(

            "en-US",

            {

                month: "long",

                year: "numeric"

            }

        );

}


/* ===========================================================
   LOAD USER STATISTICS
   =========================================================== */

async function loadUserStatistics() {

    try {

        const q =
            query(

                collection(
                    db,
                    "notes"
                ),

                where(
                    "uploaderId",
                    "==",
                    profileUserId
                ),

                where(
                    "status",
                    "==",
                    "approved"
                )

            );


        const snapshot =
            await getDocs(q);


        userNotes = [];


        let totalLikes = 0;

        let totalViews = 0;

        let totalDownloads = 0;


        snapshot.forEach(
            noteDoc => {

                const note =
                    noteDoc.data();


                userNotes.push({

                    id:
                        noteDoc.id,

                    ...note

                });


                totalLikes +=
                    note.likes || 0;


                totalViews +=
                    note.views || 0;


                totalDownloads +=
                    note.downloads || 0;

            }
        );


        uploadsCount.textContent =
            userNotes.length;


        likesCount.textContent =
            totalLikes;


        viewsCount.textContent =
            totalViews;


        downloadsCount.textContent =
            totalDownloads;


        userNotes.sort(

            (a, b) => {

                const first =
                    a.uploadedAt?.seconds ||
                    0;


                const second =
                    b.uploadedAt?.seconds ||
                    0;


                return second - first;

            }

        );


        renderRecentUploads();

    }

    catch (error) {

        console.error(
            "Statistics Error:",
            error
        );

    }

}


/* ===========================================================
   RECENT UPLOADS
   =========================================================== */

function renderRecentUploads() {

    recentUploads.innerHTML =
        "";


    if (
        userNotes.length === 0
    ) {

        recentUploads.innerHTML = `

            <div class="upload-empty">

                <div class="empty-icon">
                    📄
                </div>

                <h3>
                    No uploads yet
                </h3>

                <p>
                    This user hasn't uploaded any notes yet.
                </p>

            </div>

        `;

        return;

    }


    const recent =
        userNotes.slice(0, 6);


    recent.forEach(
        note => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "upload-row";


            row.innerHTML = `

                <div class="upload-info">

                    <h3>
                        ${note.title}
                    </h3>

                    <span>
                        ${note.subject ||
                "Unknown Subject"
                }
                    </span>

                </div>


                <button
                    class="details-btn"
                >
                    View Details
                </button>

            `;


            row.querySelector(
                ".details-btn"
            ).addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();


                    window.location.href =
                        `/main/Users/notes-details.html?id=${note.id}`;

                }
            );


            row.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `/main/Users/notes-details.html?id=${note.id}`;

                }
            );


            recentUploads.appendChild(
                row
            );

        }
    );

}


/* ===========================================================
   FOLLOW SYSTEM
   =========================================================== */

async function checkFollowStatus() {

    if (
        currentUser.uid ===
        profileUserId
    ) {

        return;

    }


    const q =
        query(

            collection(
                db,
                "follows"
            ),

            where(
                "followerId",
                "==",
                currentUser.uid
            ),

            where(
                "followingId",
                "==",
                profileUserId
            )

        );


    const snapshot =
        await getDocs(q);


    if (
        snapshot.empty
    ) {

        connectBtn.textContent =
            "Connect";

        connectBtn.dataset.followId =
            "";

    }

    else {

        connectBtn.textContent =
            "Disconnect";

        connectBtn.dataset.followId =
            snapshot.docs[0].id;

    }

}


/* ===========================================================
   CREATE NOTIFICATION
   =========================================================== */

async function createNotification(
    recipientId,
    type,
    message,
    relatedId = null
) {

    try {

        await addDoc(

            collection(
                db,
                "notifications"
            ),

            {

                recipientId:
                    recipientId,

                senderId:
                    currentUser.uid,

                type:
                    type,

                message:
                    message,

                relatedId:
                    relatedId,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }

        );


        console.log(
            "Notification created successfully"
        );

    }

    catch (error) {

        console.error(
            "Notification Error:",
            error
        );

    }

}


/* ===========================================================
   CONNECT USER
   =========================================================== */

async function connectUser() {

    try {

        await addDoc(

            collection(
                db,
                "follows"
            ),

            {

                followerId:
                    currentUser.uid,

                followingId:
                    profileUserId,

                createdAt:
                    serverTimestamp()

            }

        );


        await createNotification(

            profileUserId,

            "connect",

            `${currentUser.displayName || "Someone"} connected with you.`,

            currentUser.uid

        );

    }

    catch (error) {

        console.error(
            "Connect Error:",
            error
        );

    }

}


/* ===========================================================
   DISCONNECT USER
   =========================================================== */

async function disconnectUser(id) {

    try {

        await deleteDoc(

            doc(
                db,
                "follows",
                id
            )

        );

    }

    catch (error) {

        console.error(
            "Disconnect Error:",
            error
        );

    }

}


/* ===========================================================
   CONNECT BUTTON
   =========================================================== */

if (connectBtn) {

    connectBtn.addEventListener(

        "click",

        async () => {

            connectBtn.disabled =
                true;


            const followId =
                connectBtn.dataset.followId;


            if (followId) {

                await disconnectUser(
                    followId
                );

            }

            else {

                await connectUser();

            }


            await checkFollowStatus();


            connectBtn.disabled =
                false;

        }

    );

}


/* ===========================================================
   FOLLOWERS / FOLLOWING COUNTS
   =========================================================== */

function listenSocialCounts() {

    /* =========================
       FOLLOWERS
    ========================= */

    const followersQuery =
        query(

            collection(
                db,
                "follows"
            ),

            where(
                "followingId",
                "==",
                profileUserId
            )

        );


    onSnapshot(

        followersQuery,

        snapshot => {

            const countElement =
                followersBtn?.querySelector(
                    "strong"
                );


            if (countElement) {

                countElement.textContent =
                    snapshot.size;

            }

        },

        error => {

            console.error(
                "Followers Listener Error:",
                error
            );

        }

    );


    /* =========================
       FOLLOWING
    ========================= */

    const followingQuery =
        query(

            collection(
                db,
                "follows"
            ),

            where(
                "followerId",
                "==",
                profileUserId
            )

        );


    onSnapshot(

        followingQuery,

        snapshot => {

            if (followingCount) {

                followingCount.textContent =
                    snapshot.size;

            }

        },

        error => {

            console.error(
                "Following Listener Error:",
                error
            );

        }

    );

}


/* ===========================================================
   OPEN FOLLOWERS / FOLLOWING MODAL
   =========================================================== */

async function openSocialModal(type) {

    if (
        !socialModal ||
        !socialUserList
    ) {

        return;

    }


    const isFollowers =
        type === "followers";


    socialModalTitle.textContent =
        isFollowers
            ? "Followers"
            : "Following";


    socialUserList.innerHTML = `

        <div class="social-user-loading">

            Loading...

        </div>

    `;


    socialModal.classList.add(
        "show"
    );


    socialModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";


    try {

        const q =
            query(

                collection(
                    db,
                    "follows"
                ),

                where(

                    isFollowers
                        ? "followingId"
                        : "followerId",

                    "==",

                    profileUserId

                )

            );


        const snapshot =
            await getDocs(q);


        /* =========================
           EMPTY
        ========================= */

        if (
            snapshot.empty
        ) {

            socialUserList.innerHTML = `

                <div class="social-user-empty">

                    <strong>

                        No ${isFollowers
                    ? "followers"
                    : "following"
                } yet

                    </strong>

                    <span>

                        ${isFollowers

                    ? "People who connect with this user will appear here."

                    : "People this user connects with will appear here."

                }

                    </span>

                </div>

            `;

            return;

        }


        /* =========================
           LOAD USER DOCUMENTS
        ========================= */

        const users =
            await Promise.all(

                snapshot.docs.map(
                    async followDoc => {

                        const follow =
                            followDoc.data();


                        const userId =
                            isFollowers

                                ? follow.followerId

                                : follow.followingId;


                        const userSnap =
                            await getDoc(

                                doc(
                                    db,
                                    "users",
                                    userId
                                )

                            );


                        if (
                            !userSnap.exists()
                        ) {

                            return null;

                        }


                        return {

                            id:
                                userId,

                            ...userSnap.data()

                        };

                    }
                )

            );


        const validUsers =
            users.filter(Boolean);


        /* =========================
           NO VALID USERS
        ========================= */

        if (
            validUsers.length === 0
        ) {

            socialUserList.innerHTML = `

                <div class="social-user-empty">

                    <strong>
                        No users found
                    </strong>

                    <span>
                        The users could not be loaded.
                    </span>

                </div>

            `;

            return;

        }


        /* =========================
           RENDER USERS
        ========================= */

        socialUserList.innerHTML =
            "";


        validUsers.forEach(
            user => {

                const row =
                    document.createElement(
                        "button"
                    );


                row.type =
                    "button";


                row.className =
                    "social-user-row";


                const name =
                    user.name ||
                    "Unknown User";


                const initial =
                    name
                        .trim()
                        .charAt(0)
                        .toUpperCase() ||
                    "U";


                row.innerHTML = `

                    <div
                        class="social-user-avatar"
                    >

                        ${user.profileImage

                        ? `

                                    <img
                                        src="${user.profileImage}"
                                        alt="Profile Picture"
                                    >

                                  `

                        : initial
                    }

                    </div>


                    <div
                        class="social-user-info"
                    >

                        <div
                            class="social-user-name"
                        >

                            ${name}

                        </div>


                        <div
                            class="social-user-meta"
                        >

                            ${user.branch ||
                    "Engineering"
                    }

                            ${user.year

                        ? ` • ${user.year}`

                        : ""

                    }

                        </div>

                    </div>

                `;


                row.addEventListener(
                    "click",
                    () => {

                        closeSocialModal();


                        window.location.href =
                            `/main/Users/user_profile.html?uid=${user.id}`;

                    }
                );


                socialUserList.appendChild(
                    row
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Social List Error:",
            error
        );


        socialUserList.innerHTML = `

            <div class="social-user-empty">

                <strong>
                    Couldn't load users
                </strong>

                <span>
                    Please try again.
                </span>

            </div>

        `;

    }

}


/* ===========================================================
   CLOSE SOCIAL MODAL
   =========================================================== */

function closeSocialModal() {

    if (!socialModal) {

        return;

    }


    socialModal.classList.remove(
        "show"
    );


    socialModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";

}


/* ===========================================================
   FOLLOWERS BUTTON
   =========================================================== */

if (followersBtn) {

    followersBtn.addEventListener(
        "click",
        () => {

            openSocialModal(
                "followers"
            );

        }
    );

}


/* ===========================================================
   FOLLOWING BUTTON
   =========================================================== */

if (followingBtn) {

    followingBtn.addEventListener(
        "click",
        () => {

            openSocialModal(
                "following"
            );

        }
    );

}


/* ===========================================================
   CLOSE BUTTON
   =========================================================== */

if (socialModalClose) {

    socialModalClose.addEventListener(
        "click",
        closeSocialModal
    );

}


/* ===========================================================
   CLOSE BY BACKDROP
   =========================================================== */

if (socialModalBackdrop) {

    socialModalBackdrop.addEventListener(
        "click",
        closeSocialModal
    );

}


/* ===========================================================
   CLOSE WITH ESCAPE
   =========================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (

            event.key === "Escape" &&

            socialModal?.classList.contains(
                "show"
            )

        ) {

            closeSocialModal();

        }

    }
);


/* ===========================================================
   MESSAGE BUTTON
   =========================================================== */

if (messageBtn) {

    messageBtn.addEventListener(

        "click",

        () => {

            if (
                currentUser.uid ===
                profileUserId
            ) {

                return;

            }


            window.location.href =
                `/main/chat.html?uid=${profileUserId}`;

        }

    );

}


/* ===========================================================
   REFRESH FOLLOW BUTTON
   =========================================================== */

async function refreshFollowButton() {

    try {

        await checkFollowStatus();

    }

    catch (error) {

        console.error(
            error
        );

    }

}


/* ===========================================================
   FORMAT LARGE NUMBERS
   =========================================================== */

function formatNumber(number) {

    if (
        number >= 1000000
    ) {

        return (

            number /
            1000000

        ).toFixed(1) + "M";

    }


    if (
        number >= 1000
    ) {

        return (

            number /
            1000

        ).toFixed(1) + "K";

    }


    return number;

}


/* ===========================================================
   WINDOW ERROR HANDLER
   =========================================================== */

window.addEventListener(

    "error",

    event => {

        console.error(

            "Profile JS Error:",

            event.error

        );

    }

);


/* ===========================================================
   DEBUG
   =========================================================== */

console.log(
    "================================"
);

console.log(
    "EngiNotes User Profile Loaded"
);

console.log(
    "Profile UID:",
    profileUserId
);

console.log(
    "================================"
);