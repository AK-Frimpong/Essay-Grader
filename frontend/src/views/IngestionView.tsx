import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Sliders, 
  Check, 
  RefreshCw, 
  Save, 
  ArrowRight, 
  Eye, 
  FileCode,
  FileCheck,
  AlertCircle,
  FolderArchive,
  Users,
  CheckCircle2,
  Layers,
  FileArchive,
  BarChart3,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';
import { Rubric } from '../types';
import { useAppStore } from '../store/useAppStore';

export const IngestionView: React.FC = () => {
  const { setView, addToast, lanStatus } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const [ingestionMode, setIngestionMode] = useState<'single' | 'batch'>('single');
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState('rubric-waec-bece-english');
  
  // Metadata - empty by default so teacher fills them in manually
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [schoolName, setSchoolName] = useState('Achimota Basic School / JHS');
  const [subject, setSubject] = useState('English Language');
  const [gradeLevel, setGradeLevel] = useState('JHS 3');
  const [essayTitle, setEssayTitle] = useState('');

  // Single File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Batch / Multi-File State
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [autoGradeBatch, setAutoGradeBatch] = useState(true);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchResults, setBatchResults] = useState<any | null>(null);

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

  // Filename parser helper to auto-fill student name and ID if present in uploaded filename
  const parseFilenamePreview = (filename: string) => {
    const stem = filename.replace(/\.[^/.]+$/, '');
    const parts = stem.split(/[_-]+/).filter(Boolean);
    const idParts: string[] = [];
    const nameParts: string[] = [];
    
    parts.forEach(p => {
      if (/^(BECE|WASSCE|WAEC|STU|\d{3,})$/i.test(p)) {
        idParts.push(p);
      } else if (!/^(written|scanned|scan|essay|composition|doc|docx|pdf|png|jpg|jpeg|draft|final)$/i.test(p)) {
        nameParts.push(p);
      }
    });

    const name = nameParts.length ? nameParts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
    const id = idParts.length ? idParts.join('-').toUpperCase() : '';
    return { name, id };
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleBatchFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setBatchFiles(filesArray);
      setBatchResults(null);
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

    // Auto-populate student name and ID if present in filename
    const { name, id } = parseFilenamePreview(file.name);
    if (name) setStudentName(name);
    if (id) setStudentId(id);
  };

  const handleBatchFilesSelected = (files: FileList) => {
    const filesArray = Array.from(files);
    setBatchFiles(filesArray);
    setBatchResults(null);
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
      if (extractedText.trim()) formData.append('raw_text', extractedText.trim());
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

      // Extract metadata from OCR text headers if present
      if (res.raw_extracted_text) {
        const text = res.raw_extracted_text;
        const nameMatch = text.match(/By:\s*([^\n\(\)]+)/i);
        const idMatch = text.match(/Index Number:\s*([^\n\(\)]+)/i) || text.match(/Student ID:\s*([^\n\(\)]+)/i);
        const gradeMatch = text.match(/\((JHS\s*\d|SHS\s*\d)\)/i);
        const firstLine = text.split('\n')[0]?.trim();

        if (nameMatch && nameMatch[1]) setStudentName(nameMatch[1].trim());
        if (idMatch && idMatch[1]) setStudentId(idMatch[1].trim());
        if (gradeMatch && gradeMatch[1]) setGradeLevel(gradeMatch[1].trim());
        if (firstLine && firstLine.length < 80 && !firstLine.toLowerCase().startsWith('by:')) {
          setEssayTitle(firstLine);
        }
      }
      addToast({
        type: 'success',
        title: 'OCR Complete',
        message: `Extracted ${res.word_count} words from ${res.file_type} upload.`
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'OCR Failed', message: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunBatchIngest = async () => {
    if (batchFiles.length === 0) {
      addToast({ type: 'warning', title: 'Files Missing', message: 'Please select or drag-and-drop essay files / ZIP archive.' });
      return;
    }

    setIsBatchUploading(true);
    try {
      const formData = new FormData();
      batchFiles.forEach((f) => formData.append('files', f));
      formData.append('rubric_id', selectedRubricId);
      formData.append('school_name', schoolName);
      formData.append('subject', subject);
      formData.append('grade_level', gradeLevel);
      formData.append('auto_grade', autoGradeBatch.toString());

      const res = await api.batchUploadDocuments(formData);
      setBatchResults(res);
      addToast({
        type: 'success',
        title: 'Batch Complete',
        message: `Processed ${res.total_processed} essays (${res.total_graded} graded).`
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Batch Upload Failed', message: e.message });
    } finally {
      setIsBatchUploading(false);
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
        title: 'Evaluation Complete',
        message: `Grade: ${evalRes.letter_grade} (${evalRes.percentage}%)`
      });
      setView('review', currentEssayId);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Grading Error', message: e.message });
    } finally {
      setIsEvaluating(false);
    }
  };

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* View Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-['Outfit']">
              Upload & OCR
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Upload individual documents or batch-process an entire class via ZIP archives.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIngestionMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              ingestionMode === 'single'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Single Essay</span>
          </button>
          <button
            onClick={() => setIngestionMode('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              ingestionMode === 'batch'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Batch Upload</span>
          </button>
        </div>
      </div>

      {ingestionMode === 'single' ? (
        <>
          {/* Metadata & Rubric Assignment Form */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Student & Assessment Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Student Full Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Index / Student ID</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter ID number"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Marking Scheme</label>
                <select
                  value={selectedRubricId}
                  onChange={(e) => setSelectedRubricId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-primary-700 dark:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Essay Title / Topic</label>
                <input
                  type="text"
                  value={essayTitle}
                  onChange={(e) => setEssayTitle(e.target.value)}
                  placeholder="Enter essay title"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Subject & Grade</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* OpenCV Controls & Split Screen Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {lanStatus?.tesseract_installed === false && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-300 text-sm space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Tesseract OCR Not Detected</span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-600 dark:text-amber-300">
                    Image OCR will use fallback mode. For best results, upload <strong>PDF, DOCX, or TXT</strong> files.
                  </p>
                </div>
              )}

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50/50 dark:hover:bg-gray-800 transition text-center cursor-pointer space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.bmp,.tiff,.webp"
                  onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile ? selectedFile.name : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, PDF, DOCX, TXT
                  </p>
                </div>
              </div>

              {/* OpenCV Image Cleaning Controls */}
              <div className="glass-panel p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Image Cleaning Filters</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <label className="flex items-center justify-between text-gray-700 dark:text-gray-300 cursor-pointer">
                    <span>Denoise (Clean Paper Noise)</span>
                    <input
                      type="checkbox"
                      checked={denoise}
                      onChange={(e) => setDenoise(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-gray-700 dark:text-gray-300 cursor-pointer">
                    <span>Deskewing (Straighten Lines)</span>
                    <input
                      type="checkbox"
                      checked={deskew}
                      onChange={(e) => setDeskew(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-gray-700 dark:text-gray-300 cursor-pointer">
                    <span>Adaptive Thresholding</span>
                    <input
                      type="checkbox"
                      checked={adaptiveThreshold}
                      onChange={(e) => setAdaptiveThreshold(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-gray-700 dark:text-gray-300 cursor-pointer">
                    <span>Contrast Enhancement</span>
                    <input
                      type="checkbox"
                      checked={contrastEnhance}
                      onChange={(e) => setContrastEnhance(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                </div>

                <button
                  onClick={handleRunOCRUpload}
                  disabled={isUploading || (!selectedFile && !extractedText)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-[#0077b6] hover:bg-[#005f93] text-white transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>{isUploading ? 'Processing...' : 'Run OCR'}</span>
                </button>
              </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-panel rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span>Extracted Text</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                      Words: <strong className="text-amber-600 dark:text-amber-400">{wordCount}</strong>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCorrection}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition"
                    >
                      <Save className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleGradeWithAI}
                      disabled={isEvaluating || !extractedText.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#0077b6] hover:bg-[#005f93] text-white transition shadow-sm disabled:opacity-50"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Grade Essay</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 min-h-[380px]">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/30 flex flex-col items-center justify-center overflow-auto max-h-[420px]">
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Document Scan"
                        className="max-h-96 w-auto object-contain rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                      />
                    ) : (
                      <div className="text-center p-6 text-gray-400 dark:text-gray-500 space-y-2">
                        <ImageIcon className="w-12 h-12 mx-auto" />
                        <p className="text-sm">No scan preview loaded</p>
                        <p className="text-xs text-gray-400">PDF and DOCX extracts appear in the editor</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col">
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      placeholder="Extracted essay text will appear here. Edit or correct text before grading..."
                      className="w-full flex-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-gray-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none min-h-[340px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* BATCH / ZIP CLASS INGESTION WORKSPACE */
        <div className="space-y-6">
          
          {/* Class Assessment Options Panel */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>Class Assessment Setup</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Grade Level</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Evaluation Rubric</label>
                <select
                  value={selectedRubricId}
                  onChange={(e) => setSelectedRubricId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-primary-700 dark:text-primary-400 font-medium"
                >
                  {rubrics.map((r) => (
                    <option key={r.id} value={r.id}>{r.title} ({r.total_points} pts)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGradeBatch}
                  onChange={(e) => setAutoGradeBatch(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Automatically grade all essays after ingestion</span>
              </label>

              <span className="text-xs text-gray-500 dark:text-gray-400">
                Up to 50 essays per batch
              </span>
            </div>
          </div>

          {/* Batch Drag-Drop Area & Pre-Ingestion Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Dropzone & Action Button */}
            <div className="lg:col-span-5 space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBatchFileDrop}
                onClick={() => batchFileInputRef.current?.click()}
                className="p-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50/50 dark:hover:bg-gray-800 transition text-center cursor-pointer space-y-3"
              >
                <input
                  ref={batchFileInputRef}
                  type="file"
                  multiple
                  accept=".zip,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.bmp,.tiff,.webp"
                  onChange={(e) => e.target.files && handleBatchFilesSelected(e.target.files)}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mx-auto flex items-center justify-center">
                  <FolderArchive className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Drop ZIP Archive or Multiple Files
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select .pdf, .docx, .png, or .zip with student essays
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2">
                    Tip: Filenames like <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Kofi_Mensah_BECE_001.pdf</code> auto-extract names & IDs
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunBatchIngest}
                disabled={isBatchUploading || batchFiles.length === 0}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-[#0077b6] hover:bg-[#005f93] text-white shadow-sm disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isBatchUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Batch...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Grade ({batchFiles.length} files)</span>
                  </>
                )}
              </button>
            </div>

            {/* Pre-Ingestion File & Parsed Student List */}
            <div className="lg:col-span-7">
              <div className="glass-panel p-5 rounded-xl space-y-3 max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 text-sm">
                  <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FileArchive className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span>Selected Files ({batchFiles.length})</span>
                  </span>
                  {batchFiles.length > 0 && (
                    <button
                      onClick={() => setBatchFiles([])}
                      className="text-gray-500 hover:text-red-500 text-xs font-medium transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {batchFiles.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500 space-y-2">
                    <Users className="w-10 h-10 mx-auto" />
                    <p className="text-sm">No files selected yet</p>
                    <p className="text-xs text-gray-400">Drop files into the zone on the left</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {batchFiles.map((file, idx) => {
                      const parsed = parseFilenamePreview(file.name);
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-800/40 px-2 rounded-lg transition">
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-gray-400 font-mono text-xs">{idx + 1}.</span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <span>{parsed.name}</span>
                                <span className="px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-mono text-xs">
                                  {parsed.id}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                            Ready
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Batch Results Summary Card */}
          {batchResults && (
            <div className="glass-panel p-6 rounded-xl border-green-200 dark:border-green-800 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-600 text-white">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg font-['Outfit']">
                      Batch Complete
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Processed <strong className="text-green-600 dark:text-green-400">{batchResults.total_processed} essays</strong> ({batchResults.total_graded} graded)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setView('review')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>
                  <a
                    href={api.getCsvExportUrl(selectedRubricId)}
                    download="Class_Grade_Sheet.csv"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#0077b6] hover:bg-[#005f93] text-white transition"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>
                </div>
              </div>

              {/* Batch Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 font-medium text-xs uppercase">
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Index ID</th>
                      <th className="py-2 px-3">File Type</th>
                      <th className="py-2 px-3">Words</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {batchResults.results.map((res: any, rids: number) => (
                      <tr key={rids} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{res.student_name}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-300">{res.student_id}</td>
                        <td className="py-2.5 px-3 text-gray-500">{res.file_type}</td>
                        <td className="py-2.5 px-3 font-mono">{res.word_count}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            res.status === 'EVALUATED'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {res.evaluation ? (
                            <span className="text-green-700 dark:text-green-400 font-mono">
                              {res.evaluation.overall_score}/{res.evaluation.max_score} ({res.evaluation.letter_grade})
                            </span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
