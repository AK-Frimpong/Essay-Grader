import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, KeyRound, Check, AlertCircle, RefreshCw, Delete } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';

export const PinAuthModal: React.FC = () => {
  const { 
    isPinModalOpen, 
    setPinModalOpen, 
    pinModalMode, 
    setTeacherPin, 
    teacherPin, 
    isTeacherAuthenticated,
    logoutTeacher,
    addToast 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'verify' | 'change'>(pinModalMode);
  const [enteredPin, setEnteredPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setActiveTab(pinModalMode);
    setEnteredPin('');
    setCurrentPin('');
    setNewPin('');
    setErrorMsg('');
  }, [isPinModalOpen, pinModalMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPinModalOpen) return;
      if (e.key >= '0' && e.key <= '9') {
        if (activeTab === 'verify') {
          if (enteredPin.length < 10) setEnteredPin(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        if (activeTab === 'verify') {
          setEnteredPin(prev => prev.slice(0, -1));
        }
      } else if (e.key === 'Enter') {
        if (activeTab === 'verify' && enteredPin.length >= 4) {
          handleVerify();
        }
      } else if (e.key === 'Escape') {
        setPinModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinModalOpen, activeTab, enteredPin]);

  if (!isPinModalOpen) return null;

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleKeypadPress = (val: string) => {
    setErrorMsg('');
    if (val === 'DEL') {
      setEnteredPin(prev => prev.slice(0, -1));
    } else if (val === 'CLR') {
      setEnteredPin('');
    } else {
      if (enteredPin.length < 10) {
        setEnteredPin(prev => prev + val);
      }
    }
  };

  const handleVerify = async () => {
    if (enteredPin.length < 4) {
      triggerError('PIN must be at least 4 digits');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.verifyPin(enteredPin);
      if (res.valid) {
        setTeacherPin(enteredPin);
        addToast({
          type: 'success',
          title: 'Teacher Access Unlocked',
          message: 'Administrative endpoints and grade approvals authorized.'
        });
        setPinModalOpen(false);
      } else {
        triggerError('Invalid Security PIN');
      }
    } catch (err: any) {
      triggerError(err.message || 'Invalid Teacher Security PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin || newPin.length < 4) {
      triggerError('New PIN must be at least 4 digits.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.changePin(currentPin, newPin);
      if (res.success) {
        setTeacherPin(newPin);
        addToast({
          type: 'success',
          title: 'Teacher PIN Updated',
          message: 'Security PIN changed successfully.'
        });
        setPinModalOpen(false);
      }
    } catch (err: any) {
      triggerError(err.message || 'Failed to change Teacher PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
    >
      <div className={`glass-panel relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-transform ${shake ? 'animate-bounce' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-primary-600 dark:text-primary-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pin-modal-title" className="font-bold text-slate-900 dark:text-white text-base">Teacher Access Control</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ghana LAN Classroom Administrative Security</p>
            </div>
          </div>
          <button
            onClick={() => setPinModalOpen(false)}
            aria-label="Close PIN security modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <button
            onClick={() => { setActiveTab('verify'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
              activeTab === 'verify'
                ? 'border-primary-600 dark:border-emerald-400 text-primary-600 dark:text-emerald-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Verify Security PIN
          </button>
          <button
            onClick={() => { setActiveTab('change'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
              activeTab === 'change'
                ? 'border-primary-600 dark:border-emerald-400 text-primary-600 dark:text-emerald-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Change Teacher PIN
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'verify' ? (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  Enter Teacher 4-digit PIN to perform restricted actions <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(Default: 1234)</span>
                </p>

                {/* PIN Masked Dots / Number Boxes */}
                <div className="flex justify-center items-center gap-3 py-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const hasDigit = enteredPin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                          hasDigit
                            ? 'border-primary-600 dark:border-emerald-400 bg-sky-50 dark:bg-emerald-950/50 text-primary-600 dark:text-emerald-300 shadow-md scale-105'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-400'
                        }`}
                      >
                        {hasDigit ? '•' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleKeypadPress(val)}
                    disabled={isLoading}
                    className={`py-3 rounded-xl font-mono text-base font-bold transition active:scale-95 flex items-center justify-center ${
                      val === 'CLR'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 text-xs font-sans'
                        : val === 'DEL'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 text-xs font-sans'
                        : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 shadow-sm'
                    }`}
                  >
                    {val === 'DEL' ? <Delete className="w-4 h-4" /> : val}
                  </button>
                ))}
              </div>

              {/* Submit & Lock Controls */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleVerify}
                  disabled={isLoading || enteredPin.length < 4}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-[#005f93] hover:to-emerald-500 text-white shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Unlock Teacher Mode</span>
                    </>
                  )}
                </button>

                {isTeacherAuthenticated && (
                  <button
                    onClick={() => {
                      logoutTeacher();
                      setPinModalOpen(false);
                      addToast({ type: 'info', title: 'Locked', message: 'Teacher session locked.' });
                    }}
                    className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
                  >
                    Lock Active Teacher Session
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Teacher PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Enter current PIN (e.g. 1234)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                  <KeyRound className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New 4-Digit Teacher PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new 4-digit PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                  <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !currentPin || newPin.length < 4}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save New PIN</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            🔒 Protected by SHA-256 Hashed SQLite WAL Persistence
          </p>
        </div>

      </div>
    </div>
  );
};
