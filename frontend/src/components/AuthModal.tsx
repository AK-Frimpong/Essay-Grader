import React, { useState } from 'react';
import { X, UserCheck, UserPlus, Lock, GraduationCap, Building, Mail, ShieldCheck, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { useAppStore, TeacherProfile } from '../store/useAppStore';
import { api } from '../services/api';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setAuthModalOpen, 
    authModalMode, 
    isTeacherAuthenticated,
    currentTeacher,
    registeredTeachers,
    setCurrentTeacher, 
    addRegisteredTeacher,
    setTeacherPin,
    setView, 
    addToast 
  } = useAppStore();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode || 'login');

  // Seed sample profiles to provide initial accounts
  const seedProfiles: TeacherProfile[] = [
    {
      id: 'tch-001',
      name: 'Mr. Kofi Mensah',
      email: 'kofi.mensah@achimotajhs.edu.gh',
      school: 'Achimota Basic School / JHS',
      subject: 'English Language',
      staff_id: 'GES-2026-9812',
      pin: '1234'
    },
    {
      id: 'tch-002',
      name: 'Mrs. Abena Appiah',
      email: 'a.appiah@presec.edu.gh',
      school: 'PRESEC Legon / SHS',
      subject: 'English Literature',
      staff_id: 'GES-2026-4410',
      pin: '5678'
    }
  ];

  // Combine user registered accounts with seed profiles without duplicates
  const availableAccounts: TeacherProfile[] = [
    ...registeredTeachers,
    ...seedProfiles.filter(sp => !registeredTeachers.some(rt => rt.id === sp.id || rt.email.toLowerCase() === sp.email.toLowerCase()))
  ];

  // Selected Account state
  const [selectedProfile, setSelectedProfile] = useState<TeacherProfile | null>(availableAccounts[0] || null);
  const [emailOrStaffId, setEmailOrStaffId] = useState(availableAccounts[0]?.staff_id || availableAccounts[0]?.email || '');
  const [loginPin, setLoginPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Register Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState('');
  const [school, setSchool] = useState('Achimota Basic School / JHS');
  const [subject, setSubject] = useState('English Language');
  const [signupPin, setSignupPin] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSelectProfileInList = (profile: TeacherProfile) => {
    setSelectedProfile(profile);
    setEmailOrStaffId(profile.staff_id || profile.email);
    setLoginPin('');
    setPinError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!emailOrStaffId.trim()) {
      setPinError('Please enter your Staff ID or Email Address.');
      return;
    }

    if (!loginPin.trim() || loginPin.length < 4) {
      setPinError('Please enter your 4-Digit Security PIN.');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. Locate the target account
      const targetProfile = selectedProfile || availableAccounts.find(p => 
        p.email.toLowerCase() === emailOrStaffId.trim().toLowerCase() ||
        p.staff_id?.toLowerCase() === emailOrStaffId.trim().toLowerCase()
      );

      // 2. Validate PIN against the unique PIN set for that account
      if (targetProfile && targetProfile.pin) {
        if (loginPin.trim() !== targetProfile.pin) {
          setPinError(`Incorrect Security PIN for ${targetProfile.name}. Please enter your account's unique 4-digit PIN.`);
          setIsVerifying(false);
          return;
        }
      } else {
        // Backend PIN Verification fallback for legacy backend PIN
        const result = await api.verifyPin(loginPin.trim());
        if (!result.valid) {
          setPinError('Incorrect Teacher Security PIN. Access denied.');
          setIsVerifying(false);
          return;
        }
      }

      const activeProfile: TeacherProfile = targetProfile || {
        id: `tch-${Date.now()}`,
        name: emailOrStaffId.includes('@') ? emailOrStaffId.split('@')[0].replace(/[._-]/g, ' ').toUpperCase() : 'Teacher Profile',
        email: emailOrStaffId.includes('@') ? emailOrStaffId : `${emailOrStaffId}@ges.edu.gh`,
        school: 'Ghana Education Service Node',
        subject: 'English Language',
        staff_id: emailOrStaffId,
        pin: loginPin.trim()
      };

      // Save PIN and active teacher session
      setTeacherPin(loginPin.trim());
      setCurrentTeacher(activeProfile);

      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Logged in as ${activeProfile.name} (${activeProfile.school}).`
      });

      setAuthModalOpen(false);
      setView('dashboard');
    } catch (err: any) {
      setPinError(err.message || 'Invalid 4-Digit Security PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!name.trim() || !email.trim()) {
      addToast({ type: 'warning', title: 'Missing Details', message: 'Please provide your name and email address.' });
      return;
    }
    if (!signupPin.trim() || signupPin.length < 4) {
      setPinError('Please set a unique 4-Digit Security PIN for your account.');
      return;
    }

    const newProfile: TeacherProfile = {
      id: `tch-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      school: school.trim() || 'Ghanaian Basic / Senior High School',
      subject: subject.trim() || 'English Language',
      staff_id: staffId.trim() || `GES-${Math.floor(1000 + Math.random() * 9000)}`,
      pin: signupPin.trim()
    };

    // Store custom registered profile into persistent local state
    addRegisteredTeacher(newProfile);
    setTeacherPin(signupPin.trim());
    setCurrentTeacher(newProfile);

    addToast({
      type: 'success',
      title: 'Teacher Profile Registered',
      message: `Registered ${newProfile.name} with unique Security PIN.`
    });

    setAuthModalOpen(false);
    setView('dashboard');
  };

  const handleClose = () => {
    if (isTeacherAuthenticated) {
      setAuthModalOpen(false);
    } else {
      addToast({ type: 'warning', title: 'Sign In Required', message: 'Please verify your PIN to access the workspace.' });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && isTeacherAuthenticated) {
          setAuthModalOpen(false);
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-elevated overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0070f3] flex items-center justify-center shadow-[0_4px_14px_0_rgba(0,112,243,0.39)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight font-['Outfit'] uppercase">
                {mode === 'login' ? 'Teacher Sign In' : 'Create Teacher Profile'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Offline School Node • GES Grader</p>
            </div>
          </div>

          {isTeacherAuthenticated && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-1">
          <button
            onClick={() => { setMode('login'); setPinError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'login'
                ? 'bg-white dark:bg-gray-700 text-[#0070f3] dark:text-sky-300 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setMode('signup'); setPinError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'signup'
                ? 'bg-white dark:bg-gray-700 text-[#0070f3] dark:text-sky-300 shadow-xs'
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
              {/* Registered Accounts List */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Select Registered Account
                </label>

                {availableAccounts.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableAccounts.map((p) => {
                      const isSelected = selectedProfile?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProfileInList(p)}
                          className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-[#0070f3] dark:border-sky-500 bg-blue-50/50 dark:bg-sky-950/40 ring-1 ring-[#0070f3]/40'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div>
                            <div className={`font-semibold text-sm ${isSelected ? 'text-[#0070f3] dark:text-sky-300' : 'text-gray-900 dark:text-white'}`}>
                              {p.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{p.school} • {p.subject}</div>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-[#0070f3] dark:text-sky-400 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-gray-400 opacity-60 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 text-center space-y-1.5">
                    <User className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No Teacher Account Registered</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Register your profile in the tab above to set up your unique credentials on this node.
                    </p>
                  </div>
                )}
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Staff ID or School Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={emailOrStaffId}
                      onChange={(e) => setEmailOrStaffId(e.target.value)}
                      placeholder="e.g. GES-2026-9812 or teacher@school.edu.gh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    4-Digit Security PIN <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={loginPin}
                      onChange={(e) => { setLoginPin(e.target.value); setPinError(null); }}
                      placeholder="••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none tracking-widest"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>

                {/* Error Banner */}
                {pinError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0070f3] hover:bg-[#005f93] text-white shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isVerifying ? 'Verifying PIN...' : `Verify PIN & Enter Workspace`}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Sign Up / Register Profile Form */
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mr. Emmanuel Osei"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. e.osei@ges.edu.gh"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none"
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
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none"
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
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Set 4-Digit Security PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={signupPin}
                    onChange={(e) => setSignupPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0070f3] outline-none tracking-widest"
                  />
                </div>
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0070f3] hover:bg-[#005f93] text-white shadow-sm transition"
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
