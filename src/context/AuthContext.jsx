import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  reload,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user profile and admin role
  async function loadUserData(user) {
    if (!user) {
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.profilePicture && user.photoURL) {
          data.profilePicture = user.photoURL;
        }
        setUserProfile(data);
        setIsAdmin(data.role === "admin");
      } else {
        setUserProfile({
          name: user.displayName || user.email?.split("@")[0] || "Student",
          email: user.email,
          role: "user",
          profilePicture: user.photoURL || ""
        });
        setIsAdmin(false);
      }
    } catch (err) {
      console.warn("Failed to load user profile document:", err);
      setUserProfile({
        name: user.displayName || user.email?.split("@")[0] || "Student",
        email: user.email,
        role: "user",
        profilePicture: user.photoURL || ""
      });
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserData(user);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function register({ name, email, password, college, branch, year }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Send verification email
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn("Verification email not sent:", e);
    }

    // Save profile to Firestore
    try {
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        college,
        branch,
        year,
        role: "user",
        bio: "",
        profilePicture: "",
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Error creating user profile in Firestore:", e);
    }

    await loadUserData(user);
    return user;
  }

  async function logout() {
    return signOut(auth);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    // Check if user profile document exists in Firestore
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // First-time Google user: initialize default student profile
        await setDoc(userRef, {
          name: user.displayName || user.email?.split("@")[0] || "Student",
          email: user.email,
          college: "",
          branch: "CSE",
          year: "1",
          role: "user",
          bio: "",
          profilePicture: user.photoURL || "",
          createdAt: serverTimestamp()
        });
      } else {
        // If user already existed but profilePicture was empty and Google provides photoURL, update it
        const existingData = snap.data();
        if (!existingData.profilePicture && user.photoURL) {
          try {
            await updateDoc(userRef, { profilePicture: user.photoURL });
          } catch (updateErr) {
            console.warn("Could not backfill profilePicture:", updateErr);
          }
        }
      }
    } catch (e) {
      console.warn("Error creating/verifying Google user profile in Firestore:", e);
    }

    await loadUserData(user);
    return user;
  }

  async function refreshUser() {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setCurrentUser({ ...auth.currentUser });
      await loadUserData(auth.currentUser);
    }
  }

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    login,
    register,
    signInWithGoogle,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
