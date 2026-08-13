import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Sliders, 
  Award, 
  FileDown, 
  Lock, 
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
import { Essay, Grade, CriterionScore, GrammarHighlight, AuthenticityReport } from '../types';
import { useAppStore } from '../store/useAppStore';

export const TeacherReviewView: React.FC = () => {
  const { selectedEssayId, setView, addToast, setPinModalOpen, batchFilterIds, setBatchFilterIds, currentTeacher } = useAppStore();
  
  const [essayList, setEssayList] = useState<Essay[]>([]);
  const [activeEssayId, setActiveEssayId] = useState<string>(selectedEssayId || 'essay-stu-001');
  const [essay, setEssay] = useState<Essay | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Teacher Overrides & Authenticity State
  const [criteriaOverrides, setCriteriaOverrides] = useState<CriterionScore[]>([]);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [approvedBy, setApprovedBy] = useState(currentTeacher?.name || 'Mr. K. Osei-Tutu (Senior English Tutor)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authenticityReport, setAuthenticityReport] = useState<AuthenticityReport | null>(null);

  useEffect(() => {
    if (currentTeacher?.name) {
      setApprovedBy(currentTeacher.name);
    }
  }, [currentTeacher]);

  // Filter essays if a batch filter is active
  const displayedEssays = (batchFilterIds && batchFilterIds.length > 0)
    ? essayList.filter(e => batchFilterIds.includes(e.id))
    : essayList;

  // Load essays list for dropdown selector
  useEffect(() => {
    api.getEssays().then((essays) => {
      setEssayList(essays);
      if (selectedEssayId) {
        setActiveEssayId(selectedEssayId);
      } else if (batchFilterIds && batchFilterIds.length > 0) {
        const batchMatch = essays.find(e => batchFilterIds.includes(e.id));
        if (batchMatch) setActiveEssayId(batchMatch.id);
      } else if (essays.length > 0) {
        setActiveEssayId(essays[0].id);
      }
    }).catch(console.error);
  }, [selectedEssayId, batchFilterIds]);

  // Fetch workspace review & authenticity data whenever activeEssayId changes
  useEffect(() => {
    if (!activeEssayId) return;
    setLoading(true);
    
    // Fetch review details
    api.getReviewWorkspace(activeEssayId)
      .then((data) => {
        setEssay(data.essay);
        setGrade(data.grade || null);
        setAuditHistory(data.audit_history || []);

        if (data.grade) {
          const scores = data.grade.final_criteria_scores_json || data.grade.ai_evaluation_json?.criteria_scores || [];
          setCriteriaOverrides(scores.map((c) => ({
            ...c,
            teacher_score: c.teacher_score !== undefined && c.teacher_score !== null ? c.teacher_score : c.ai_score
          })));
          setTeacherFeedback(data.grade.teacher_feedback || '');
          setOverrideReason(data.grade.teacher_override_reason || '');
          if (data.grade.approved_by) setApprovedBy(data.grade.approved_by);
        } else {
          setCriteriaOverrides([]);
          setTeacherFeedback('');
        }
      })
      .catch((err) => {
        console.error('Failed to load review workspace', err);
      })
      .finally(() => setLoading(false));

    // Fetch plagiarism & AI detection authenticity report
    api.getAuthenticityReport(activeEssayId)
      .then(setAuthenticityReport)
      .catch((err) => {
        console.error('Failed to load authenticity report', err);
        setAuthenticityReport(null);
      });
  }, [activeEssayId]);

  // Compute live overridden score and WAEC grade
  const currentTotal = criteriaOverrides.reduce((sum, c) => sum + (c.teacher_score ?? c.ai_score), 0);
  const totalPoints = essay?.rubric_total_points || 100;
  const currentPercentage = totalPoints > 0 ? (currentTotal / totalPoints) * 100 : 0;

  const getWaecGradeBadge = (pct: number) => {
    if (pct >= 80) return { grade: 'A1', label: 'Excellent', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600/50' };
    if (pct >= 70) return { grade: 'B2', label: 'Very Good', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600/50' };
    if (pct >= 65) return { grade: 'B3', label: 'Good', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-600/50' };
    if (pct >= 60) return { grade: 'C4', label: 'Credit', color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-600/50' };
    if (pct >= 55) return { grade: 'C5', label: 'Credit', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600/50' };
    if (pct >= 50) return { grade: 'C6', label: 'Credit', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600/50' };
    if (pct >= 45) return { grade: 'D7', label: 'Pass', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-600/50' };
    if (pct >= 40) return { grade: 'E8', label: 'Weak Pass', color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-600/50' };
    return { grade: 'F9', label: 'Fail', color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-600/50' };
  };

  const waecBadge = getWaecGradeBadge(currentPercentage);

  const handleScoreSliderChange = (idx: number, newScore: number) => {
    const updated = [...criteriaOverrides];
    updated[idx].teacher_score = newScore;
    setCriteriaOverrides(updated);
  };

  const performReviewSubmission = async (lockGrade: boolean = true) => {
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
        title: lockGrade ? 'Grade Approved & Locked' : 'Grade Unlocked for Adjustments',
        message: `Final Score: ${res.overall_score}/${res.max_overall_score} (${res.letter_grade})`
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Approval Error', message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAndLock = (lockGrade: boolean = true) => {
    // Always prompt for Teacher Security PIN before approving & locking grade
    setPinModalOpen(true, 'verify', () => performReviewSubmission(lockGrade));
  };

  const handleUnlockClick = () => {
    // Always prompt for Teacher Security PIN before unlocking grade
    setPinModalOpen(true, 'verify', () => performReviewSubmission(false));
  };

  const isLocked = Boolean(grade?.is_approved || essay?.status === 'APPROVED' || essay?.status === 'LOCKED');

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Top Header & Essay Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-['Outfit']">
              Review & Approve
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Review scores, adjust criteria, provide feedback, and lock final grades.
          </p>
        </div>

        {/* Essay Dropdown Switcher */}
        <div className="flex items-center gap-2">
          {batchFilterIds && batchFilterIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-sky-950/60 border border-blue-200 dark:border-sky-800 text-blue-700 dark:text-sky-300 text-xs px-2.5 py-1.5 rounded-lg">
              <span>Batch Filter ({displayedEssays.length})</span>
              <button 
                onClick={() => setBatchFilterIds(null)}
                className="hover:underline font-semibold text-blue-900 dark:text-sky-100 ml-1"
              >
                Clear
              </button>
            </div>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400 font-medium hidden sm:inline">Essay:</label>
          <select
            value={activeEssayId}
            onChange={(e) => setActiveEssayId(e.target.value)}
            className="px-3.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-primary-700 dark:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          >
            {displayedEssays.map((ess) => (
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
            <div className="glass-panel p-5 rounded-xl space-y-4">
              
              {/* Student Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">{essay.student_name}</h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{essay.student_id} • {essay.school_name}</div>
                  <div className="text-sm text-amber-700 dark:text-amber-400 font-medium mt-0.5">{essay.title}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {essay.word_count || 0} Words
                </span>
              </div>

              {/* Line-Numbered Essay Text Viewer */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[520px] font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed space-y-1">
                {(essay.corrected_text || essay.raw_extracted_text || '').split('\n').map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/40 py-0.5 px-1 rounded transition">
                    <span className="select-none text-gray-400 dark:text-gray-600 text-xs w-6 text-right shrink-0 pt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{line}</span>
                  </div>
                ))}
              </div>

              {/* Grammar & Style Diagnostic Highlights */}
              {grade?.ai_evaluation_json?.grammar_highlights && grade.ai_evaluation_json.grammar_highlights.length > 0 && (
                <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Grammar Annotations</span>
                  </div>
                  {grade.ai_evaluation_json.grammar_highlights.map((gh, gidx) => (
                    <div key={gidx} className="text-sm p-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-0.5">
                      <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-red-600 dark:text-red-400">{gh.issue_type}</span>
                        <span className="text-green-700 dark:text-green-400">Suggestion: <strong>{gh.suggestion}</strong></span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{gh.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Right Pane (7 Cols): WAEC Grade Badge, Criterion Sliders & Lock Action */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* WAEC Letter Grade Banner */}
            <div className="glass-panel p-6 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                  WAEC Letter Grade
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`px-4 py-1.5 rounded-xl text-xl font-black border font-['Outfit'] ${waecBadge.color}`}>
                    {waecBadge.grade}
                  </span>
                  <div>
                    <div className="text-base font-bold text-gray-900 dark:text-white">{waecBadge.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Score: <strong className="text-amber-600 dark:text-amber-400">{currentTotal.toFixed(1)} / {totalPoints} ({currentPercentage.toFixed(1)}%)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Report Download Button if Approved */}
              {isLocked && (
                <a
                  href={api.getStudentPdfUrl(essay.id)}
                  download={`Report_Card_${essay.student_id}.pdf`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0077b6] hover:bg-[#005f93] text-white transition shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>
              )}
            </div>

            {/* Authenticity & Integrity Analysis Card */}
            {authenticityReport && (
              <div className="glass-panel p-5 rounded-xl space-y-3 border-l-4 border-indigo-500 dark:border-indigo-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      Authenticity & Plagiarism Analysis
                    </h3>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    authenticityReport.overall_authenticity_status === 'PASS_AUTHENTIC'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                      : authenticityReport.overall_authenticity_status === 'NEEDS_TEACHER_REVIEW'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300'
                  }`}>
                    {authenticityReport.overall_authenticity_status === 'PASS_AUTHENTIC' ? '✓ Authentic' : '⚠️ Suspicious / Review'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Peer Plagiarism Badge */}
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Peer Copy Match</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                      {authenticityReport.peer_plagiarism_score}%
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {authenticityReport.peer_matches.length > 0
                        ? `Match: ${authenticityReport.peer_matches[0].student_name}`
                        : 'No peer copy match'}
                    </div>
                  </div>

                  {/* AI Text Detection Badge */}
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">AI Content Probability</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                      {authenticityReport.ai_detection.ai_probability}%
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {authenticityReport.ai_detection.classification}
                    </div>
                  </div>

                  {/* Web Plagiarism Badge */}
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Web Plagiarism</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                      {authenticityReport.web_plagiarism.status === 'OFFLINE_SKIPPED' ? 'Offline' : `${authenticityReport.web_plagiarism.similarity_score}%`}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {authenticityReport.web_plagiarism.status === 'OFFLINE_SKIPPED' ? 'Local DB Check Active' : 'Web Indexed'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Criterion-by-Criterion Override Sliders */}
            <div className="glass-panel p-6 rounded-xl space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Criterion Scores
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Engine: <strong className="text-primary-600 dark:text-primary-400">{grade?.ai_evaluation_json?.evaluator_engine || 'Local LLM'}</strong>
                </span>
              </div>

              <div className="space-y-4">
                {criteriaOverrides.map((crit, cidx) => {
                  const scoreVal = crit.teacher_score !== undefined ? crit.teacher_score : crit.ai_score;
                  return (
                    <div
                      key={crit.criterion_id || cidx}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{crit.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{crit.comment}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                            {scoreVal.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono"> / {crit.max_score}</span>
                          <div className="text-xs text-primary-600 dark:text-primary-400">Auto: {crit.ai_score.toFixed(1)}</div>
                        </div>
                      </div>

                      {/* Interactive Slider */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">0</span>
                        <input
                          type="range"
                          min="0"
                          max={crit.max_score}
                          step="0.5"
                          value={scoreVal}
                          disabled={isLocked}
                          onChange={(e) => handleScoreSliderChange(cidx, parseFloat(e.target.value))}
                          className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-600 ${
                            isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                          }`}
                        />
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{crit.max_score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strengths & Weaknesses Badges */}
              {grade?.ai_evaluation_json && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 space-y-1">
                    <span className="text-sm font-medium text-green-800 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                    </span>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-0.5 text-xs">
                      {(grade.ai_evaluation_json.strengths || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 space-y-1">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Areas for Growth
                    </span>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-0.5 text-xs">
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Teacher Remarks (Appears on Report Card)
                  </label>
                  <textarea
                    value={teacherFeedback}
                    disabled={isLocked}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    rows={3}
                    placeholder="Provide constructive feedback for the student..."
                    className={`w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none ${
                      isLocked ? 'cursor-not-allowed opacity-70' : ''
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Approved By</label>
                    <input
                      type="text"
                      value={approvedBy}
                      disabled={isLocked}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white ${
                        isLocked ? 'cursor-not-allowed opacity-70' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Override Reason</label>
                    <input
                      type="text"
                      value={overrideReason}
                      disabled={isLocked}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Adjusted expression for local idioms"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white ${
                        isLocked ? 'cursor-not-allowed opacity-70' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Final Action Buttons */}
                {isLocked ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Grade Approved & Locked</span>
                    </div>

                    <button
                      onClick={handleUnlockClick}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40 transition"
                      title="Unlock grade for adjustments"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{isSubmitting ? 'Unlocking...' : 'Unlock Grade'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleApproveAndLock(false)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition"
                    >
                      Save Draft
                    </button>

                    <button
                      onClick={() => handleApproveAndLock(true)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#0077b6] hover:bg-[#005f93] text-white transition shadow-sm disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSubmitting ? 'Processing...' : 'Approve & Lock Grade'}</span>
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="glass-panel p-12 rounded-xl text-center text-gray-500">
          No essay selected for review.
        </div>
      )}

    </div>
  );
};
