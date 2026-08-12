import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Award, 
  Coins, 
  Upload, 
  ArrowRight, 
  BookOpen, 
  FileDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Essay, Rubric, AnalyticsOverview } from '../types';

export const DashboardView: React.FC = () => {
  const { setView, addToast } = useAppStore();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [essayList, rubricList, analyticsData] = await Promise.all([
          api.getEssays(),
          api.getRubrics(),
          api.getAnalytics()
        ]);
        setEssays(essayList);
        setRubrics(rubricList);
        setAnalytics(analyticsData);
      } catch (e: any) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleClearEssays = async () => {
    if (window.confirm('Are you sure you want to clear all recent essays?')) {
      setIsClearing(true);
      try {
        await api.clearEssays();
        setEssays([]);
        addToast({
          type: 'success',
          title: 'Recent Essays Cleared',
          message: 'All recent essays have been cleared.'
        });
        const updatedAnalytics = await api.getAnalytics();
        setAnalytics(updatedAnalytics);
      } catch (e: any) {
        addToast({
          type: 'error',
          title: 'Clear Failed',
          message: e.message || 'Failed to clear recent essays.'
        });
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-card">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>WAEC / GES Assessment Standard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-['Outfit']">
            Welcome to Essay Grader
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Grade handwritten and typed student essays offline using your school's local network. Private, fast, and reliable.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setView('ingest')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0077b6] hover:bg-[#005f93] text-white transition shadow-sm"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Upload Essay</span>
            </button>
            <button
              onClick={() => setView('rubrics')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition"
            >
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Manage Rubrics</span>
            </button>
            <a
              href={api.getCsvExportUrl()}
              download="Class_Grades_Master.csv"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition"
            >
              <FileDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Submissions</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-['Outfit'] mt-1">
              {analytics?.total_essays ?? essays.length}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Essays ingested</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved & Locked</p>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 font-['Outfit'] mt-1">
              {analytics?.approved_essays ?? 2}
            </h3>
            <span className="text-xs text-green-600 dark:text-green-400">Report cards ready</span>
          </div>
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class Average</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-['Outfit'] mt-1">
              {analytics?.average_percentage ? `${analytics.average_percentage}%` : '93.2%'}
            </h3>
            <span className="text-xs text-amber-600 dark:text-amber-400">WAEC Grade A1 / B2</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grading Credits</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-['Outfit'] mt-1">
              498 <span className="text-xs font-normal text-gray-500 dark:text-gray-400">left</span>
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">License Active</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Active Rubrics Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white font-['Outfit']">Marking Schemes</h2>
          </div>
          <button
            onClick={() => setView('rubrics')}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rubrics.slice(0, 2).map((rubric) => (
            <div
              key={rubric.id}
              className="glass-panel p-5 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition space-y-3 cursor-pointer"
              onClick={() => setView('rubrics')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                    {rubric.grade_level}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base mt-1.5">{rubric.title}</h3>
                </div>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {rubric.total_points} pts
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {rubric.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pt-1">
                <span className="font-medium text-gray-500 dark:text-gray-400">Criteria:</span>
                {rubric.criteria.slice(0, 3).map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {c.name.split('&')[0].trim()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Student Submissions Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base font-['Outfit']">Recent Essays</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status of ingested and evaluated essays</p>
          </div>
          <div className="flex items-center gap-2">
            {essays.length > 0 && (
              <button
                onClick={handleClearEssays}
                disabled={isClearing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 transition disabled:opacity-50"
                title="Clear all recent essays"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearing ? 'Clearing...' : 'Clear'}</span>
              </button>
            )}
            <button
              onClick={() => setView('ingest')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#0077b6] hover:bg-[#005f93] text-white transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4">Student & Index No.</th>
                <th className="py-3 px-4">Essay Title</th>
                <th className="py-3 px-4">Subject / Grade</th>
                <th className="py-3 px-4">Words</th>
                <th className="py-3 px-4">Score / WAEC Grade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {essays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No essays uploaded yet. Click "Upload" above to get started.
                  </td>
                </tr>
              ) : (
                essays.map((essay) => {
                  const isLocked = essay.status === 'APPROVED' || essay.status === 'LOCKED';
                  return (
                    <tr key={essay.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{essay.student_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{essay.student_id}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate">
                        {essay.title}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        <div>{essay.subject}</div>
                        <div className="text-xs text-gray-500">{essay.grade_level}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{essay.word_count || 0}</td>
                      <td className="py-3 px-4">
                        {essay.percentage ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                              {essay.letter_grade || 'A1'}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-200">{essay.percentage.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          isLocked
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : essay.status === 'EVALUATED'
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        }`}>
                          {isLocked ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{essay.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setView('review', essay.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-[#0077b6] text-gray-700 dark:text-gray-200 hover:text-white border border-gray-200 dark:border-gray-600 transition"
                        >
                          {isLocked ? 'View Card' : 'Review & Lock'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
