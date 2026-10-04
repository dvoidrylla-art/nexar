import React, { useState } from 'react';
import {
  X,
  Settings,
  Store,
  DollarSign,
  Download,
  Trash2,
  Users,
  Shield,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { BusinessProfile, BusinessCategory, User, Role } from '../types';
import { KoraLogo } from './KoraLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessProfile | null;
  user: User | null;
  firebaseUser?: any | null;
  onUpdateBusiness: (updated: Partial<BusinessProfile>) => void;
  onLoadDemoStore: () => void;
  onExportData: () => void;
  onClearData: () => void;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  onSyncFirestore?: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  business,
  user,
  firebaseUser,
  onUpdateBusiness,
  onLoadDemoStore,
  onExportData,
  onClearData,
  onSignInGoogle,
  onSignOut,
  onSyncFirestore,
}) => {
  const [businessName, setBusinessName] = useState(business?.name || '');
  const [ownerName, setOwnerName] = useState(business?.ownerName || '');
  const [currency, setCurrency] = useState(business?.currency || 'CFA');
  const [phone, setPhone] = useState(business?.phone || '');
  const [category, setCategory] = useState<BusinessCategory>(business?.type || 'Clothing');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusiness({
      name: businessName.trim() || 'My Business',
      ownerName: ownerName.trim() || 'Owner',
      currency,
      phone: phone.trim() || undefined,
      type: category,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Business Settings</h2>
              <p className="text-[11px] text-slate-400">Profile, currency, and data management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {savedNotice && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Settings updated successfully.</span>
            </div>
          )}

          {/* Quick Demo Preload (Requirement 53) */}
          <div className="p-3.5 bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-700/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Load Official Demo Store</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                Req #53
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Loads <strong>Demo Fashion Store</strong> with Blue T-Shirt (20 stock), Black Jeans (10 stock), and customer <strong>Jean</strong> for immediate testing.
            </p>
            <button
              onClick={() => {
                onLoadDemoStore();
                onClose();
              }}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Load Demo Fashion Store Now
            </button>
          </div>

          {/* Business Profile Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Store Profile
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="CFA">XOF / CFA Franc (CFA)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="GHS">Ghanaian Cedi (GH₵)</option>
                  <option value="KES">Kenyan Shilling (KSh)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Clothing">Clothing</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Phone accessories">Phone accessories</option>
                  <option value="Cosmetics">Cosmetics</option>
                  <option value="Grocery">Grocery</option>
                  <option value="General retail">General retail</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              Save Profile Changes
            </button>
          </form>

          {/* Cloud Database & Firebase Auth */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Firebase Cloud Sync & Auth</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${firebaseUser ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {firebaseUser ? 'Connected' : 'Local Only'}
              </span>
            </h3>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">
                    {firebaseUser ? firebaseUser.displayName || firebaseUser.email : 'Not signed in'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {firebaseUser ? firebaseUser.email : 'Sign in with Google to backup data to Cloud Firestore.'}
                  </div>
                </div>

                {firebaseUser ? (
                  <button
                    onClick={onSignOut}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium rounded-lg border border-slate-700 transition"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={onSignInGoogle}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-md shadow-emerald-500/20"
                  >
                    Google Sign-In
                  </button>
                )}
              </div>

              {firebaseUser && onSyncFirestore && (
                <button
                  onClick={onSyncFirestore}
                  className="w-full py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-semibold text-xs rounded-lg border border-emerald-800 transition"
                >
                  ⚡ Sync All Records to Firestore Now
                </button>
              )}
            </div>
          </div>

          {/* Employee Roles Structure Preview */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Team & Role Access</span>
            </h3>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Current Active User:</span>
                <strong className="text-white">
                  {user?.name || 'Amina'} ({user?.role || 'Owner'})
                </strong>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Role structure ready: Owner (full access), Manager (sales & inventory), Cashier (sales & payments), Stock Manager (inventory & restock).
              </div>
            </div>
          </div>

          {/* Data Export & Reset */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Data Management
            </h3>

            <div className="flex space-x-2">
              <button
                onClick={onExportData}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export Data (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to reset all business data? This action cannot be undone.'
                    )
                  ) {
                    onClearData();
                    onClose();
                  }
                }}
                className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition border border-rose-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* App Branding & Info */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <KoraLogo size="xs" />
              <span className="font-semibold text-slate-300">Kora OS</span>
              <span>• v1.2</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              AI Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
