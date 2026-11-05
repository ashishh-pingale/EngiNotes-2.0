import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  UploadCloud,
  Search,
  Users,
  Download,
  ShieldCheck,
  Zap,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Laptop,
  Globe,
  Cpu,
  BarChart3,
  Cog,
  Building2,
  BatteryCharging,
  Star,
  MessageSquare,
  MessageSquarePlus
} from "lucide-react";
import { getHomePageMetrics, getCachedHomePageMetrics } from "../services/homeService";
import AddReviewModal from "../components/reviews/AddReviewModal";

const baseBranches = [
  { name: "Computer Science", code: "CSE", icon: <Laptop className="w-6 h-6 text-blue-600" /> },
  { name: "Information Tech", code: "IT", icon: <Globe className="w-6 h-6 text-cyan-600" /> },
  { name: "AI & Machine Learning", code: "AIML", icon: <Cpu className="w-6 h-6 text-purple-600" /> },
  { name: "AI & Data Science", code: "AIDS", icon: <BarChart3 className="w-6 h-6 text-violet-600" /> },
  { name: "Electronics & Comm", code: "ECE", icon: <Zap className="w-6 h-6 text-amber-600" /> },
  { name: "Mechanical Eng.", code: "Mechanical", icon: <Cog className="w-6 h-6 text-orange-600" /> },
  { name: "Civil Engineering", code: "Civil", icon: <Building2 className="w-6 h-6 text-emerald-600" /> },
  { name: "Electrical Eng.", code: "Electrical", icon: <BatteryCharging className="w-6 h-6 text-yellow-600" /> }
];

const features = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    title: "Admin Verified Quality",
    desc: "Every note submission is reviewed by moderators to ensure clarity, syllabus relevance, and readability."
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    title: "One-Click PDF Downloads",
    desc: "Instantly preview notes inline or download high-resolution PDFs without paywalls or annoying delays."
  },
  {
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    title: "Vibrant Peer Community",
    desc: "Discover top contributors from your college, follow classmates, and chat directly for doubts."
  },
  {
    icon: <UploadCloud className="w-6 h-6 text-emerald-500" />,
    title: "Simple Drag & Drop Upload",
    desc: "Share your own handwritten or lecture notes easily. Earn recognition and help peers excel."
  }
];

export default function HomePage() {
  const [metrics, setMetrics] = useState(() => getCachedHomePageMetrics());
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  function loadMetrics() {
    getHomePageMetrics().then((data) => {
      if (data) setMetrics(data);
    });
  }

  useEffect(() => {
    loadMetrics();
    window.addEventListener("enginotes_review_added", loadMetrics);
    return () => window.removeEventListener("enginotes_review_added", loadMetrics);
  }, []);

  // Compute dynamic stats from live Firestore database
  const dynamicStats = [
    {
      label: "Engineering Notes",
      value: metrics
        ? metrics.notesCount >= 1000
          ? `${metrics.notesCount.toLocaleString()}+`
          : String(metrics.notesCount)
        : "5,000+"
    },
    {
      label: "Active Students",
      value: metrics
        ? metrics.usersCount >= 1000
          ? `${metrics.usersCount.toLocaleString()}+`
          : String(metrics.usersCount)
        : "12,000+"
    },
    {
      label: "Engineering Colleges",
      value: metrics
        ? metrics.collegesCount >= 100
          ? `${metrics.collegesCount}+`
          : String(metrics.collegesCount)
        : "45+"
    },
    {
      label: "Total Downloads",
      value: metrics
        ? metrics.downloadsCount >= 1000
          ? `${metrics.downloadsCount.toLocaleString()}+`
          : String(metrics.downloadsCount)
        : "50,000+"
    }
  ];

  // Compute branch cards with live counts from Firestore
  const dynamicBranches = baseBranches.map((b) => {
    let countText = "0 Notes";
    if (metrics && metrics.branchCounts) {
      const count = metrics.branchCounts[b.code] || 0;
      countText = count === 1 ? "1 Note" : `${count.toLocaleString()} Notes`;
    }
    return {
      ...b,
      count: countText
    };
  });

  const reviewsList = metrics?.testimonials || [];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 lg:pt-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold shadow-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Empowering {metrics ? `${metrics.usersCount || metrics.notesCount || 100}+` : "12,000+"} Engineering Students
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Ace Your Engineering Exams with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Verified Handwritten Notes
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            The open-source repository of lecture notes, question banks, and handwritten summaries
            organized by branch, year, and subject.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/browse"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Explore All Notes
            </Link>

            <Link
              to="/upload"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-base border border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Upload Your Notes
            </Link>
          </div>

          {/* Quick Stats Grid with Live DB Values */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {dynamicStats.map((stat, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow transition-shadow"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering Branches Grid with Live DB Counts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-visibility-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Browse By Engineering Branch
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Find curated notes specifically aligned with your branch syllabus and semester subjects.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {dynamicBranches.map((b) => (
            <Link
              key={b.code}
              to={`/browse?branch=${b.code}`}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-start justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 flex items-center justify-center transition-colors">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {b.name}
                  </h3>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mt-0.5">{b.count}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Choose EngiNotes Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-visibility-auto">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl mb-12 space-y-3">
            <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
              Why EngiNotes
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Built for Engineering Students, By Engineering Students
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We know the struggle of hunting down decent handwritten notes the night before exams.
              EngiNotes gives you structured, verified knowledge right at your fingertips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors space-y-3"
              >
                <div className="p-3 rounded-xl bg-white/10 w-fit">{f.icon}</div>
                <h3 className="font-semibold text-base text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Reviews & Feedback Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-visibility-auto">
        {/* Section Header (Centered) */}
        <div className="text-center space-y-3 mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Student Reviews & Community Feedback
          </h2>
          <p className="text-sm sm:text-base text-slate-500">
            Feedback and CGPA improvements shared by students studying with EngiNotes.
          </p>
        </div>

        {/* Reviews Content */}
        {reviewsList.length === 0 ? (
          /* Empty state: No reviews yet */
          <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No reviews yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are currently no reviews submitted by real users. Be the first to share your experience with EngiNotes!
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Add Review
              </button>
              <Link
                to="/reviews"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs transition-all inline-flex items-center gap-1"
              >
                Show More <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Top 3 Reviews Grid */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviewsList.slice(0, 3).map((r, i) => (
                <div
                  key={r.id || i}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${idx < (r.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                            }`}
                        />
                      ))}
                    </div>
                    {/* Comment */}
                    <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-4">
                      "{r.comment || r.quote}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden shrink-0">
                      {typeof (r.authorAvatar || r.avatar) === "string" &&
                        (r.authorAvatar || r.avatar).startsWith("http") ? (
                        <img
                          src={r.authorAvatar || r.avatar}
                          alt={r.authorName || r.author}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (r.authorName || r.author)?.charAt(0)?.toUpperCase() || "S"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {r.authorName || r.author}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {r.branch ? `${r.branch}` : ""}
                        {r.year ? ` • Year ${r.year}` : ""}
                        {r.college ? ` • ${r.college}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Add Review
              </button>
              <Link
                to="/reviews"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs transition-all inline-flex items-center gap-1"
              >
                Show More <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-blue-500/20">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to Share Your Knowledge & Help Peers?
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-blue-100">
            Join thousands of engineering students contributing study material today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/upload"
              className="px-8 py-3.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-semibold text-sm shadow transition-colors"
            >
              Upload Notes Now
            </Link>
            <Link
              to="/browse"
              className="px-8 py-3.5 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-sm border border-blue-400/40 transition-colors"
            >
              Browse Library
            </Link>
          </div>
        </div>
      </section>

      {/* Add Review Modal */}
      <AddReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={loadMetrics}
      />
    </div>
  );
}
