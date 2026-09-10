import { db } from "./firebase.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const contactForm = document.getElementById("contactForm");
const submitButton = contactForm.querySelector(".btn-submit");

contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const subject = document.getElementById("contactSubject").value;
    const message = document.getElementById("contactMessage").value.trim();

    // Basic validation
    if (!name || !email || !subject || !message) {
        alert("Please fill in all fields.");
        return;
    }

    // Prevent duplicate submissions
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {

        await addDoc(collection(db, "contactMessages"), {
            name: name,
            email: email,
            subject: subject,
            message: message,
            status: "unread",
            createdAt: serverTimestamp()
        });

        alert("Thank you! Your message has been sent successfully.");

        contactForm.reset();

    } catch (error) {

        console.error("Error sending contact message:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        alert(
            "Sorry, we couldn't send your message. Please try again later."
        );

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "Send Message";

    }
});