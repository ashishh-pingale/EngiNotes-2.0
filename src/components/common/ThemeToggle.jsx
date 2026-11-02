import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Activate light mode" : "Activate dark mode"}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center p-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer active:scale-90 select-none group border ${
        isDark
          ? "bg-slate-800/90 border-slate-700/80 hover:bg-slate-700/90 text-amber-300 shadow-inner"
          : "bg-slate-100/90 border-slate-200/90 hover:bg-slate-200/80 text-slate-700 shadow-2xs"
      } ${className}`}
    >
      {/* Outer ambient glow */}
      <span
        className={`absolute inset-0 rounded-xl blur-sm transition-opacity duration-500 pointer-events-none ${
          isDark
            ? "bg-blue-500/20 opacity-0 group-hover:opacity-100"
            : "bg-amber-500/25 opacity-0 group-hover:opacity-100"
        }`}
      />

      {/* Rotating Icon Container */}
      <div
        className={`relative w-6 h-6 transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark ? "rotate-[360deg]" : "rotate-0"
        }`}
      >
        {/* SUN (Light Mode) */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
            isDark
              ? "opacity-0 scale-50 rotate-90 pointer-events-none"
              : "opacity-100 scale-100 rotate-0"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-amber-500 stroke-amber-500 stroke-[2.2] fill-amber-400/20 group-hover:fill-amber-400/40 transition-colors"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Sun Core */}
            <circle cx="12" cy="12" r="4" />
            {/* Sun Rays */}
            <line x1="12" y1="1" x2="12" y2="3" className="transition-transform group-hover:-translate-y-0.5 duration-200" />
            <line x1="12" y1="21" x2="12" y2="23" className="transition-transform group-hover:translate-y-0.5 duration-200" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" className="transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 duration-200" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 duration-200" />
            <line x1="1" y1="12" x2="3" y2="12" className="transition-transform group-hover:-translate-x-0.5 duration-200" />
            <line x1="21" y1="12" x2="23" y2="12" className="transition-transform group-hover:translate-x-0.5 duration-200" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" className="transition-transform group-hover:-translate-x-0.5 group-hover:translate-y-0.5 duration-200" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" />
          </svg>
        </div>

        {/* MOON (Dark Mode) */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
            isDark
              ? "opacity-100 scale-100 rotate-0"
              : "opacity-0 scale-50 -rotate-90 pointer-events-none"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-amber-300 stroke-amber-300 stroke-[2.2] fill-amber-300/20 group-hover:fill-amber-300/40 transition-colors"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Crescent Moon */}
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>

          {/* Twinkling Star Sparks */}
          <span className="absolute -top-0.5 right-0 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-75" />
          <span className="absolute bottom-1 -left-0.5 w-1 h-1 bg-blue-300 rounded-full animate-pulse opacity-80" />
        </div>
      </div>
    </button>
  );
}

