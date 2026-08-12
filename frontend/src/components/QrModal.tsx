import React from 'react';
import { X, Smartphone, Wifi, QrCode as QrIcon, Check, Copy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const QrModal: React.FC = () => {
  const { isQrModalOpen, setQrModalOpen, lanStatus, addToast } = useAppStore();
  const [copied, setCopied] = React.useState(false);

  if (!isQrModalOpen) return null;

  const lanUrl = lanStatus?.frontend_url || `http://${lanStatus?.host_ip || '192.168.1.105'}:3000`;

  const copyUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'LAN Host Copied',
      message: `${lanUrl} is ready to paste into any mobile browser.`
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      aria-describedby="qr-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="glass-panel relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="qr-modal-title" className="font-bold text-slate-900 dark:text-white text-base">Classroom Mobile Pairing</h3>
              <p id="qr-modal-desc" className="text-xs text-slate-500 dark:text-slate-400">Connect phones & tablets over School Wi-Fi</p>
            </div>
          </div>
          <button
            onClick={() => setQrModalOpen(false)}
            aria-label="Close mobile pairing modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-5">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Ensure your secondary device (teacher tablet, phone, or laptop) is connected to the same classroom Wi-Fi router or hotspot, then scan below:
          </p>

          {/* QR Code Container */}
          <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border border-slate-200">
            {lanStatus?.qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${lanStatus.qr_code_base64}`}
                alt="LAN QR Code"
                className="w-48 h-48 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400">
                <QrIcon className="w-20 h-20 text-slate-400" />
              </div>
            )}
          </div>

          {/* LAN URL Box */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400 font-bold truncate">
              {lanUrl}
            </span>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shrink-0 ml-2"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero Internet / 100% Offline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Responsive Web App</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={() => setQrModalOpen(false)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
