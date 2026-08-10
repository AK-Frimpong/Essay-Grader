import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Sliders, 
  Award, 
  FileDown, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  FileText, 
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Essay, Grade, CriterionScore, GrammarHighlight } from '../types';
import { useAppStore } from '../store/useAppStore';

export const TeacherReviewView: React.FC = () => {
  const { selectedEssayId, setView, addToast } = useAppStore();
  
  const [essayList, setEssayList] = useState<Essay[]>([]);
  const [activeEssayId, setActiveEssayId] = useState<string>(selectedEssayId || 'essay-stu-001');
  const [essay, setEssay] = useState<Essay | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Teacher Overrides State
  const [criteriaOverrides, setCriteriaOverrides] = useState<CriterionScore[]>([]);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('Mr. K. Osei-Tutu (Senior English Tutor)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load essays list for dropdown selector
  useEffect(() => {
    api.getEssays().then(setEssayList).catch(console.error);
  }, []);

  // Load active essay review workspace
  useEffect(() => {
    if (!activeEssayId) return;
    setLoading(true);
    api.getReviewWorkspace(activeEssayId)
      .then((data) => {
        setEssay(data.essay);
        setGrade(data.grade || null);
        setAuditHistory(data.audit_history || []);

        if (data.grade) {
          // Initialize overrides from existing grade or AI evaluation
          const existingScores = data.grade.final_criteria_scores_json || 
                                 data.grade.ai_evaluation_json?.criteria_scores || [];
          setCriteriaOverrides(existingScores.map((c) => ({
            ...c,
            teacher_score: c.teacher_score !== undefined && c.teacher_score !== null ? c.teacher_score : c.ai_score
          })));
          setTeacherFeedback(data.grade.teacher_feedback || 'Well-argued presentation aligned with WAEC curriculum standards.');
          setApprovedBy(data.grade.approved_by || 'Senior Examiner');
        } else {
          setCriteriaOverrides([]);
        }
      })
      .catch((err) => {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      })
      .finally(() => setLoading(false));
  }, [activeEssayId]);

  // Compute live overridden score and WAEC grade
  const totalPoints = criteriaOverrides.reduce((acc, c) => acc + Number(c.max_score || 0), 0) || 100;
  const currentTotal = criteriaOverrides.reduce((acc, c) => acc + Number(c.teacher_score !== undefined ? c.teacher_score : c.ai_score), 0);
  const currentPercentage = totalPoints > 0 ? (currentTotal / totalPoints) * 100 : 0;

  const getWaecGradeBadge = (pct: number) => {
    if (pct >= 80) return { grade: 'A1', label: 'Excellent', color: 'bg-gh-emerald-950 text-gh-emerald-300 border-gh-emerald-600/40' };
    if (pct >= 70) return { grade: 'B2', label: 'Very Good', color: 'bg-emerald-950 text-emerald-300 border-emerald-600/40' };
    if (pct >= 65) return { grade: 'B3', label: 'Good', color: 'bg-blue-950 text-blue-300 border-blue-600/40' };
    if (pct >= 60) return { grade: 'C4', label: 'Credit', color: 'bg-cyan-950 text-cyan-300 border-cyan-600/40' };
    if (pct >= 55) return { grade: 'C5', label: 'Credit', color: 'bg-indigo-950 text-indigo-300 border-indigo-600/40' };
    if (pct >= 50) return { grade: 'C6', label: 'Credit', color: 'bg-yellow-950 text-yellow-300 border-yellow-600/40' };
    if (pct >= 45) return { grade: 'D7', label: 'Pass', color: 'bg-orange-950 text-orange-300 border-orange-600/40' };
    if (pct >= 40) return { grade: 'E8', label: 'Weak Pass', color: 'bg-red-950 text-red-300 border-red-600/40' };
    return { grade: 'F9', label: 'Fail', color: 'bg-red-950 text-red-400 border-red-700/40' };
  };

  const waecBadge = getWaecGradeBadge(currentPercentage);

  const handleScoreSliderChange = (idx: number, newScore: number) => {
    const updated = [...criteriaOverrides];
    updated[idx].teacher_score = newScore;
    setCriteriaOverrides(updated);
  };

  const handleApproveAndLock = async (lockGrade: boolean = true) => {
    if (!essay) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitTeacherReview({
        essay_id: essay.id,
        criteria_overrides: criteriaOverrides,
        teacher_feedback: teacherFeedback,
        teacher_override_reason: overrideReason,
        approved_by: approvedBy,
        lock_grade: lockGrade
      });
      setGrade(res);
      addToast({
        type: 'success',
        title: lockGrade ? 'Grade Locked & PDF Generated!' : 'Review Saved',
        message: `Final Score: ${res.overall_score}/${res.max_overall_score} (${res.letter_grade})`
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Approval Error', message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = grade?.is_approved || essay?.status === 'APPROVED' || essay?.status === 'LOCKED';

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Top Header & Essay Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-600 dark:text-gh-gold-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              Teacher-In-The-Loop Review Station
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-0.5">
            Audit AI criterion scores, adjust numerical sliders, provide customized feedback, and lock final WAEC grades.
          </p>
        </div>

        {/* Essay Dropdown Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold hidden sm:inline">Active Essay:</label>
          <select
            value={activeEssayId}
            onChange={(e) => setActiveEssayId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-emerald-700 dark:text-gh-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {essayList.map((ess) => (
              <option key={ess.id} value={ess.id}>
                {ess.student_name} ({ess.student_id}) - {ess.title.slice(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {essay ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Pane (5 Cols): Essay Text with Line Numbers */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
              
              {/* Student Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{essay.student_name}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{essay.student_id} • {essay.school_name}</div>
                  <div className="text-xs text-amber-700 dark:text-gh-gold-400 font-medium mt-0.5">{essay.title}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {essay.word_count || 0} Words
                </span>
              </div>

              {/* Line-Numbered Essay Text Viewer */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-300 dark:border-slate-800/80 overflow-y-auto max-h-[520px] font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                {(essay.corrected_text || essay.raw_extracted_text || '').split('\n').map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 py-0.5 px-1 rounded transition">
                    <span className="select-none text-slate-400 dark:text-slate-600 text-[10px] w-6 text-right shrink-0 pt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{line}</span>
                  </div>
                ))}
              </div>

              {/* Grammar & Style Diagnostic Highlights */}
              {grade?.ai_evaluation_json?.grammar_highlights && grade.ai_evaluation_json.grammar_highlights.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-700 dark:text-gh-gold-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Linguistic & Grammar Annotations</span>
                  </div>
                  {grade.ai_evaluation_json.grammar_highlights.map((gh, gidx) => (
                    <div key={gidx} className="text-[11px] p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-red-600 dark:text-red-400">{gh.issue_type}</span>
                        <span className="text-emerald-700 dark:text-gh-emerald-400">Suggestion: <strong>{gh.suggestion}</strong></span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{gh.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Right Pane (7 Cols): WAEC Grade Badge, Criterion Sliders & Lock Action */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* WAEC Letter Grade Banner */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  WAEC / GES Letter Grade Scale
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`px-4 py-1.5 rounded-xl text-xl font-black border font-['Outfit'] ${waecBadge.color}`}>
                    {waecBadge.grade}
                  </span>
                  <div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">{waecBadge.label} Distinction</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Weighted Score: <strong className="text-amber-600 dark:text-gh-gold-400">{currentTotal.toFixed(1)} / {totalPoints} ({currentPercentage.toFixed(1)}%)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Report Download Button if Approved */}
              {isLocked && (
                <a
                  href={api.getStudentPdfUrl(essay.id)}
                  download={`Report_Card_${essay.student_id}.pdf`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-glow-emerald"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Student PDF</span>
                </a>
              )}
            </div>

            {/* Criterion-by-Criterion Override Sliders */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                  Criterion Scoring & Real-Time Overrides
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Engine: <strong className="text-emerald-700 dark:text-gh-emerald-400">{grade?.ai_evaluation_json?.evaluator_engine || 'Local LLM / Heuristic'}</strong>
                </span>
              </div>

              <div className="space-y-4">
                {criteriaOverrides.map((crit, cidx) => {
                  const scoreVal = crit.teacher_score !== undefined ? crit.teacher_score : crit.ai_score;
                  return (
                    <div
                      key={crit.criterion_id || cidx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{crit.name}</h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{crit.comment}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-sm font-black text-amber-600 dark:text-gh-gold-400 font-mono">
                            {scoreVal.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono"> / {crit.max_score}</span>
                          <div className="text-[10px] text-emerald-700 dark:text-gh-emerald-400">AI: {crit.ai_score.toFixed(1)}</div>
                        </div>
                      </div>

                      {/* Interactive Slider */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">0</span>
                        <input
                          type="range"
                          min="0"
                          max={crit.max_score}
                          step="0.5"
                          value={scoreVal}
                          onChange={(e) => handleScoreSliderChange(cidx, parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-gh-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{crit.max_score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strengths & Weaknesses Badges */}
              {grade?.ai_evaluation_json && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-gh-emerald-950/30 border border-emerald-300 dark:border-gh-emerald-800/40 text-xs space-y-1">
                    <span className="font-bold text-emerald-800 dark:text-gh-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Commendable Strengths
                    </span>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5 text-[11px]">
                      {(grade.ai_evaluation_json.strengths || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-gh-gold-950/30 border border-amber-300 dark:border-gh-gold-800/40 text-xs space-y-1">
                    <span className="font-bold text-amber-800 dark:text-gh-gold-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Target Growth Areas
                    </span>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5 text-[11px]">
                      {(grade.ai_evaluation_json.weaknesses || []).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Teacher Remarks & Endorsement */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Teacher Remarks (Appears on Student Report Card)
                  </label>
                  <textarea
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    rows={3}
                    placeholder="Provide constructive feedback for the student..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Approved By (Examiner)</label>
                    <input
                      type="text"
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Override Reason (Audit Log)</label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Adjusted expression for Ghanaian idioms"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Final Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handleApproveAndLock(false)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
                  >
                    Save Draft Overrides
                  </button>

                  <button
                    onClick={() => handleApproveAndLock(true)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-amber-600 dark:from-gh-emerald-600 dark:to-gh-gold-600 hover:from-emerald-500 hover:to-amber-500 text-white transition shadow-glow-emerald disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Generating ReportLab PDF...' : 'Approve & Lock Final Grade'}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
          No essay selected for review.
        </div>
      )}

    </div>
  );
};
