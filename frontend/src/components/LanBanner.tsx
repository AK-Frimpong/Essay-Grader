import React from 'react';
import { Wifi, Smartphone, Radio, Copy, Check, AlertTriangle, DownloadCloud, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const LanBanner: React.FC = () => {
  const { lanStatus, setQrModalOpen, addToast } = useAppStore();
  const [copied, setCopied] = React.useState(false);
  const [copiedCmd, setCopiedCmd] = React.useState(false);

  const lanUrl = lanStatus?.frontend_url || `http://${lanStatus?.host_ip || '192.168.1.105'}:3000`;
  const tesseractMissing = lanStatus?.tesseract_installed === false;
  const modelMissing = lanStatus?.ollama_connected === true && lanStatus?.ollama_model_installed === false;
  const activeModel = lanStatus?.active_model || 'phi3:mini-4k-instruct';

  const copyLanUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'LAN URL Copied',
      message: `${lanUrl} copied to clipboard for secondary teacher laptops/tablets.`
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const copyPullCommand = () => {
    const cmd = `ollama pull ${activeModel}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    addToast({
      type: 'success',
      title: 'Ollama Pull Command Copied',
      message: `'${cmd}' copied to clipboard. Run this in your host terminal to download local model.`
    });
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 text-xs transition-colors">
      <div className="flex flex-col gap-2 xl:max-w-[1600px] xl:mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 font-semibold">
              <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>LAN Broadcast Active</span>
            </div>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Classroom Host Address:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{lanUrl}</span>
            <button
              onClick={copyLanUrl}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title="Copy LAN address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span className="hidden md:inline">
              Local Ollama Engine: <strong className="text-slate-800 dark:text-slate-200">{activeModel}</strong>
            </span>
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition"
            >
              <Smartphone className="w-3 h-3" />
              <span>Connect Mobile / Tablet</span>
            </button>
          </div>
        </div>

        {/* OCR Diagnostic Warning Badge if Tesseract is missing on host */}
        {tesseractMissing && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Tesseract OCR Missing:</strong> Image OCR scan relies on OpenCV fallback or direct PDF/DOCX/Text uploads.
                Install binary via <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono text-[11px]">sudo apt-get install tesseract-ocr</code> or Windows installer.
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 font-medium text-amber-800 dark:text-amber-200">
              <FileText className="w-3.5 h-3.5" />
              <span>Fallback Ready</span>
            </div>
          </div>
        )}

        {/* Ollama Model Auto-Pull Notice if model is missing on host */}
        {modelMissing && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
            <div className="flex items-center gap-2">
              <DownloadCloud className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                <strong>Ollama Model Missing:</strong> Local model <code className="bg-indigo-500/20 px-1 py-0.5 rounded font-mono text-[11px]">{activeModel}</code> is not pulled. Run <code className="bg-indigo-500/20 px-1 py-0.5 rounded font-mono text-[11px]">ollama pull {activeModel}</code> on host server.
              </span>
            </div>
            <button
              onClick={copyPullCommand}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition shrink-0"
            >
              {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>Copy Command</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
