import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { LanBanner } from './components/LanBanner';
import { LicenseModal } from './components/LicenseModal';
import { QrModal } from './components/QrModal';
import { DashboardView } from './views/DashboardView';
import { RubricsView } from './views/RubricsView';
import { IngestionView } from './views/IngestionView';
import { TeacherReviewView } from './views/TeacherReviewView';
import { AnalyticsView } from './views/AnalyticsView';
import { useAppStore } from './store/useAppStore';
import { api } from './services/api';
import { Sparkles, Shield, Wifi } from 'lucide-react';

const queryClient = new QueryClient();

export function AppContent() {
  const { currentView, toasts, removeToast, setLanStatus, setLicenseStatus } = useAppStore();

  useEffect(() => {
    // Initial fetch of LAN status and offline license
    api.getLanStatus().then(setLanStatus).catch(console.error);
    api.getLicenseStatus().then(setLicenseStatus).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gh-slate-950 text-slate-100 font-sans">
      
      {/* Top LAN Network Banner */}
      <LanBanner />

      {/* Main Header & Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'rubrics' && <RubricsView />}
        {currentView === 'ingest' && <IngestionView />}
        {currentView === 'review' && <TeacherReviewView />}
        {currentView === 'analytics' && <AnalyticsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-gh-slate-900/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gh-emerald-400 animate-ping" />
            <span>Ghana Education Service (GES) • Offline LAN Assessment Node v1.0</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Client-Server SQLite WAL Architecture</span>
            <span>•</span>
            <span>ReportLab & Phi-3 Mini Powered</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <LicenseModal />
      <QrModal />

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md cursor-pointer transition transform hover:scale-[1.02] ${
              toast.type === 'success'
                ? 'bg-gh-emerald-950/90 border-gh-emerald-600/50 text-gh-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-600/50 text-red-200'
                : toast.type === 'warning'
                ? 'bg-gh-gold-950/90 border-gh-gold-600/50 text-gh-gold-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            <div className="font-bold text-xs">{toast.title}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">{toast.message}</div>
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
