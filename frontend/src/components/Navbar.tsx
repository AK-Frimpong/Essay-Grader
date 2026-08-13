import React from 'react';
import { 
  BookOpen, 
  FileText, 
  CheckSquare, 
  BarChart3, 
  Layers, 
  Coins, 
  GraduationCap,
  Sun,
  Moon,
  Lock,
  Unlock,
  PanelRight,
  Menu
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Navbar: React.FC = () => {
  const { 
    theme,
    toggleTheme,
    currentView, 
    setView, 
    licenseStatus, 
    isTeacherAuthenticated,
    currentTeacher,
    setAuthModalOpen,
    setLicenseModalOpen,
    setRightSidebarOpen
  } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'rubrics', label: 'Rubrics', icon: BookOpen },
    { id: 'ingest', label: 'Upload & OCR', icon: FileText },
    { id: 'review', label: 'Review', icon: CheckSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & App Name (Matching PROSBEE Brand Style) */}
          <div 
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => setRightSidebarOpen(true, 'chat')}
            title="Open workspace navigation"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0070f3] flex items-center justify-center shadow-[0_4px_14px_0_rgba(0,112,243,0.39)] group-hover:scale-105 group-hover:shadow-[0_6px_20px_0_rgba(0,112,243,0.5)] transition-all duration-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white uppercase tracking-wider font-['Outfit'] group-hover:text-[#0070f3] dark:group-hover:text-sky-400 transition-colors">
              ESSAY GRADER
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[#e0f2fe] dark:bg-[#0070f3]/25 text-[#0070f3] dark:text-sky-300 font-bold shadow-[0_0_12px_rgba(0,112,243,0.25)] ring-1 ring-[#0070f3]/30'
                      : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0070f3] dark:text-sky-300' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Credits */}
            <button
              onClick={() => setLicenseModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
              title="Remaining grading credits"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{licenseStatus?.remaining_credits ?? 498}</span>
            </button>

            {/* Active Teacher Profile Badge */}
            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-900/30 text-[#0070f3] dark:text-sky-300 border border-[#0070f3]/30 hover:bg-[#e0f2fe] transition"
              title="Switch teacher profile or register"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="max-w-[120px] truncate">{currentTeacher?.name || 'Teacher Profile'}</span>
            </button>

            {/* Sidebar Trigger - Hamburger Icon */}
            <button
              onClick={() => setRightSidebarOpen(true, 'nav')}
              className="p-2.5 rounded-lg text-white bg-[#0070f3] hover:bg-[#005f93] transition shadow-sm flex items-center justify-center"
              title="Open navigation menu"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
