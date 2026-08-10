import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  Smartphone, 
  ShieldCheck, 
  Sparkles, 
  FileCheck,
  CreditCard
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { HardwareSignature } from '../types';

export const LicenseModal: React.FC = () => {
  const { isLicenseModalOpen, setLicenseModalOpen, licenseStatus, setLicenseStatus, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'license' | 'momo'>('license');
  const [hwSignature, setHwSignature] = useState<HardwareSignature | null>(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // MoMo form state
  const [phone, setPhone] = useState('0244123456');
  const [network, setNetwork] = useState<'MTN_MOMO' | 'TELECEL_CASH' | 'AT_MONEY'>('MTN_MOMO');
  const [selectedTier, setSelectedTier] = useState({ credits: 200, ghs: 80 });
  const [isProcessingMomo, setIsProcessingMomo] = useState(false);

  useEffect(() => {
    if (isLicenseModalOpen) {
      api.getHardwareSignature().then(setHwSignature).catch(console.error);
      api.getLicenseStatus().then(setLicenseStatus).catch(console.error);
    }
  }, [isLicenseModalOpen]);

  if (!isLicenseModalOpen) return null;

  const handleActivateLicense = async () => {
    if (!licenseKeyInput.trim()) {
      addToast({ type: 'warning', title: 'License Empty', message: 'Please paste a valid RSA license payload.' });
      return;
    }
    setIsActivating(true);
    try {
      const res = await api.activateLicense(licenseKeyInput.trim());
      setLicenseStatus(res.status);
      addToast({
        type: 'success',
        title: 'License Activated!',
        message: res.message
      });
      setLicenseKeyInput('');
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Activation Failed',
        message: e.message || 'Invalid RSA signature for this hardware signature.'
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleGenerateTestLicense = async () => {
    setIsActivating(true);
    try {
      const res = await api.generateTestLicense("Achimota Secondary School (Ghana)", 500);
      setLicenseKeyInput(res.license_payload_b64);
      addToast({
        type: 'info',
        title: 'Test License Generated',
        message: 'Signed RSA license payload loaded. Click Activate to apply.'
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setIsActivating(false);
    }
  };

  const handleMomoTopup = async () => {
    setIsProcessingMomo(true);
    try {
      const res = await api.topupMoMo({
        phone_number: phone,
        network: network,
        amount_ghs: selectedTier.ghs,
        credits_requested: selectedTier.credits
      });
      addToast({
        type: 'success',
        title: 'MoMo Payment Approved',
        message: `Added ${res.credits_added} evaluation credits to local offline ledger.`
      });
      const updated = await api.getLicenseStatus();
      setLicenseStatus(updated);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Payment Failed', message: e.message });
    } finally {
      setIsProcessingMomo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel relative w-full max-w-2xl bg-white dark:bg-gh-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-slate-50 to-amber-50 dark:from-gh-slate-950 dark:via-gh-slate-900 dark:to-gh-emerald-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-gh-emerald-900/50 border border-emerald-300 dark:border-gh-emerald-600/40 text-emerald-700 dark:text-gh-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Offline RSA Licensing & Credit Ledger</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hardware UUID Binding & Paystack Ghana Mobile Money</p>
            </div>
          </div>
          <button
            onClick={() => setLicenseModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'license'
                ? 'border-emerald-600 dark:border-gh-emerald-500 text-emerald-700 dark:text-gh-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>RSA Hardware License</span>
          </button>
          <button
            onClick={() => setActiveTab('momo')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'momo'
                ? 'border-amber-600 dark:border-gh-gold-500 text-amber-700 dark:text-gh-gold-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Paystack Mobile Money Top-Up</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Hardware & License Status Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" /> Machine Signature
              </span>
              <p className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold truncate mt-1" title={hwSignature?.machine_uuid}>
                {hwSignature?.machine_uuid.slice(0, 16) || 'Detecting...'}...
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">MAC: {hwSignature?.mac_address}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-gh-emerald-400" /> License State
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-gh-emerald-950 text-emerald-800 dark:text-gh-emerald-300 border border-emerald-300 dark:border-gh-emerald-700/50">
                  {licenseStatus?.status || 'ACTIVE'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Valid: {licenseStatus?.valid_until || '2027'}</span>
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-1">{licenseStatus?.school_name}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-gh-gold-400" /> Remaining Credits
              </span>
              <p className="text-xl font-black text-amber-600 dark:text-gh-gold-400 font-['Outfit'] mt-1">
                {licenseStatus?.remaining_credits ?? 498} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">essays</span>
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Used: {licenseStatus?.used_credits ?? 2} of {licenseStatus?.allowed_credits ?? 500}</span>
            </div>
          </div>

          {activeTab === 'license' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Paste RSA-2048 Signed License String (.lic payload)
                  </label>
                  <button
                    onClick={handleGenerateTestLicense}
                    className="text-xs text-emerald-700 dark:text-gh-emerald-400 hover:text-emerald-800 dark:hover:text-gh-emerald-300 flex items-center gap-1 font-semibold transition"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate Test License
                  </button>
                </div>
                <textarea
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="eyJwYXlsb2FkIjogeyJzY2hvb2xfbmFtZSI6ICJHaGFuYSBFZHVjYXRpb24gU2VydmljZSJ9LCAic2lnbmF0dXJlX2I2NCI6IC4uLn0="
                  className="w-full h-28 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Offline licenses are signed by Ghana Ministry/District servers and verified locally against machine hardware.
                </p>
                <button
                  onClick={handleActivateLicense}
                  disabled={isActivating || !licenseKeyInput.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-emerald"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isActivating ? 'Verifying RSA...' : 'Activate License'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Purchase instant offline grading credits via Ghana Mobile Money when connected to WAN.
              </p>

              {/* Mobile Network Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Select Mobile Money Network</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'MTN_MOMO', label: 'MTN MoMo', color: 'border-amber-400 bg-amber-50 dark:bg-yellow-950/20 text-amber-800 dark:text-yellow-400' },
                    { id: 'TELECEL_CASH', label: 'Telecel Cash', color: 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400' },
                    { id: 'AT_MONEY', label: 'AT Money', color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNetwork(item.id as any)}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        network === item.id
                          ? `${item.color} ring-2 ring-amber-500 dark:ring-gh-gold-400`
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subscriber MoMo Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0244123456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Tier Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Select Credit Bundle</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { credits: 100, ghs: 45, label: '100 Essays (GHS 45)' },
                    { credits: 200, ghs: 80, label: '200 Essays (GHS 80)' },
                    { credits: 500, ghs: 180, label: '500 Essays (GHS 180)' },
                  ].map((tier) => (
                    <button
                      key={tier.credits}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`p-3 rounded-xl border text-center text-xs transition ${
                        selectedTier.credits === tier.credits
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-gh-emerald-950/40 text-emerald-800 dark:text-gh-emerald-300 font-bold ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div>{tier.credits} Credits</div>
                      <div className="font-bold text-amber-600 dark:text-gh-gold-400 mt-0.5">GHS {tier.ghs}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  onClick={handleMomoTopup}
                  disabled={isProcessingMomo}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-lg disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isProcessingMomo ? 'Authorizing MoMo OTP...' : `Top-Up GHS ${selectedTier.ghs} via MoMo`}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setLicenseModalOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
