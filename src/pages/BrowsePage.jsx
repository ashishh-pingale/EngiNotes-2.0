import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchApprovedNotes, getNoteById } from "../services/notesService";
import NoteCard from "../components/notes/NoteCard";
import NotePreviewModal from "../components/notes/NotePreviewModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { NoteCardSkeletonGrid } from "../components/common/Skeletons";
import { Search, Filter, RefreshCw, BookOpen, X, ChevronDown } from "lucide-react";

const branches = ["CSE", "IT", "AIML", "AIDS", "ECE", "Mechanical", "Civil", "Electrical"];
const years = ["1", "2", "3", "4"];
const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [branch, setBranch] = useState(searchParams.get("branch") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [semester, setSemester] = useState(searchParams.get("semester") || "");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);

  const advancedCount = (semester ? 1 : 0) + (selectedSubject ? 1 : 0);

  // Preview Modal
  const [previewNote, setPreviewNote] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load notes for current branch selection
  async function loadNotes() {
    setLoading(true);
    try {
      const data = await fetchApprovedNotes({ branch });
      setAllNotes(data);
    } catch (err) {
      console.error("Error loading notes:", err);
      setAllNotes([]);
    } finally {
      setLoading(false);
    }
  }

  // Extract unique popular subjects from all notes
  const availableSubjects = useMemo(() => {
    const map = new Map();
    allNotes.forEach((n) => {
      if (n.subject && n.subject.trim()) {
        const sub = n.subject.trim();
        map.set(sub, (map.get(sub) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([sub]) => sub);
  }, [allNotes]);

  // Handle note param from URL (e.g. notifications)
  useEffect(() => {
    const noteIdFromUrl = searchParams.get("note");
    if (noteIdFromUrl) {
      getNoteById(noteIdFromUrl).then((n) => {
        if (n) {
          setPreviewNote(n);
          setIsPreviewOpen(true);
        }
      });
    }
  }, [searchParams]);

  // Synchronize URL params with branch from URL
  useEffect(() => {
    const branchFromUrl = searchParams.get("branch");
    if (branchFromUrl) {
      setBranch(branchFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    loadNotes();
  }, [branch]);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setVisibleCount(12);
  }, [search, branch, year, semester, selectedSubject]);

  // Real-time automatic letter-wise filter (instant search, resets to default when erased)
  const filteredNotes = useMemo(() => {
    let result = allNotes;

    if (year) {
      result = result.filter((n) => String(n.year) === String(year));
    }

    if (semester) {
      result = result.filter((n) => String(n.semester) === String(semester));
    }

    if (selectedSubject) {
      result = result.filter(
        (n) => n.subject && n.subject.toLowerCase() === selectedSubject.toLowerCase()
      );
    }

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(s)) ||
          (n.subject && n.subject.toLowerCase().includes(s)) ||
          (n.uploaderName && n.uploaderName.toLowerCase().includes(s)) ||
          (n.branch && n.branch.toLowerCase().includes(s)) ||
          (n.university && n.university.toLowerCase().includes(s)) ||
          (n.college && n.college.toLowerCase().includes(s))
      );
    }

    return result;
  }, [allNotes, year, semester, selectedSubject, search]);

  const displayedNotes = useMemo(() => {
    return filteredNotes.slice(0, visibleCount);
  }, [filteredNotes, visibleCount]);

  function handleLoadMore() {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 12);
      setLoadingMore(false);
    }, 200);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
  }

  function handleResetFilters() {
    setSearch("");
    setBranch("");
    setYear("");
    setSemester("");
    setSelectedSubject("");
    setSearchParams({});
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore Engineering Notes
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          Filter through thousands of peer-uploaded study resources, handwritten formulas, and lecture slides.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, subject, branch or uploader..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <select
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setSearchParams(e.target.value ? { branch: e.target.value } : {});
            }}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" className="dark:bg-slate-900">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b} className="dark:bg-slate-900">
                {b}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" className="dark:bg-slate-900">All Years</option>
            {years.map((y) => (
              <option key={y} value={y} className="dark:bg-slate-900">
                Year {y}
              </option>
            ))}
          </select>

          {/* Toggle More Filters Button with Arrow */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className={`py-2.5 px-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              showAdvancedFilters || advancedCount > 0
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={showAdvancedFilters ? "Hide semester & subject filters" : "Show semester & subject filters"}
            aria-expanded={showAdvancedFilters}
          >
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline text-xs font-semibold">More Filters</span>
            {advancedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {advancedCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showAdvancedFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Reset Button */}
          {(branch || year || semester || selectedSubject || search) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Reset</span>
            </button>
          )}
        </form>

        {/* Expandable Advanced Filters (Semester & Subjects) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Semester Segmented Filter Bar */}
            <div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                  Semester:
                </span>
                <button
                  type="button"
                  onClick={() => setSemester("")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    semester === ""
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Semesters
                </button>
                {semesters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSemester(semester === s ? "" : s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      semester === s
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Sem {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Subject Quick Filter Chips */}
            {availableSubjects.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                  Subjects:
                </span>
                {availableSubjects.map((sub) => {
                  const isSelected = selectedSubject.toLowerCase() === sub.toLowerCase();
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubject(isSelected ? "" : sub)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/80 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <NoteCardSkeletonGrid count={6} />
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/90 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No notes found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {search.trim()
              ? `No study materials matched "${search.trim()}". Try typing another keyword or clear search.`
              : "No study materials matched your selected filter criteria. Try selecting different options."}
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors inline-block"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {displayedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPreview={(n) => {
                  setPreviewNote(n);
                  setIsPreviewOpen(true);
                }}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {visibleCount < filteredNotes.length && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs hover:shadow-md transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <span>Loading study materials...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Notes</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-bold">
                      {displayedNotes.length} of {filteredNotes.length}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVisibleCount(filteredNotes.length)}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors py-2 px-3"
              >
                Show All ({filteredNotes.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Note Quick Preview Modal */}
      <NotePreviewModal
        note={previewNote}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
