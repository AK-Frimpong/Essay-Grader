import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  ClipboardCheck,
  BarChart3,
  GraduationCap,
  Sun,
  Moon,
  Coins,
  UserCircle2,
  QrCode,
  Lock,
  Unlock,
  Wifi,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'rubrics', label: 'Rubrics', icon: BookOpen },
  { id: 'ingest', label: 'Upload & OCR', icon: Upload },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    currentView,
    setView,
    licenseStatus,
    currentTeacher,
    setAuthModalOpen,
    setLicenseModalOpen,
    setQrModalOpen,
    setPinModalOpen,
    isTeacherAuthenticated,
    lanStatus,
  } = useAppStore();

  const initials = (currentTeacher?.name || 'T')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 transition-colors">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-ink-200 dark:border-ink-700">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-semibold text-ink-900 dark:text-white text-[15px] tracking-tight">
            Essay Grader
          </div>
          <div className="text-[11px] text-ink-400 dark:text-ink-500">Offline Assessment</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="nav-section">Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`nav-link w-full ${active ? 'nav-link-active' : ''}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg bg-ink-100 dark:bg-ink-700/50 px-3 py-2 text-xs text-ink-500 dark:text-ink-400">
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          <span className="truncate">
            {lanStatus?.host_ip ? `LAN ${lanStatus.host_ip}` : 'Local engine'}
          </span>
        </div>
      </div>

      {/* Footer / user */}
      <div className="border-t border-ink-200 dark:border-ink-700 p-3 space-y-2">
        <button
          onClick={() => setAuthModalOpen(true, 'login')}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-100 dark:hover:bg-ink-700/60 transition"
        >
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink-800 dark:text-ink-100 truncate">
              {currentTeacher?.name || 'Teacher'}
            </div>
            <div className="text-[11px] text-ink-400 dark:text-ink-500 truncate">
              {currentTeacher?.school || 'Sign in'}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLicenseModalOpen(true)}
            className="badge badge-soft flex-1 justify-center hover:bg-ink-200 dark:hover:bg-ink-700"
            title="Grading credits"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{licenseStatus?.remaining_credits ?? 498}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/60 transition"
            title={`Theme: ${theme}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setQrModalOpen(true)}
            className="p-2 rounded-lg text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/60 transition"
            title="LAN QR code"
          >
            <QrCode className="w-4 h-4 text-amber-500" />
          </button>
          <button
            onClick={() => setPinModalOpen(true, isTeacherAuthenticated ? 'change' : 'verify')}
            className="p-2 rounded-lg text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/60 transition"
            title="Teacher PIN"
          >
            {isTeacherAuthenticated ? <Unlock className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
