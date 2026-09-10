import {
    getCurrentAdmin,
    getContactMessages,
    markContactMessageAsRead,
    deleteContactMessage
} from "./firebase-admin.js";

// =========================================
// Elements
// =========================================

const sidebar = document.querySelector(".sidebar");
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".page-section");
// =========================================
// Admin Profile
// =========================================

const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");


// =========================================
// Sidebar Toggle
// =========================================

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});

// =========================================
// Navigation
// =========================================

navLinks.forEach(link => {

    link.addEventListener("click", e => {

        e.preventDefault();

        navLinks.forEach(item => item.classList.remove("active"));
        link.classList.add("active");

        const target = link.getAttribute("href").substring(1);

        sections.forEach(section => {
            section.classList.remove("active-page");

            if (section.id === target) {
                section.classList.add("active-page");
            }
        });

        if (window.innerWidth < 900) {
            sidebar.classList.remove("active");
        }

    });

});

// =========================================
// ADMIN PROFILE
// =========================================

async function loadAdminProfile() {

    const admin = await getCurrentAdmin();

    

    if (!admin) {
        return;
    }

    adminName.textContent = admin.name;
    adminRole.textContent =
        admin.role === "admin"
            ? "Super Admin"
            : admin.role;

    if (admin.photoURL) {
        adminAvatar.src = admin.photoURL;
    } else {
        adminAvatar.src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=2563eb&color=fff`;
    }
}




// =========================================
// Responsive Sidebar
// =========================================

window.addEventListener("resize", () => {

    if (window.innerWidth > 900) {
        sidebar.classList.remove("active");
    }

});

loadAdminProfile();
// =========================================
// Future API Functions
// =========================================



// document.addEventListener("DOMContentLoaded", () => {

//     loadDashboard();
//     loadPendingNotes();
//     loadApprovedNotes();
//     loadRejectedNotes();
//     loadUsers();

//     console.log("EngiNotes Admin Panel Loaded");

// });