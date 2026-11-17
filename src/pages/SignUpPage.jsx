import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  X,
  ArrowLeft,
  BookOpen,
  Search,
  Users,
  User,
  Building,
  Mail,
  Lock
} from "lucide-react";

const branches = ["CSE", "IT", "AIML", "AIDS", "ECE", "Mechanical", "Civil", "Electrical"];
const years = ["1", "2", "3", "4"];

export default function SignUpPage() {
  const { register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("1");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignUp() {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Google sign-up error:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        // User dismissed the popup
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain unauthorized in Firebase. Please add this host in Firebase Console -> Authentication -> Authorized Domains.");
      } else {
        setErrorMsg(err.message || "Failed to sign up with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !college.trim() || !email.trim() || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Please agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await register({
        name: name.trim(),
        college: college.trim(),
        email: email.trim(),
        password,
        branch,
        year
      });
      navigate("/verify-email");
    } catch (err) {
      console.error("Registration failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("An account with this email already exists.");
      } else {
        setErrorMsg(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.10),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(79,70,229,0.08),transparent_28%),#f5f7fb] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.15),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(79,70,229,0.15),transparent_28%),#090d16]">
      <div className="w-full max-w-[1140px] min-h-[720px] bg-white dark:bg-slate-900 rounded-[26px] overflow-hidden shadow-[0_30px_80px_rgba(15,23,42,0.10)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] relative">
        {/* =========================================
            LEFT BRAND PANEL
        ========================================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-[#3b5fe8] to-indigo-600 p-8 sm:p-12 lg:p-14 text-white flex flex-col justify-between">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <Link to="/" className="inline-block text-2xl sm:text-3xl font-extrabold tracking-tight">
              Engi<span className="text-blue-200">Notes</span>
            </Link>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[#dbeafe] text-[10px] font-bold tracking-wider uppercase">
                ENGINEERING STUDENT COMMUNITY
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.18]">
              Your notes.
              <br />
              <span className="text-blue-200">Your community.</span>
            </h1>

            <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm">
              Create your EngiNotes account and join a growing community of students sharing knowledge and study material.
            </p>

            <div className="pt-2 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <strong className="block text-white font-bold text-sm">Share Knowledge</strong>
                  <span className="block text-xs text-white/75 mt-0.5">Upload notes and help other students.</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <strong className="block text-white font-bold text-sm">Discover Notes</strong>
                  <span className="block text-xs text-white/75 mt-0.5">Find useful study material quickly.</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <strong className="block text-white font-bold text-sm">Build Connections</strong>
                  <span className="block text-xs text-white/75 mt-0.5">Connect with students from your field.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 text-[11px] text-white/60">
            © {new Date().getFullYear()} EngiNotes. All rights reserved.
          </div>
        </section>

        {/* =========================================
            RIGHT SIGN UP PANEL
        ========================================= */}
        <section className="relative p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white dark:bg-slate-900 overflow-y-auto">
          <Link
            to="/"
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-slate-600 flex items-center justify-center text-lg transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Link>

          <div className="max-w-md w-full mx-auto space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                START YOUR JOURNEY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fill in your details to start exploring and sharing notes.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* College */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  College / Institute
                </label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter your college name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Branch & Year in 2 Columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {years.map((y) => (
                      <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Passwords in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>I agree to the Terms of Service & Privacy</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase cursor-pointer"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span>Already have an account? </span>
              <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Sign in
              </Link>
            </div>

            <div className="text-center pt-1">
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
