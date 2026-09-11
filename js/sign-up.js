import { auth, db } from "../js/firebase.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const form = document.getElementById("signupForm");
const errorBox = document.getElementById("error-box");


form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name =
        document.getElementById("name").value.trim();
    const college =
        document.getElementById("college").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const branch =
        document.getElementById("branch").value;

    const year =
        document.getElementById("year").value;


    errorBox.style.display = "none";


    errorBox.style.display = "none";


    // =========================================
    // Required Field Validation
    // =========================================

    if (!name) {

        errorBox.style.display = "block";

        errorBox.textContent =
            "Please enter your full name.";

        return;
    }

    if (!college) {

        errorBox.style.display = "block";

        errorBox.textContent =
            "Please enter your college or university.";

        return;
    }

    // =========================================
    // Password Validation
    // =========================================

    if (password !== confirmPassword) {

        errorBox.style.display = "block";

        errorBox.textContent =
            "Passwords do not match.";

        return;
    }


    try {

        // =========================================
        // Create Firebase Account
        // =========================================

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;


        // =========================================
        // Send Verification Email
        // =========================================

        await sendEmailVerification(user);


        // =========================================
        // Store User Profile
        // =========================================

        await setDoc(
            doc(db, "users", user.uid),
            {
                name: name,
                college: college,
                email: email,
                branch: branch || "",
                year: year || "",
                role: "user",
                createdAt: new Date()
            }
        );


        // =========================================
        // Go To Verification Page
        // =========================================

        window.location.href =
            "/main/verify-email.html";


    } catch (error) {

        console.error("Signup Error:", error);

        errorBox.style.display = "block";


        switch (error.code) {

            case "auth/email-already-in-use":

                errorBox.textContent =
                    "An account with this email already exists.";

                break;


            case "auth/invalid-email":

                errorBox.textContent =
                    "Please enter a valid email address.";

                break;


            case "auth/weak-password":

                errorBox.textContent =
                    "Password must be at least 6 characters.";

                break;


            default:

                errorBox.textContent =
                    error.message;

        }

    }

});

