import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  Layers, 
  Sliders, 
  X,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Rubric, RubricCriterion } from '../types';
import { useAppStore } from '../store/useAppStore';

export const RubricsView: React.FC = () => {
  const { addToast } = useAppStore();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state for new rubric
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('English Language');
  const [gradeLevel, setGradeLevel] = useState('JHS 1 - 3');
  const [description, setDescription] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([
    {
      id: 'c1',
      name: 'Content & Development of Ideas',
      description: 'Relevance to prompt, thesis depth, and originality of supporting details.',
      max_score: 25,
      weight: 0.25,
      levels: [
        { score: 25, label: 'Mastery', descriptor: 'Comprehensive insights with compelling Ghanaian illustrations.' },
        { score: 18, label: 'Proficient', descriptor: 'Good coverage with clear supporting ideas.' },
        { score: 12, label: 'Developing', descriptor: 'Superficial treatment of the core topic.' }
      ]
    },
    {
      id: 'c2',
      name: 'Organization & Paragraph Transitions',
      description: 'Logical sequencing of topic sentences and smooth discourse markers.',
      max_score: 25,
      weight: 0.25,
      levels: [
        { score: 25, label: 'Mastery', descriptor: 'Seamless transitions and coherent structure throughout.' },
        { score: 18, label: 'Proficient', descriptor: 'Logical grouping with appropriate transitions.' }
      ]
    },
    {
      id: 'c3',
      name: 'Expression & Academic Register',
      description: 'Rich vocabulary, idiomatic fluency, and sentence variety.',
      max_score: 25,
      weight: 0.25,
      levels: [
        { score: 25, label: 'Mastery', descriptor: 'Sophisticated academic diction and varied syntax.' }
      ]
    },
    {
      id: 'c4',
      name: 'Mechanical Accuracy & Punctuation',
      description: 'Grammar concord, correct tenses, capitalization, and spelling.',
      max_score: 25,
      weight: 0.25,
      levels: [
        { score: 25, label: 'Mastery', descriptor: 'Virtually error-free across all sentences.' }
      ]
    }
  ]);

  const loadRubrics = async () => {
    try {
      const list = await api.getRubrics();
      setRubrics(list);
      if (list.length > 0 && !selectedRubric) {
        setSelectedRubric(list[0]);
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRubrics();
  }, []);

  const handleAddCriterion = () => {
    const newId = `c_${Date.now()}`;
    setCriteria([
      ...criteria,
      {
        id: newId,
        name: 'New Evaluation Criterion',
        description: 'Criterion description and grading scope.',
        max_score: 20,
        weight: 0.20,
        levels: [
          { score: 20, label: 'Mastery', descriptor: 'Exemplary execution.' },
          { score: 12, label: 'Developing', descriptor: 'Partial demonstration.' }
        ]
      }
    ]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleSaveRubric = async () => {
    if (!title.trim()) {
      addToast({ type: 'warning', title: 'Missing Title', message: 'Please enter a title for the rubric.' });
      return;
    }

    try {
      const sumPoints = criteria.reduce((acc, c) => acc + Number(c.max_score), 0);
      const created = await api.createRubric({
        title,
        subject,
        grade_level: gradeLevel,
        description,
        total_points: sumPoints || totalPoints,
        criteria,
        is_default: false
      });
      addToast({ type: 'success', title: 'Rubric Created', message: `Saved "${created.title}".` });
      setIsModalOpen(false);
      loadRubrics();
      setSelectedRubric(created);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error Saving Rubric', message: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600 dark:text-gh-gold-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              WAEC & Curricular Rubric Manager
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1">
            Standard Ghanaian marking schemes for English Composition, Argumentative Essays, and Integrated Science.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-glow-emerald"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Rubric</span>
        </button>
      </div>

      {/* Rubric Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rubric Cards List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Available Marking Schemes ({rubrics.length})
          </h3>
          
          {rubrics.map((r) => {
            const isSelected = selectedRubric?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRubric(r)}
                className={`p-5 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 dark:border-gh-emerald-500 bg-emerald-50/80 dark:bg-gh-emerald-950/40 shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-gh-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-gh-gold-300 border border-emerald-300 dark:border-slate-700">
                    {r.grade_level}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-gh-emerald-400">
                    {r.total_points} Pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{r.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{r.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/60 mt-3">
                  <span>{r.subject}</span>
                  <span>{r.criteria?.length || 0} Criteria</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Rubric Criteria Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRubric ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
              
              {/* Active Rubric Title Banner */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-gh-emerald-950 text-emerald-800 dark:text-gh-emerald-300 border border-emerald-300 dark:border-gh-emerald-700/50">
                      {selectedRubric.grade_level}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{selectedRubric.subject}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit'] mt-1.5">
                    {selectedRubric.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                    {selectedRubric.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Scale</div>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-gh-gold-400 font-mono">
                    {selectedRubric.total_points} Points
                  </div>
                </div>
              </div>

              {/* Criteria Cards Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Scoring Criteria Breakdown ({selectedRubric.criteria?.length || 0})
                </h3>

                {selectedRubric.criteria?.map((c, index) => (
                  <div
                    key={c.id || index}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-gh-gold-400 uppercase tracking-wider">
                          Criterion {index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-gh-emerald-950 text-emerald-800 dark:text-gh-emerald-300 font-mono text-xs font-bold border border-emerald-300 dark:border-gh-emerald-700/40">
                          Max: {c.max_score} pts
                        </span>
                        {c.weight && (
                          <div className="text-[10px] text-slate-500 mt-0.5">Weight: {(c.weight * 100).toFixed(0)}%</div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>

                    {/* Scoring Level Descriptors */}
                    {c.levels && c.levels.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                        {c.levels.map((lvl, lidx) => (
                          <div
                            key={lidx}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs space-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-700 dark:text-gh-gold-300">{lvl.label}</span>
                              <span className="font-mono text-emerald-700 dark:text-gh-emerald-400 text-[11px] font-semibold">{lvl.score} pts</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{lvl.descriptor}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
              Select a rubric on the left to inspect criteria.
            </div>
          )}
        </div>

      </div>

      {/* Create Rubric Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl bg-white dark:bg-gh-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-gh-emerald-900/60 border border-emerald-300 dark:border-gh-emerald-600/40 text-emerald-800 dark:text-gh-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Custom WAEC/GES Rubric</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure criteria, point weights, and score levels</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Rubric Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WAEC Section B Narrative Essay"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="English Language"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Grade Level</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="JHS 1-3 / SHS 1-3"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description / Syllabus Directive</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline marking guidelines aligned with Ghanaian curriculum standards..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Dynamic Criteria List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Criteria ({criteria.length})</label>
                  <button
                    onClick={handleAddCriterion}
                    className="text-xs font-semibold text-emerald-700 dark:text-gh-emerald-400 hover:text-emerald-800 dark:hover:text-gh-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Criterion
                  </button>
                </div>

                {criteria.map((c, idx) => (
                  <div key={c.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...criteria];
                          updated[idx].name = e.target.value;
                          setCriteria(updated);
                        }}
                        placeholder="Criterion Name"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center gap-1 w-28">
                        <input
                          type="number"
                          value={c.max_score}
                          onChange={(e) => {
                            const updated = [...criteria];
                            updated[idx].max_score = Number(e.target.value);
                            setCriteria(updated);
                          }}
                          placeholder="Max"
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-amber-600 dark:text-gh-gold-400 font-mono text-center"
                        />
                        <span className="text-[10px] text-slate-500">pts</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCriterion(idx)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={c.description}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx].description = e.target.value;
                        setCriteria(updated);
                      }}
                      placeholder="Grading expectations and scope..."
                      className="w-full px-3 py-1 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRubric}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-glow-emerald"
              >
                <FileCheck className="w-4 h-4" />
                <span>Save Rubric</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
