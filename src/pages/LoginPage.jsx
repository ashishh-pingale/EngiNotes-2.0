import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  X,
  ArrowLeft,
  BookOpen,
  Users,
  MessageSquare,
  Mail,
  Lock
} from "lucide-react";

export default function LoginPage() {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/";

  async function handleGoogleSignIn() {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        // User dismissed the popup window, no error message needed
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain unauthorized in Firebase. Please add this host to Firebase Console -> Authentication -> Authorized Domains.");
      } else {
        setErrorMsg(err.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await login(email.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setErrorMsg("Invalid email or password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setErrorMsg("No account found with this email. Please sign up.");
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain unauthorized in Firebase. Please open http://localhost:3000/ or add your host to Firebase Console.");
      } else {
        setErrorMsg(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.10),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(79,70,229,0.08),transparent_28%),#f5f7fb] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.15),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(79,70,229,0.15),transparent_28%),#090d16]">
      <div className="w-full max-w-[1120px] min-h-[640px] bg-white dark:bg-slate-900 rounded-[26px] overflow-hidden shadow-[0_30px_80px_rgba(15,23,42,0.10)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] relative">
        {/* =========================================
            LEFT BRAND PANEL
        ========================================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-[#3b5fe8] to-indigo-600 p-8 sm:p-12 lg:p-14 text-white flex flex-col justify-between">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Logo */}
            <Link to="/" className="inline-block text-2xl sm:text-3xl font-extrabold tracking-tight">
              Engi<span className="text-blue-200">Notes</span>
            </Link>

            {/* Badge */}
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[#dbeafe] text-[10px] font-bold tracking-wider uppercase">
                ENGINEERING STUDENT COMMUNITY
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.18]">
              Study smarter.
              <br />
              <span className="text-blue-200">Share better.</span>
            </h1>

            {/* Description */}
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm">
              A place for engineering students to discover notes, share knowledge and connect with their peers.
            </p>

            {/* Feature List */}
            <div className="pt-2 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <strong className="block text-white font-bold text-sm">Share Notes</strong>
                  <span className="block text-xs text-white/75 mt-0.5">Upload and share your study material.</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <strong className="block text-white font-bold text-sm">Connect</strong>
                  <span className="block text-xs text-white/75 mt-0.5">Find and connect with fellow students.</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <strong className="block text-white font-bold text-sm">Learn Together</strong>
                  <span className="block text-xs text-white/75 mt-0.5">Discuss ideas and help each other.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 text-[11px] text-white/60">
            © {new Date().getFullYear()} EngiNotes. All rights reserved.
          </div>
        </section>

        {/* =========================================
            RIGHT LOGIN PANEL
        ========================================= */}
        <section className="relative p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <Link
            to="/"
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-slate-600 flex items-center justify-center text-lg transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Link>

          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                WELCOME BACK
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Enter your credentials to continue to EngiNotes.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? "Signing in with Google..." : "Continue with Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium tracking-wider text-[11px]">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase transition-colors cursor-pointer"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 dark:text-slate-400 pt-2">
              <span>Don't have an account? </span>
              <Link to="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Create one
              </Link>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
