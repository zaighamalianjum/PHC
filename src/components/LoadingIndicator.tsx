import React, { useEffect, useState } from 'react';
import { Loader2, Activity, RefreshCw } from 'lucide-react';

interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  type?: 'bar-only' | 'overlay' | 'toast';
}

export const TopProgressBar: React.FC<{ active: boolean }> = ({ active }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (active) {
      setProgress(15);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 80);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 250);
      return () => clearTimeout(timeout);
    }

    return () => clearInterval(interval);
  }, [active]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-slate-200/50 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-200 ease-out shadow-xs"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const GlobalLoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}> = ({ isLoading, message = 'Loading workspace module...', subMessage = 'Please wait while records and interface components are loaded' }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1.5px] z-40 flex items-center justify-center p-4 transition-all duration-200 animate-fadeIn">
      <div className="bg-white/95 border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center space-y-3 transform scale-100 transition-transform">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <Activity className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            <span>{message}</span>
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {subMessage}
          </p>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-600 h-full w-full animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const ModuleLoadingBanner: React.FC<{
  isLoading: boolean;
  message?: string;
}> = ({ isLoading, message = 'Processing request...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed top-14 right-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-2.5 text-xs font-semibold animate-bounce">
      <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      <span>{message}</span>
    </div>
  );
};

export default function LoadingIndicator({ isLoading, message, type = 'overlay' }: LoadingIndicatorProps) {
  return (
    <>
      <TopProgressBar active={isLoading} />
      {type === 'overlay' && <GlobalLoadingOverlay isLoading={isLoading} message={message} />}
      {type === 'toast' && <ModuleLoadingBanner isLoading={isLoading} message={message} />}
    </>
  );
}
