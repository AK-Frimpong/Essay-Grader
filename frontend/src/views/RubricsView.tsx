import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
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
  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state for new / edited rubric
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('English Language');
  const [gradeLevel, setGradeLevel] = useState('JHS 1 - 3');
  const [description, setDescription] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);

  const defaultCriteria: RubricCriterion[] = [
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
  ];

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

  const openCreateModal = () => {
    setEditingRubricId(null);
    setTitle('');
    setSubject('English Language');
    setGradeLevel('JHS 1 - 3');
    setDescription('');
    setTotalPoints(100);
    setCriteria(defaultCriteria);
    setIsModalOpen(true);
  };

  const openEditModal = (rubric: Rubric) => {
    setEditingRubricId(rubric.id);
    setTitle(rubric.title);
    setSubject(rubric.subject);
    setGradeLevel(rubric.grade_level);
    setDescription(rubric.description || '');
    setTotalPoints(rubric.total_points);
    setCriteria(rubric.criteria || []);
    setIsModalOpen(true);
  };

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

  const handleDeleteRubric = async (rubricId: string) => {
    if (!window.confirm('Are you sure you want to delete this rubric scheme?')) return;
    try {
      await api.deleteRubric(rubricId);
      addToast({ type: 'success', title: 'Rubric Deleted', message: 'Rubric removed successfully.' });
      setSelectedRubric(null);
      loadRubrics();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: e.message || 'Cannot delete rubric.' });
    }
  };

  const handleSaveRubric = async () => {
    if (!title.trim()) {
      addToast({ type: 'warning', title: 'Missing Title', message: 'Please enter a title for the rubric.' });
      return;
    }

    try {
      const sumPoints = criteria.reduce((acc, c) => acc + Number(c.max_score), 0);
      const payload = {
        title,
        subject,
        grade_level: gradeLevel,
        description,
        total_points: sumPoints || totalPoints,
        criteria,
        is_default: false
      };

      let result: Rubric;
      if (editingRubricId) {
        result = await api.updateRubric(editingRubricId, payload);
        addToast({ type: 'success', title: 'Rubric Updated', message: `Saved changes to "${result.title}".` });
      } else {
        result = await api.createRubric(payload);
        addToast({ type: 'success', title: 'Rubric Created', message: `Saved new rubric "${result.title}".` });
      }

      setIsModalOpen(false);
      loadRubrics();
      setSelectedRubric(result);
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
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              Rubrics & Marking Schemes
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Standard Ghanaian marking schemes for English Composition, Argumentative Essays, and more.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">Create Rubric</span>
        </button>
      </div>

      {/* Rubric Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rubric Cards List */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
            Available Schemes ({rubrics.length})
          </h3>
          
          {rubrics.map((r) => {
            const isSelected = selectedRubric?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRubric(r)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary-600 dark:border-primary-600 bg-primary-50/60 dark:bg-primary-900/30 ring-1 ring-primary-600/30'
                    : 'border-primary-600/25 dark:border-primary-600/35 bg-white dark:bg-gray-800 hover:border-primary-600/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                    {r.grade_level}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {r.total_points} Pts
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{r.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{r.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700 mt-3">
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
            <div className="glass-panel p-6 rounded-xl space-y-6">
              
              {/* Active Rubric Title Banner */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                      {selectedRubric.grade_level}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{selectedRubric.subject}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display mt-1.5">
                    {selectedRubric.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                    {selectedRubric.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Scale</div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {selectedRubric.total_points} pts
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(selectedRubric)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition"
                      title="Edit this rubric"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-primary-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRubric(selectedRubric.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/40 transition"
                      title="Delete rubric"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Criteria Cards Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scoring Criteria ({selectedRubric.criteria?.length || 0})
                </h3>

                {selectedRubric.criteria?.map((c, index) => (
                  <div
                    key={c.id || index}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/90 dark:border-gray-700 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          Criterion {index + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-mono text-xs font-bold">
                          Max: {c.max_score} pts
                        </span>
                        {c.weight && (
                          <div className="text-xs text-gray-500 mt-0.5">Weight: {(c.weight * 100).toFixed(0)}%</div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300">{c.description}</p>

                    {/* Scoring Level Descriptors */}
                    {c.levels && c.levels.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {c.levels.map((lvl, lidx) => (
                          <div
                            key={lidx}
                            className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm space-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-amber-700 dark:text-amber-300">{lvl.label}</span>
                              <span className="font-mono text-green-700 dark:text-green-400 text-xs font-medium">{lvl.score} pts</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{lvl.descriptor}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 rounded-xl text-center text-gray-500">
              Select a rubric on the left to view criteria details.
            </div>
          )}
        </div>

      </div>

      {/* Create Rubric Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-rubric-modal-title"
          aria-describedby="create-rubric-modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-3xl rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-elevated bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="create-rubric-modal-title" className="font-bold text-gray-900 dark:text-white text-base">
                    {editingRubricId ? 'Edit Marking Scheme' : 'Create Marking Scheme'}
                  </h3>
                  <p id="create-rubric-modal-desc" className="text-xs text-gray-500 dark:text-gray-400">Configure criteria, point weights, and score levels</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close create rubric modal"
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Rubric Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WAEC Section B Narrative Essay"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="English Language"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Target Grade Level</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="JHS 1-3 / SHS 1-3"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline marking guidelines..."
                  rows={2}
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
                />
              </div>

              {/* Dynamic Criteria List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Criteria ({criteria.length})</label>
                  <button
                    onClick={handleAddCriterion}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Criterion
                  </button>
                </div>

                {criteria.map((c, idx) => (
                  <div key={c.id || idx} className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
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
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
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
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-sm text-amber-600 dark:text-amber-400 font-mono text-center"
                        />
                        <span className="text-xs text-gray-500">pts</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCriterion(idx)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500 transition"
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
                      className="w-full px-3 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/60 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRubric}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition shadow-sm"
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
