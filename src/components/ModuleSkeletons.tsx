import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BookOpen,
  UploadCloud,
  BarChart3,
  Settings,
  DatabaseBackup,
  Code,
  Loader2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  Building2
} from 'lucide-react';

export const ErpDeskSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      {/* Top Banner Skeleton */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-60 bg-slate-200 rounded" />
              <div className="h-3.5 w-80 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-32 bg-slate-200 rounded-xl" />
            <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Sub-navigation tabs skeleton */}
        <div className="flex items-center space-x-2 border-t border-slate-100 pt-3 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6, 7].map((tab) => (
            <div key={`erp-tab-${tab}`} className="h-8 w-28 bg-slate-100 rounded-lg shrink-0" />
          ))}
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((stat) => (
          <div key={`erp-stat-${stat}`} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-28 bg-slate-300 rounded" />
            <div className="h-3 w-36 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid / Data Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="h-10 w-72 bg-slate-100 rounded-xl" />
          <div className="flex space-x-2">
            <div className="h-9 w-28 bg-slate-200 rounded-lg" />
            <div className="h-9 w-32 bg-blue-100 rounded-lg" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="h-9 bg-slate-100 rounded-lg w-full" />
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={`erp-row-${row}`} className="h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <div className="h-3.5 w-20 bg-slate-200 rounded font-mono" />
                <div className="h-3.5 w-44 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="flex items-center space-x-6">
                <div className="h-3.5 w-20 bg-slate-200 rounded" />
                <div className="h-6 w-20 bg-emerald-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      {/* Top Banner Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={`dash-stat-${i}`} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <div className="w-5 h-5 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-12 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-24 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-32 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2 Column Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent OPD Queue Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-4 h-4 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-3 w-48 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={`queue-row-${item}`} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-200 rounded" />
                    <div className="h-2.5 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Financial Chart Overview Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <BarChart3 className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-52 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
          </div>
          <div className="h-48 bg-slate-50/80 rounded-xl border border-slate-100 flex items-end justify-between p-4 gap-3">
            {[40, 65, 30, 85, 50, 70, 90].map((h, idx) => (
              <div key={`chart-bar-${idx}`} className="flex-1 bg-slate-200 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PatientDeskSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      {/* Patient Header & Subnav Skeleton */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-44 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            <div className="h-8 w-28 bg-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Sub-navigation tabs skeleton */}
        <div className="flex items-center space-x-2 border-t border-slate-100 pt-3 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((tab) => (
            <div key={`patient-tab-${tab}`} className="h-8 w-28 bg-slate-100 rounded-lg shrink-0" />
          ))}
        </div>
      </div>

      {/* Queue 3-Column Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((col) => (
          <div key={`queue-col-${col}`} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-slate-300" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="p-4 space-y-3 min-h-[220px]">
              {[1, 2, 3].map((row) => (
                <div key={`q-item-${col}-${row}`} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-24 bg-slate-200 rounded" />
                      <div className="h-2.5 w-16 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PharmacyPOSSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      {/* Header & POS Subnav */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="h-5 w-52 bg-slate-200 rounded" />
              <div className="h-3 w-72 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
        </div>
        <div className="flex items-center space-x-2 border-t border-slate-100 pt-3">
          {[1, 2, 3, 4, 5].map((t) => (
            <div key={`pos-tab-${t}`} className="h-8 w-24 bg-slate-100 rounded-lg shrink-0" />
          ))}
        </div>
      </div>

      {/* POS Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inventory Search & Items Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 h-10 bg-slate-100 rounded-xl border border-slate-200" />
            <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-slate-100 rounded-lg w-full" />
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={`pos-item-${item}`} className="h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4">
                <div className="flex items-center space-x-3">
                  <div className="h-3.5 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-3.5 w-16 bg-slate-200 rounded" />
                  <div className="h-7 w-16 bg-emerald-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Cart Checkout Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-5 w-12 bg-emerald-100 rounded-full" />
          </div>
          <div className="space-y-3 min-h-[160px]">
            {[1, 2, 3].map((ci) => (
              <div key={`cart-i-${ci}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                  <div className="h-2.5 w-12 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-12 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-200 rounded" />
            </div>
            <div className="flex justify-between font-bold">
              <div className="h-4 w-20 bg-slate-300 rounded" />
              <div className="h-4 w-24 bg-slate-300 rounded" />
            </div>
            <div className="h-11 bg-emerald-200/80 rounded-xl w-full mt-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const UploadingDeskSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-72 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-slate-300" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded mx-auto" />
            <div className="h-3 w-48 bg-slate-100 rounded mx-auto" />
          </div>
          <div className="h-10 w-36 bg-orange-100 rounded-xl" />
        </div>

        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <div key={`upload-row-${r}`} className="h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between px-3">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReportingDeskSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="h-5 w-52 bg-slate-200 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={`rep-card-${s}`} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-6 w-28 bg-slate-300 rounded" />
            <div className="h-2.5 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <div key={`rep-row-${r}`} className="h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4">
              <div className="h-3.5 w-36 bg-slate-200 rounded" />
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SettingsDeskSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Settings className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="h-5 w-44 bg-slate-200 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          {[1, 2, 3, 4, 5].map((st) => (
            <div key={`set-tab-${st}`} className="h-10 bg-slate-50 rounded-xl border border-slate-100" />
          ))}
        </div>
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-10 w-32 bg-blue-100 rounded-xl ml-auto" />
        </div>
      </div>
    </div>
  );
};

export const NhcPatientHistoryDeskSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
            <DatabaseBackup className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="h-5 w-52 bg-slate-200 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="h-11 bg-slate-100 rounded-xl w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((card) => (
            <div key={`nhc-card-${card}`} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const QueryHandlerDeskSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Code className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-72 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-8 w-28 bg-purple-100 rounded-lg" />
      </div>

      <div className="bg-slate-900 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="h-28 bg-slate-800 rounded-xl w-full" />
        <div className="h-9 w-28 bg-purple-600/80 rounded-lg ml-auto" />
      </div>
    </div>
  );
};

export const GenericModuleSkeleton: React.FC<{ title?: string }> = ({ title = 'Loading Module' }) => {
  return (
    <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-base font-bold text-slate-800">{title}...</h3>
        <p className="text-xs text-slate-400">Rendering workspace components and populating records</p>
      </div>
      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 animate-pulse w-full rounded-full" />
      </div>
    </div>
  );
};
