import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { AnalyticsService } from '../services/analytics';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  initialProduct?: Product | null;
  onSaveProduct: (productData: {
    name: string;
    sku?: string;
    category: string;
    supplier?: string;
    purchasePrice: number;
    sellingPrice: number;
    currentStock: number;
    minStock: number;
  }) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  currency,
  initialProduct,
  onSaveProduct,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Clothing');
  const [supplier, setSupplier] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('5');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setSku(initialProduct.sku || '');
      setCategory(initialProduct.category || 'Clothing');
      setSupplier(initialProduct.supplier || '');
      setPurchasePrice(initialProduct.purchasePrice.toString());
      setSellingPrice(initialProduct.sellingPrice.toString());
      setCurrentStock(initialProduct.currentStock.toString());
      setMinStock(initialProduct.minStock.toString());
    } else {
      setName('');
      setSku('');
      setCategory('Clothing');
      setSupplier('');
      setPurchasePrice('');
      setSellingPrice('');
      setCurrentStock('10');
      setMinStock('5');
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const cost = parseFloat(purchasePrice) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const unitProfit = selling - cost;
  const marginPercent = selling > 0 ? Math.round((unitProfit / selling) * 100) : 0;

  const handleSmartPrice = (targetMargin: number) => {
    if (cost > 0) {
      const sp = AnalyticsService.calculateSmartPricing({
        purchasePrice: cost,
        desiredMarginPercent: targetMargin,
      });
      setSellingPrice(sp.suggestedPrice.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (cost < 0) {
      setError('Purchase cost cannot be negative.');
      return;
    }

    if (selling <= 0) {
      setError('Selling price must be greater than zero.');
      return;
    }

    onSaveProduct({
      name: name.trim(),
      sku: sku.trim() || undefined,
      category,
      supplier: supplier.trim() || undefined,
      purchasePrice: cost,
      sellingPrice: selling,
      currentStock: parseInt(currentStock, 10) || 0,
      minStock: parseInt(minStock, 10) || 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {initialProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-[11px] text-slate-400">Manage pricing, cost, and stock alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Blue T-Shirt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supplier (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dakar Textiles"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pricing & Margins */}
          <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Purchase Cost ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
                />
              </div>
            </div>

            {/* Smart Pricing Suggestion Helper */}
            {cost > 0 && (
              <div className="pt-1 border-t border-slate-700/60">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Quick Smart Pricing:</span>
                  </span>
                  <span className="text-emerald-400 font-medium">
                    Est. Margin: {marginPercent}% (+{unitProfit.toLocaleString()} {currency})
                  </span>
                </div>
                <div className="flex space-x-2">
                  {[25, 35, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSmartPrice(pct)}
                      className="flex-1 py-1 px-2 text-[10px] bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    >
                      {pct}% Margin
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stock Tracking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {initialProduct ? 'Current Stock' : 'Initial Stock'}
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              SKU / Barcode (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. TSH-BLU-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-500/20"
            >
              <span>{initialProduct ? 'Update Product' : 'Save Product'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
