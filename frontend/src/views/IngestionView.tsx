import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  Sliders, 
  Check, 
  RefreshCw, 
  Save, 
  ArrowRight, 
  Eye, 
  FileCode,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Rubric } from '../types';
import { useAppStore } from '../store/useAppStore';

export const IngestionView: React.FC = () => {
  const { setView, addToast } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState('rubric-waec-bece-english');
  
  // Student Metadata
  const [studentName, setStudentName] = useState('Kofi Asante');
  const [studentId, setStudentId] = useState('WAEC-JHS-2026-092');
  const [schoolName, setSchoolName] = useState('Achimota Basic School / JHS');
  const [subject, setSubject] = useState('English Language');
  const [gradeLevel, setGradeLevel] = useState('JHS 3');
  const [essayTitle, setEssayTitle] = useState('The Impact of Galamsey on Drinking Water in Ghana');

  // File & OCR State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // OpenCV Filters Toggle
  const [denoise, setDenoise] = useState(true);
  const [deskew, setDeskew] = useState(true);
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(true);
  const [contrastEnhance, setContrastEnhance] = useState(true);

  useEffect(() => {
    api.getRubrics().then((list) => {
      setRubrics(list);
      if (list.length > 0) setSelectedRubricId(list[0].id);
    }).catch(console.error);
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setImagePreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
    }
  };

  const handleRunOCRUpload = async () => {
    if (!selectedFile && !extractedText.trim()) {
      addToast({ type: 'warning', title: 'File Missing', message: 'Please select an essay scan or document file.' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      formData.append('student_name', studentName);
      formData.append('student_id', studentId);
      formData.append('school_name', schoolName);
      formData.append('subject', subject);
      formData.append('grade_level', gradeLevel);
      formData.append('title', essayTitle);
      formData.append('rubric_id', selectedRubricId);
      formData.append('denoise', denoise.toString());
      formData.append('deskew', deskew.toString());
      formData.append('adaptive_threshold', adaptiveThreshold.toString());
      formData.append('contrast_enhancement', contrastEnhance.toString());

      const res = await api.uploadDocument(formData);
      setCurrentEssayId(res.essay_id);
      setExtractedText(res.raw_extracted_text);
      if (res.preprocessed_image_url) {
        setImagePreviewUrl(res.preprocessed_image_url);
      }
      addToast({
        type: 'success',
        title: 'OCR Ingestion Complete',
        message: `Extracted ${res.word_count} words from ${res.file_type} upload.`
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'OCR Extraction Failed', message: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!currentEssayId) {
      addToast({ type: 'warning', title: 'Upload First', message: 'Please ingest an essay before saving corrections.' });
      return;
    }
    try {
      await api.saveCorrectedText({
        essay_id: currentEssayId,
        corrected_text: extractedText,
        title: essayTitle,
        student_name: studentName,
        student_id: studentId,
        rubric_id: selectedRubricId
      });
      addToast({ type: 'success', title: 'Saved', message: 'Corrected text saved successfully.' });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message });
    }
  };

  const handleGradeWithAI = async () => {
    if (!currentEssayId) {
      addToast({ type: 'warning', title: 'Upload First', message: 'Please ingest or upload an essay document.' });
      return;
    }
    setIsEvaluating(true);
    try {
      await api.saveCorrectedText({
        essay_id: currentEssayId,
        corrected_text: extractedText,
        title: essayTitle,
        student_name: studentName,
        student_id: studentId,
        rubric_id: selectedRubricId
      });
      const evalRes = await api.evaluateEssay(currentEssayId, selectedRubricId);
      addToast({
        type: 'success',
        title: 'AI Evaluation Complete!',
        message: `Awarded WAEC Grade: ${evalRes.letter_grade} (${evalRes.percentage}%)`
      });
      // Redirect to Teacher Review Split-Pane
      setView('review', currentEssayId);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Grading Engine Error', message: e.message });
    } finally {
      setIsEvaluating(false);
    }
  };

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-gh-emerald-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-['Outfit']">
              Document Ingestion & OCR Workspace
            </h1>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Upload PDF, DOCX, TXT, or scanned handwritten papers with OpenCV noise reduction and split-screen manual correction.
          </p>
        </div>

        {currentEssayId && (
          <button
            onClick={handleGradeWithAI}
            disabled={isEvaluating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-gh-emerald-600 to-gh-gold-600 hover:from-gh-emerald-500 hover:to-gh-gold-500 text-white transition shadow-glow-emerald disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-gh-gold-300" />
            <span>{isEvaluating ? 'Evaluating with Phi-3 Mini...' : 'Run Ollama AI Evaluation'}</span>
          </button>
        )}
      </div>

      {/* Metadata & Rubric Assignment Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          1. Student & Assessment Metadata
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Student Full Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">WAEC Index / Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">School Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Marking Scheme / Rubric</label>
            <select
              value={selectedRubricId}
              onChange={(e) => setSelectedRubricId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-emerald-700 dark:text-gh-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
            >
              {rubrics.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.total_points} pts)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Essay Title / Topic Prompt</label>
            <input
              type="text"
              value={essayTitle}
              onChange={(e) => setEssayTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject & Grade</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* OpenCV Noise Filter Controls & Drag-Drop Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dropzone & Filter Controls */}
        <div className="space-y-4">
          
          {/* File Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-gh-emerald-500 bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition text-center cursor-pointer space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.bmp,.tiff,.webp"
              onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-gh-emerald-950 border border-emerald-300 dark:border-gh-emerald-600/40 text-emerald-700 dark:text-gh-emerald-400 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedFile ? selectedFile.name : 'Drag & drop essay scan or click to browse'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Supports Scanned Images (PNG, JPG), PDF, DOCX, TXT
              </p>
            </div>
          </div>

          {/* OpenCV Preprocessing Controls */}
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-gh-gold-400" />
              <span>OpenCV OCR Image Cleaning Filters</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Bilateral Denoise (Clean Paper Noise)</span>
                <input
                  type="checkbox"
                  checked={denoise}
                  onChange={(e) => setDenoise(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Deskewing (Straighten Lines)</span>
                <input
                  type="checkbox"
                  checked={deskew}
                  onChange={(e) => setDeskew(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Adaptive Gaussian Thresholding</span>
                <input
                  type="checkbox"
                  checked={adaptiveThreshold}
                  onChange={(e) => setAdaptiveThreshold(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Contrast Enhancement (CLAHE)</span>
                <input
                  type="checkbox"
                  checked={contrastEnhance}
                  onChange={(e) => setContrastEnhance(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>

            <button
              onClick={handleRunOCRUpload}
              disabled={isUploading || (!selectedFile && !extractedText)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>{isUploading ? 'Processing OpenCV Filters...' : 'Run OCR Ingestion'}</span>
            </button>
          </div>

        </div>

        {/* Live Split-Screen View: Image Preview on Left vs Editable Text on Right */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            
            {/* Split Screen Header */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-600 dark:text-gh-emerald-400" />
                  <span>OCR Extracted Text & Teacher Correction</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  Word Count: <strong className="text-amber-600 dark:text-gh-gold-400">{wordCount}</strong>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCorrection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-gh-emerald-400" />
                  <span>Save Text</span>
                </button>
                <button
                  onClick={handleGradeWithAI}
                  disabled={isEvaluating || !extractedText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-glow-emerald disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Evaluate</span>
                </button>
              </div>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 min-h-[380px]">
              
              {/* Left Pane: Original Image / Document Scan */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col items-center justify-center overflow-auto max-h-[420px]">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Document Scan"
                    className="max-h-96 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-800 shadow"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
                    <p className="text-xs">No scan image preview loaded.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-600">PDF and DOCX text extracts appear in the editor on the right.</p>
                  </div>
                )}
              </div>

              {/* Right Pane: Editable Extracted Text */}
              <div className="p-4 bg-white/40 dark:bg-slate-900/30 flex flex-col">
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Extracted essay text will appear here. You can manually correct or type handwritten text directly before queuing for AI rubric grading..."
                  className="w-full flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none min-h-[340px]"
                />
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
