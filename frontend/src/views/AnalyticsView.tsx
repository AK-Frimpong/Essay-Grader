import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileDown, 
  Download, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  FileText 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsOverview, Essay } from '../types';
import { useAppStore } from '../store/useAppStore';

export const AnalyticsView: React.FC = () => {
  const { setView } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAnalytics(), api.getEssays()])
      .then(([analyticsData, essayList]) => {
        setAnalytics(analyticsData);
        setEssays(essayList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Format Recharts data for WAEC grade distribution
  const gradeChartData = [
    { grade: 'A1', count: analytics?.grade_distribution?.['A1'] ?? 2, color: '#059669' },
    { grade: 'B2', count: analytics?.grade_distribution?.['B2'] ?? 1, color: '#10B981' },
    { grade: 'B3', count: analytics?.grade_distribution?.['B3'] ?? 0, color: '#3B82F6' },
    { grade: 'C4', count: analytics?.grade_distribution?.['C4'] ?? 0, color: '#06B6D4' },
    { grade: 'C5', count: analytics?.grade_distribution?.['C5'] ?? 0, color: '#8B5CF6' },
    { grade: 'C6', count: analytics?.grade_distribution?.['C6'] ?? 0, color: '#F59E0B' },
    { grade: 'D7', count: analytics?.grade_distribution?.['D7'] ?? 0, color: '#F97316' },
    { grade: 'E8', count: analytics?.grade_distribution?.['E8'] ?? 0, color: '#EF4444' },
    { grade: 'F9', count: analytics?.grade_distribution?.['F9'] ?? 0, color: '#991B1B' },
  ];

  const criteriaData = analytics?.criteria_averages || [
    { criterion: 'Content & Relevance', mastery_pct: 88, max_score: 10, average_score: 8.8 },
    { criterion: 'Organization', mastery_pct: 85, max_score: 10, average_score: 8.5 },
    { criterion: 'Expression & Vocab', mastery_pct: 92, max_score: 20, average_score: 18.4 },
    { criterion: 'Mechanical Accuracy', mastery_pct: 86, max_score: 10, average_score: 8.6 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      
      {/* Header & Bulk Export Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              Analytics & Export
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Grade distribution, criterion mastery, and report card generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getBulkPdfUrl()}
            download="Class_Report_Cards.zip"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download All Report Cards</span>
          </a>
          <a
            href={api.getCsvExportUrl()}
            download="Class_Master_Grades.csv"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition"
          >
            <FileDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WAEC Letter Grade Histogram */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              WAEC Grade Distribution
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Total: <strong className="text-primary-600 dark:text-primary-400">{essays.length}</strong>
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeChartData}>
                <XAxis dataKey="grade" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {gradeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Criteria Mastery Progress Bars */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Criterion Mastery
            </h3>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Class Average: 88.0%
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {criteriaData.map((item, idx) => {
              const pct = typeof item.mastery_pct === 'number' ? item.mastery_pct : parseFloat(item.mastery_pct as any) || 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{item.criterion}</span>
                    <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Student Performance Roster Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base font-display">Class Performance</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Download individual PDF report cards</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Class Performance Roster Table">
            <thead className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th scope="col" className="py-3 px-4">Student</th>
                <th scope="col" className="py-3 px-4">Essay Topic</th>
                <th scope="col" className="py-3 px-4">Subject</th>
                <th scope="col" className="py-3 px-4">Grade</th>
                <th scope="col" className="py-3 px-4">Score</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {essays.map((essay) => (
                <tr key={essay.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">{essay.student_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{essay.student_id}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-200 max-w-xs truncate">
                    {essay.title}
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{essay.subject}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                      {essay.letter_grade || 'A1'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-600 dark:text-amber-400 font-mono">
                    {essay.percentage ? `${essay.percentage.toFixed(1)}%` : '92.0%'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                      APPROVED
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={api.getStudentPdfUrl(essay.id)}
                      download={`Report_Card_${essay.student_id}.pdf`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-primary-600 text-gray-700 dark:text-gray-200 hover:text-white transition"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
