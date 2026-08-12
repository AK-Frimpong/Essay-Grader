import React from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  FolderArchive, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Check, 
  Download, 
  Users, 
  WifiOff, 
  BookOpen,
  Sliders,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const LandingView: React.FC = () => {
  const { setView, setAuthModalOpen, currentTeacher, lanStatus } = useAppStore();

  const features = [
    {
      icon: GraduationCap,
      title: "WAEC & GES Compliant",
      desc: "Pre-configured marking schemes for BECE (50 pts) and WASSCE (100 pts) across Content, Organization, Expression, and Mechanical Accuracy."
    },
    {
      icon: WifiOff,
      title: "100% Offline Local Engine",
      desc: "Operates completely offline on your PC or school LAN network using local LLM heuristics — zero internet required."
    },
    {
      icon: FileText,
      title: "Handwritten OCR Scanner",
      desc: "Advanced OpenCV image preprocessing filters (denoise, deskew, CLAHE contrast) to digitize handwritten student scripts."
    },
    {
      icon: FolderArchive,
      title: "Bulk Class Ingestion",
      desc: "Ingest ZIP archives or multi-file scripts at once with automatic student index number and name extraction."
    },
    {
      icon: Award,
      title: "Instant PDF Report Cards",
      desc: "Generate printable WAEC-graded PDF report cards with diagnostic feedback and teacher score overrides."
    },
    {
      icon: ShieldCheck,
      title: "Teacher PIN Security",
      desc: "Lock official grades and system settings behind a 4-digit security PIN so students on the LAN cannot alter scores."
    }
  ];

  const standards = [
    {
      title: "WAEC BECE English Language Composition",
      level: "JHS 1 - 3",
      points: "50 Pts",
      criteria: ["Content & Relevance (10 pts)", "Organization & Structure (10 pts)", "Expression & Vocabulary (20 pts)", "Mechanical Accuracy (10 pts)"]
    },
    {
      title: "WASSCE Senior High School Argumentative Essay",
      level: "SHS 1 - 3",
      points: "100 Pts",
      criteria: ["Thesis & Argumentation (25 pts)", "Paragraph Transitions (25 pts)", "Academic Register (25 pts)", "Grammar & Punctuation (25 pts)"]
    }
  ];

  return (
    <div className="space-y-16 animate-in fade-in pb-16">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 md:p-14 shadow-elevated text-center md:text-left">
        <div className="max-w-3xl space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e0f2fe] dark:bg-[#0070f3]/20 border border-[#0070f3]/30 text-[#0070f3] dark:text-sky-300 text-xs font-bold shadow-xs">
            <GraduationCap className="w-4 h-4" />
            <span>Ghana Education Service • Offline Assessment Engine</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Outfit'] leading-tight">
            Grade Handwritten & Typed Essays <span className="text-[#0070f3] dark:text-sky-400">100% Offline</span> for Ghanaian Schools.
          </h1>

          {/* Subtext */}
          <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
            Automated WAEC BECE & WASSCE essay evaluation, optical character recognition for handwritten scripts, and instant PDF report card generation — running on your school host PC or local LAN network.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold bg-[#0070f3] hover:bg-[#005f93] text-white shadow-[0_4px_14px_0_rgba(0,112,243,0.39)] hover:shadow-[0_6px_20px_0_rgba(0,112,243,0.5)] transition-all duration-200"
            >
              <span>Launch Educator App</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition"
            >
              <Users className="w-4 h-4 text-[#0070f3] dark:text-sky-400" />
              <span>{currentTeacher ? `Active: ${currentTeacher.name}` : 'Sign In / Register Teacher'}</span>
            </button>
          </div>

          {/* Offline Assurance Chips */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-gray-500 dark:text-gray-400 pt-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No Internet Needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>WAEC Grade Scale (A1 - F9)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Multi-Student Batch OCR</span>
            </div>
          </div>

        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
            Engineered for Ghanaian Classrooms & Computer Labs
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A comprehensive, private assessment suite tailored for GES teachers, department heads, and examiners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="glass-panel p-6 rounded-2xl space-y-3 hover:border-[#0070f3]/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0070f3]/10 text-[#0070f3] dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curriculum Standards Preview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              Pre-Configured WAEC Marking Schemes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Standard criteria for Junior & Senior High Compositions</p>
          </div>

          <button
            onClick={() => setView('rubrics')}
            className="text-sm font-semibold text-[#0070f3] dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All Rubrics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {standards.map((s, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs">
                    {s.level}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 font-['Outfit']">{s.title}</h3>
                </div>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-700/40">
                  {s.points}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                {s.criteria.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <Check className="w-3.5 h-3.5 text-[#0070f3] shrink-0" />
                    <span className="truncate">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Launch Callout Banner */}
      <div className="glass-panel p-8 md:p-10 rounded-3xl text-center space-y-4">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
          Ready to Start Marking Class Submissions?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Access student rosters, upload single or batch handwritten scans, adjust criterion scores, and export report cards.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setView('dashboard')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold bg-[#0070f3] hover:bg-[#005f93] text-white shadow-[0_4px_14px_0_rgba(0,112,243,0.39)] transition"
          >
            <span>Open Teacher Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
