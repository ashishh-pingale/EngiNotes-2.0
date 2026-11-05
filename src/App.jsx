import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";

// Common Components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";

import HomePage from "./pages/HomePage";

// Route-Level Code Splitting (Dynamic Lazy Imports for Secondary Routes)
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const NoteDetailsPage = lazy(() => import("./pages/NoteDetailsPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));

function PageLoadingFallback() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <LoadingSpinner text="Loading..." />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
                <Navbar />
                <main className="flex-1 min-h-[calc(100vh-140px)]">
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/browse" element={<BrowsePage />} />
                      <Route path="/notes/:noteId" element={<NoteDetailsPage />} />
                      <Route path="/reviews" element={<ReviewsPage />} />
                      <Route path="/discover" element={<DiscoverPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />

                      {/* Auth Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignUpPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />

                      {/* User Profile Routes */}
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/profile/:uid" element={<ProfilePage />} />
                      <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

                      {/* Protected Actions */}
                      <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />

                      {/* Admin Protected Routes */}
                      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

                      {/* Catch-all fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
