import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { LanBanner } from './components/LanBanner';
import { LicenseModal } from './components/LicenseModal';
import { QrModal } from './components/QrModal';
import { PinAuthModal } from './components/PinAuthModal';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { RubricsView } from './views/RubricsView';
import { IngestionView } from './views/IngestionView';
import { TeacherReviewView } from './views/TeacherReviewView';
import { AnalyticsView } from './views/AnalyticsView';
import { AuthModal } from './components/AuthModal';
import { useAppStore } from './store/useAppStore';
import { api } from './services/api';

import { RightSidebar } from './components/RightSidebar';
import { X } from 'lucide-react';

const queryClient = new QueryClient();

export function AppContent() {
  const { currentView, toasts, removeToast, setLanStatus, setLicenseStatus } = useAppStore();

  useEffect(() => {
    // Initial fetch of LAN status and offline license
    api.getLanStatus().then(setLanStatus).catch(console.error);
    api.getLicenseStatus().then(setLicenseStatus).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-gray-900 text-zinc-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Top LAN Network Banner */}
      <LanBanner />

      {/* Main Header & Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {currentView === 'landing' && <LandingView />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'rubrics' && <RubricsView />}
        {currentView === 'ingest' && <IngestionView />}
        {currentView === 'review' && <TeacherReviewView />}
        {currentView === 'analytics' && <AnalyticsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-5 text-xs text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Essay Grader • Offline Assessment Tool</span>
          <span className="text-gray-400 dark:text-gray-500">Designed for Ghana Education Service</span>
        </div>
      </footer>

      {/* Global Modals & Right Sidebar Drawer */}
      <LicenseModal />
      <QrModal />
      <PinAuthModal />
      <AuthModal />
      <RightSidebar />

      {/* Toast Notification Container with Auto-Dismiss & Fade */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`p-4 rounded-xl shadow-elevated border cursor-pointer pointer-events-auto transition transform animate-in slide-in-from-bottom-5 duration-200 hover:scale-[1.02] flex items-start justify-between gap-3 ${
              toast.type === 'success'
                ? 'bg-green-50 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                : toast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            <div>
              <div className="font-semibold text-sm">{toast.title}</div>
              <div className="text-xs mt-0.5 opacity-80">{toast.message}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition shrink-0"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
