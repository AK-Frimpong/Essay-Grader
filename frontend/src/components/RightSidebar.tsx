import React from 'react';
import { 
  X, 
  Layers, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  BarChart3, 
  QrCode, 
  Coins, 
  Sun, 
  Moon, 
  Lock, 
  Unlock, 
  ChevronRight,
  GraduationCap,
  Sliders
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const RightSidebar: React.FC = () => {
  const { 
    isRightSidebarOpen, 
    setRightSidebarOpen,
    currentView,
    setView,
    lanStatus,
    licenseStatus,
    theme,
    toggleTheme,
    isTeacherAuthenticated,
    setPinModalOpen,
    setLicenseModalOpen,
    setQrModalOpen
  } = useAppStore();

  if (!isRightSidebarOpen) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Class summary & grade breakdown', icon: Layers },
    { id: 'rubrics', label: 'Rubrics & Standards', desc: 'BECE / WASSCE marking schemes', icon: BookOpen },
    { id: 'ingest', label: 'Upload & OCR', desc: 'Scan & digitize student essays', icon: FileText },
    { id: 'review', label: 'Review & Approve', desc: 'Inspect, edit, and approve grades', icon: CheckSquare },
    { id: 'analytics', label: 'Analytics & Export', desc: 'Generate PDF report cards & CSVs', icon: BarChart3 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => setRightSidebarOpen(false)}
      />

      {/* Slide-over Panel (Appears on the Left) */}
      <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[380px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-elevated flex flex-col animate-slide-in-left">
        
        {/* Top Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0070f3] flex items-center justify-center shadow-[0_4px_14px_0_rgba(0,112,243,0.39)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white tracking-tight font-['Outfit']">
                Workspace Navigation
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Offline Node • Classroom Tools</p>
            </div>
          </div>

          <button 
            onClick={() => setRightSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* View Switcher Section */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2.5">
              Navigation
            </h4>
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id as any);
                      setRightSidebarOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition ${
                      isActive
                        ? 'bg-[#e0f2fe] dark:bg-[#0070f3]/25 border border-[#0070f3]/40 text-[#0070f3] dark:text-sky-300 font-semibold shadow-[0_0_12px_rgba(0,112,243,0.2)]'
                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-[#0070f3]/15 text-[#0070f3] dark:text-sky-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-gray-400">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick System Actions */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2.5">
              System Tools
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              {/* LAN IP & QR Code */}
              <button
                onClick={() => {
                  setRightSidebarOpen(false);
                  setQrModalOpen(true);
                }}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left hover:border-primary-400 transition"
              >
                <QrCode className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">LAN QR</div>
                <div className="text-xs text-primary-600 dark:text-primary-400 font-mono mt-0.5 truncate">
                  {lanStatus?.host_ip || '10.133.152.150'}
                </div>
              </button>

              {/* Credits */}
              <button
                onClick={() => {
                  setRightSidebarOpen(false);
                  setLicenseModalOpen(true);
                }}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left hover:border-amber-400 transition"
              >
                <Coins className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Credits</div>
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                  {licenseStatus?.remaining_credits ?? 498} Remaining
                </div>
              </button>

              {/* Theme Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left hover:border-primary-400 transition"
              >
                {theme === 'dark' ? <Moon className="w-4 h-4 text-primary-400 mb-1" /> : <Sun className="w-4 h-4 text-amber-500 mb-1" />}
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Theme</div>
                <div className="text-xs text-gray-400 uppercase font-medium mt-0.5">{theme}</div>
              </button>

              {/* Teacher Lock / Unlock PIN */}
              <button
                onClick={() => {
                  setRightSidebarOpen(false);
                  setPinModalOpen(true, isTeacherAuthenticated ? 'change' : 'verify');
                }}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left hover:border-green-400 transition"
              >
                {isTeacherAuthenticated ? <Unlock className="w-4 h-4 text-green-500 mb-1" /> : <Lock className="w-4 h-4 text-gray-400 mb-1" />}
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Teacher Lock</div>
                <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-0.5">
                  {isTeacherAuthenticated ? 'Unlocked' : 'PIN Required'}
                </div>
              </button>
            </div>
          </div>

          {/* Node Hardware Diagnostics */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm space-y-2">
            <div className="font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>Node Status</span>
              <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-mono">ONLINE</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>OCR: <span className="font-medium text-green-600 dark:text-green-400">Ready</span></div>
              <div>Database: <span className="font-medium text-gray-700 dark:text-gray-200">SQLite WAL Engine</span></div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};
