import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Package,
  Store,
  Tag,
  DollarSign,
  Layers,
} from 'lucide-react';
import { BusinessCategory, BusinessProfile } from '../types';
import { KoraLogo } from './KoraLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (businessData: {
    name: string;
    type: BusinessCategory;
    ownerName: string;
    currency: string;
    firstProduct?: {
      name: string;
      purchasePrice: number;
      sellingPrice: number;
      currentStock: number;
      minStock: number;
      supplier?: string;
    };
  }) => void;
}

const CATEGORIES: { label: BusinessCategory; icon: string; desc: string }[] = [
  { label: 'Clothing', icon: '👕', desc: 'Shirts, dresses, fabrics & wear' },
  { label: 'Shoes', icon: '👟', desc: 'Sneakers, sandals & footwear' },
  { label: 'Electronics', icon: '💻', desc: 'Appliances, gadgets & gear' },
  { label: 'Phone accessories', icon: '📱', desc: 'Chargers, cases, cables' },
  { label: 'Cosmetics', icon: '💄', desc: 'Beauty, skincare & perfumes' },
  { label: 'Grocery', icon: '🥑', desc: 'Food items & daily essentials' },
  { label: 'General retail', icon: '🛒', desc: 'Varied goods & supermarket' },
  { label: 'Other', icon: '📦', desc: 'Specialized or artisan products' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Business profile state
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('Clothing');
  const [currency, setCurrency] = useState('CFA');

  // First product state
  const [productName, setProductName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [initialStock, setInitialStock] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('5');
  const [supplier, setSupplier] = useState('');

  if (!isOpen) return null;

  const handleFinish = (includeProduct: boolean) => {
    onComplete({
      name: businessName.trim() || 'My Business',
      type: selectedCategory,
      ownerName: ownerName.trim() || 'Owner',
      currency,
      firstProduct:
        includeProduct && productName.trim() && sellingPrice
          ? {
              name: productName.trim(),
              purchasePrice: parseFloat(purchasePrice) || 0,
              sellingPrice: parseFloat(sellingPrice) || 0,
              currentStock: parseInt(initialStock, 10) || 0,
              minStock: parseInt(minStock, 10) || 3,
              supplier: supplier.trim() || undefined,
            }
          : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Step indicator */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <KoraLogo size="xs" />
            <span className="font-semibold text-slate-200 text-sm">Welcome to Kora</span>
          </div>
          <div className="text-xs text-slate-400 font-medium">Step {step} of 4</div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* SCREEN 1: Welcome to Kora */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center py-4 space-y-6">
              <KoraLogo size="xl" />

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to Kora</h2>
                <p className="text-slate-400 text-sm mt-1.5 max-w-xs">
                  Your AI-powered business assistant in your pocket.
                </p>
              </div>

              <div className="w-full space-y-3.5 text-left pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amina"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amina Fashion Store"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
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

              <button
                onClick={() => setStep(2)}
                className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SCREEN 2: Business Type */}
          {step === 2 && (
            <div className="py-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">What type of business do you run?</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kora adapts inventory insights and pricing logic to your business model.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setSelectedCategory(cat.label)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cat.icon}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="font-semibold text-xs text-white">{cat.label}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {cat.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: Add First Product */}
          {step === 3 && (
            <div className="py-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Let's add your first product</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Start tracking stock, cost, and sales profit right away. You can also skip this.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Blue T-Shirt"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Purchase Price ({currency})
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Selling Price ({currency}) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Min Alert Stock
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supplier (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Local Supplier / Dakar Textiles"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setStep(4)}
                  className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
                >
                  <span>Save Product</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: You're ready */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center py-6 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">You're ready!</h2>
                <p className="text-slate-400 text-sm mt-1.5 max-w-xs">
                  Start managing your business with Kora.
                </p>
              </div>

              <div className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{businessName || 'Your Business'} profile initialized</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Currency configured to {currency}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>
                    {productName.trim()
                      ? `Added 1st product: ${productName}`
                      : 'Inventory ready for your first items'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>AI Assistant Kora activated and watching data</span>
                </div>
              </div>

              <button
                onClick={() => handleFinish(!!productName.trim())}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/25"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
