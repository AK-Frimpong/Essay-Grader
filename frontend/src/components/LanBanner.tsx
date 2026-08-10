import React from 'react';
import { Wifi, Smartphone, Radio, Copy, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const LanBanner: React.FC = () => {
  const { lanStatus, setQrModalOpen, addToast } = useAppStore();
  const [copied, setCopied] = React.useState(false);

  const lanUrl = lanStatus?.frontend_url || `http://${lanStatus?.host_ip || '192.168.1.105'}:3000`;

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

  return (
    <div className="w-full bg-gradient-to-r from-emerald-50 via-slate-50 to-amber-50 dark:from-gh-emerald-950/80 dark:via-gh-slate-900/90 dark:to-gh-gold-950/80 border-b border-emerald-200 dark:border-gh-emerald-800/30 px-4 py-2 text-xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 dark:bg-gh-emerald-900/60 border border-emerald-300 dark:border-gh-emerald-600/40 text-emerald-800 dark:text-gh-emerald-300 font-semibold">
            <Radio className="w-3 h-3 text-emerald-600 dark:text-gh-emerald-400 animate-pulse" />
            <span>LAN Broadcast Active</span>
          </div>
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Classroom Host Address:</span>
          <span className="font-mono font-bold text-amber-700 dark:text-gh-gold-400">{lanUrl}</span>
          <button
            onClick={copyLanUrl}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            title="Copy LAN address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-gh-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span className="hidden md:inline">
            Local Ollama Engine: <strong className="text-slate-800 dark:text-slate-200">{lanStatus?.active_model || 'phi3:mini-4k-instruct'}</strong>
          </span>
          <button
            onClick={() => setQrModalOpen(true)}
            className="flex items-center gap-1 text-emerald-700 dark:text-gh-emerald-400 hover:text-emerald-800 dark:hover:text-gh-emerald-300 font-medium transition"
          >
            <Smartphone className="w-3 h-3" />
            <span>Connect Mobile / Tablet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
