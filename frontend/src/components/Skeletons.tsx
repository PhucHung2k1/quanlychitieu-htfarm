import React from 'react';
import { Card } from './ui/card';

/**
 * Skeleton loading cho Trang 1: Sổ Kế Toán Thu Chi
 */
export const JournalSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. SKELETON 4 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 border border-slate-200/80 rounded-2xl bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100" />
                <div className="space-y-1">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-2 w-28 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-12 bg-slate-100 rounded-full" />
            </div>
            <div className="h-7 w-36 bg-slate-200 rounded-md mt-2" />
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <div className="h-2.5 w-16 bg-slate-100 rounded" />
              <div className="h-2.5 w-16 bg-slate-100 rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* 2. SKELETON BỘ LỌC & TÌM KIẾM */}
      <Card className="p-4 border border-slate-200/80 rounded-xl bg-white space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 bg-slate-100 rounded-lg" />
            ))}
          </div>
          <div className="h-8 w-32 bg-slate-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="h-9 bg-slate-100 rounded-lg" />
          <div className="h-9 bg-slate-100 rounded-lg" />
          <div className="h-9 bg-slate-100 rounded-lg" />
        </div>
      </Card>

      {/* 3. SKELETON BẢNG DỮ LIỆU */}
      <Card className="border border-slate-200/80 rounded-xl bg-white overflow-hidden p-4 space-y-3">
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-7 w-28 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100 gap-3"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-md shrink-0 hidden sm:block" />
              <div className="h-6 w-28 bg-slate-200 rounded-md shrink-0 text-right" />
              <div className="h-6 w-16 bg-slate-100 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/**
 * Skeleton loading cho Trang 2: Báo Cáo & Biểu Đồ Thống Kê
 */
export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. SKELETON HEADER */}
      <Card className="p-5 border border-slate-200/80 rounded-xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-64 bg-slate-200 rounded" />
          <div className="h-3 w-80 bg-slate-100 rounded" />
          <div className="flex gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 w-16 bg-slate-100 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-40 bg-slate-100 rounded-lg" />
          <div className="h-9 w-36 bg-slate-100 rounded-lg" />
        </div>
      </Card>

      {/* 2. SKELETON 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 border border-slate-200/80 rounded-2xl bg-white space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-36 bg-slate-200 rounded-md" />
            <div className="pt-2 border-t border-slate-100">
              <div className="h-2.5 w-32 bg-slate-100 rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* 3. SKELETON FINTECH INSIGHTS BANNER */}
      <Card className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/80 flex flex-col md:flex-row justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100" />
          <div className="space-y-1">
            <div className="h-3.5 w-48 bg-emerald-200/70 rounded" />
            <div className="h-2.5 w-64 bg-emerald-100/80 rounded" />
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="h-12 w-28 bg-white rounded-xl border border-slate-100" />
          <div className="h-12 w-32 bg-white rounded-xl border border-slate-100" />
          <div className="h-12 w-32 bg-white rounded-xl border border-slate-100" />
        </div>
      </Card>

      {/* 4. SKELETON KHỐI BIỂU ĐỒ CHÍNH */}
      <Card className="p-6 border border-slate-200/80 rounded-xl bg-white space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="h-4 w-60 bg-slate-200 rounded" />
            <div className="h-3 w-80 bg-slate-100 rounded" />
          </div>
          <div className="h-8 w-60 bg-slate-100 rounded-xl" />
        </div>
        {/* Placeholder chart area */}
        <div className="h-72 w-full bg-slate-50/80 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
          <div className="flex items-end gap-3 h-48 w-3/4 justify-around pb-4">
            {[40, 65, 80, 25, 90, 70].map((h, idx) => (
              <div key={idx} className="flex gap-1.5 items-end">
                <div style={{ height: `${h}%` }} className="w-6 bg-emerald-200/60 rounded-t-sm" />
                <div style={{ height: `${Math.max(15, h - 20)}%` }} className="w-6 bg-rose-200/60 rounded-t-sm" />
              </div>
            ))}
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100">
          <div className="h-3.5 w-48 bg-slate-200 rounded mb-2" />
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      </Card>

      {/* 5. SKELETON 2 KHỐI CUỐI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-200/80 rounded-xl bg-white space-y-3">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-44 bg-slate-50 rounded-xl" />
        </Card>
        <Card className="p-6 border border-slate-200/80 rounded-xl bg-white space-y-3">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-44 bg-slate-50 rounded-xl" />
        </Card>
      </div>
    </div>
  );
};
