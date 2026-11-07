import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  Send,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export default function VerifyEmailPage() {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");

  async function handleCheckStatus() {
    setChecking(true);
    try {
      await refreshUser();
      if (currentUser?.emailVerified) {
        setMsgType("success");
        setMsg("Email verified successfully! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setMsgType("error");
        setMsg("Email is not verified yet. Please click the verification link in your inbox.");
      }
    } catch (e) {
      console.error(e);
      setMsgType("error");
      setMsg("Failed to check status. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    if (!currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(currentUser);
      setMsgType("success");
      setMsg("Verification email has been resent to " + currentUser.email);
    } catch (e) {
      console.error(e);
      setMsgType("error");
      setMsg("Failed to resend. Please wait a minute before trying again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto ring-8 ring-blue-50/50 dark:ring-blue-950/30">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verify Your Email</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            We sent a verification link to:
          </p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 break-all">
            {currentUser?.email || "your-email@college.edu"}
          </p>
        </div>

        {msg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 border ${
              msgType === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60"
                : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60"
            }`}
          >
            {msgType === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{msg}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking..." : "I've Verified My Email"}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {resending ? "Resending..." : "Resend Verification Email"}
          </button>
        </div>

        {/* 
          TODO: [PRE-DEPLOYMENT PRODUCTION CHECKLIST] 
          Remove 'Skip for now' before final production deployment to enforce strict email verification. 
        */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Skip for now & go to Home →
          </Link>
        </div>
      </div>
    </div>
  );
}
