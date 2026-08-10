import React from 'react';
import { 
  BookOpen, 
  FileText, 
  CheckSquare, 
  BarChart3, 
  Layers, 
  Wifi, 
  WifiOff, 
  KeyRound, 
  QrCode, 
  Coins, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Navbar: React.FC = () => {
  const { 
    theme,
    toggleTheme,
    currentView, 
    setView, 
    licenseStatus, 
    lanStatus, 
    isOfflineMode, 
    toggleOfflineMode,
    setLicenseModalOpen,
    setQrModalOpen 
  } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'rubrics', label: 'Rubrics & Standards', icon: BookOpen },
    { id: 'ingest', label: 'Ingest & OCR Workspace', icon: FileText },
    { id: 'review', label: 'Teacher Review Panel', icon: CheckSquare },
    { id: 'analytics', label: 'Analytics & Export', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-gh-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & School Header */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gh-emerald-600 via-gh-emerald-500 to-gh-gold-500 p-0.5 shadow-glow-emerald flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-gh-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gh-gold-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-['Outfit']">
                  OFFLINE ESSAY GRADER
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-gh-emerald-900/80 text-emerald-800 dark:text-gh-emerald-300 border border-emerald-300 dark:border-gh-emerald-600/40">
                  GH-LAN v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ghana Education Service • Local AI Node</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-gh-emerald-600/20 text-emerald-700 dark:text-gh-emerald-300 border border-emerald-300 dark:border-gh-emerald-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-gh-emerald-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets: LAN Host IP, Credits, License */}
          <div className="flex items-center gap-2.5">
            
            {/* LAN Host Badge with QR trigger */}
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 text-slate-200 border border-slate-700/80 hover:bg-slate-700/80 hover:border-slate-600 transition"
              title="Click to view QR code for mobile connection on school Wi-Fi"
            >
              <QrCode className="w-3.5 h-3.5 text-gh-gold-400" />
              <span className="hidden sm:inline text-slate-400">LAN:</span>
              <span className="text-gh-emerald-400 font-mono">{lanStatus?.host_ip || '192.168.1.105'}:8000</span>
            </button>

            {/* Offline Credits Badge */}
            <button
              onClick={() => setLicenseModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-gh-gold-600/20 to-gh-emerald-600/20 text-gh-gold-300 border border-gh-gold-500/40 hover:bg-gh-gold-600/30 transition shadow-sm"
              title="Remaining offline evaluation credits & licensing"
            >
              <Coins className="w-3.5 h-3.5 text-gh-gold-400" />
              <span>{licenseStatus?.remaining_credits ?? 498}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Credits</span>
            </button>

            {/* Theme Toggle Button (Light / Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-300 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Offline Mode Indicator */}
            <button
              onClick={toggleOfflineMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                isOfflineMode
                  ? 'bg-emerald-50 dark:bg-gh-emerald-950/70 text-gh-emerald-700 dark:text-gh-emerald-400 border-gh-emerald-300 dark:border-gh-emerald-700/50'
                  : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/50'
              }`}
              title="Toggle LAN-only offline mode vs online top-up mode"
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-gh-emerald-600 dark:text-gh-emerald-400" />
                  <span className="hidden sm:inline">Offline LAN</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">WAN Mode</span>
                </>
              )}
            </button>

            {/* License Management Button */}
            <button
              onClick={() => setLicenseModalOpen(true)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition"
              title="Offline RSA License & Hardware Signature"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
