import React, { useState } from 'react';
import { X, UserCheck, UserPlus, Lock, GraduationCap, Building, BookOpen, Mail, ShieldCheck } from 'lucide-react';
import { useAppStore, TeacherProfile } from '../store/useAppStore';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setAuthModalOpen, 
    authModalMode, 
    setCurrentTeacher, 
    setView, 
    addToast 
  } = useAppStore();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode || 'login');

  // Login form state
  const [emailOrStaffId, setEmailOrStaffId] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Sign Up form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState('');
  const [school, setSchool] = useState('Achimota Basic School / JHS');
  const [subject, setSubject] = useState('English Language');
  const [signupPin, setSignupPin] = useState('');

  if (!isAuthModalOpen) return null;

  // Preset sample profiles for fast offline selection
  const sampleProfiles: TeacherProfile[] = [
    {
      id: 'tch-001',
      name: 'Mr. Kofi Mensah',
      email: 'kofi.mensah@achimotajhs.edu.gh',
      school: 'Achimota Basic School / JHS',
      subject: 'English Language',
      staff_id: 'GES-2026-9812'
    },
    {
      id: 'tch-002',
      name: 'Mrs. Abena Appiah',
      email: 'a.appiah@presec.edu.gh',
      school: 'PRESEC Legon / SHS',
      subject: 'English Literature',
      staff_id: 'GES-2026-4410'
    }
  ];

  const handleSelectProfile = (profile: TeacherProfile) => {
    setCurrentTeacher(profile);
    addToast({
      type: 'success',
      title: 'Teacher Profile Active',
      message: `Logged in as ${profile.name} (${profile.school}).`
    });
    setAuthModalOpen(false);
    setView('dashboard');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrStaffId.trim()) {
      addToast({ type: 'warning', title: 'Input Required', message: 'Please enter your Staff ID or Email.' });
      return;
    }

    const matched = sampleProfiles.find(p => 
      p.email.toLowerCase() === emailOrStaffId.trim().toLowerCase() ||
      p.staff_id?.toLowerCase() === emailOrStaffId.trim().toLowerCase()
    ) || {
      id: `tch-${Date.now()}`,
      name: emailOrStaffId.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
      email: emailOrStaffId.includes('@') ? emailOrStaffId : `${emailOrStaffId}@ges.edu.gh`,
      school: 'Ghana Education Service Node',
      subject: 'English & General Studies',
      staff_id: emailOrStaffId.includes('@') ? 'GES-NODE-2026' : emailOrStaffId
    };

    handleSelectProfile(matched);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast({ type: 'warning', title: 'Missing Details', message: 'Please provide teacher name and email/ID.' });
      return;
    }

    const newProfile: TeacherProfile = {
      id: `tch-${Date.now()}`,
      name,
      email,
      school: school || 'Ghanaian Basic / Senior High School',
      subject: subject || 'English Language',
      staff_id: staffId || `GES-${Math.floor(1000 + Math.random() * 9000)}`
    };

    handleSelectProfile(newProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-elevated overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight font-display uppercase">
                {mode === 'login' ? 'Teacher Sign In' : 'Create Teacher Profile'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Offline School Node • GES Grader</p>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'login'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'signup'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Profile</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {mode === 'login' ? (
            <>
              {/* Preset Quick Profile Switcher */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Quick Offline Profiles
                </label>
                <div className="space-y-2">
                  {sampleProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-primary-600 dark:hover:border-sky-500 text-left transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.school} • {p.subject}</div>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-300 opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase tracking-wider">or sign in with ID</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Staff ID or School Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={emailOrStaffId}
                      onChange={(e) => setEmailOrStaffId(e.target.value)}
                      placeholder="e.g. GES-2026-9812 or teacher@school.edu.gh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    4-Digit Security PIN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none tracking-widest"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition"
                  >
                    Enter Workspace
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Sign Up / Register Profile Form */
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mr. Emmanuel Osei"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. e.osei@ges.edu.gh"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GES Staff ID
                  </label>
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g. GES-2026-104"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Achimota Basic School / JHS"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none"
                  />
                  <Building className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="English Language"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    4-Digit Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={signupPin}
                    onChange={(e) => setSignupPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none tracking-widest"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition"
                >
                  Register Profile & Launch
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
