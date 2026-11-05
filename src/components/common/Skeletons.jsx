import React from "react";

export function NoteCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-[28px] p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[360px] animate-pulse">
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="flex items-center gap-2">
            <div className="w-16 h-6 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>

        {/* Subject & Date */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="w-14 h-4 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>

        {/* Title */}
        <div className="space-y-2 mb-4">
          <div className="w-full h-5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="w-3/4 h-5 rounded bg-slate-100 dark:bg-slate-800/80" />
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <div className="w-16 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="w-14 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-20 h-4 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="w-16 h-7 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function NoteCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
      {Array.from({ length: count }).map((_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between h-[230px] animate-pulse">
      <div className="space-y-4 text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto" />
        {/* Name & Branch */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="w-24 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function UserCardSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="bg-slate-100/70 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-1.5">
          <div className="w-48 h-5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="w-64 h-3.5 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 flex items-center gap-3.5 h-[80px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="w-32 h-3 rounded bg-slate-100 dark:bg-slate-700/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 h-[220px] flex flex-col justify-between animate-pulse"
        >
          <div className="space-y-3">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
            <div className="w-full h-4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="w-4/5 h-4 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="w-28 h-3.5 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="w-20 h-3 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
