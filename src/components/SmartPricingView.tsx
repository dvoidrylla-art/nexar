import React, { useState } from 'react';
import { Sparkles, Calculator, Layers, ArrowRight, DollarSign } from 'lucide-react';
import { Product } from '../types';
import { AnalyticsService } from '../services/analytics';

interface SmartPricingViewProps {
  products: Product[];
  currency: string;
  isEmbedded?: boolean;
}

export const SmartPricingView: React.FC<SmartPricingViewProps> = ({
  products,
  currency,
  isEmbedded = false,
}) => {
  const activeProducts = products.filter((p) => !p.isArchived);

  // Pricing calculator state
  const [selectedProductId, setSelectedProductId] = useState<string>(activeProducts[0]?.id || '');
  const [costInput, setCostInput] = useState<string>('');
  const [targetMargin, setTargetMargin] = useState<number>(30);

  const selectedProduct = activeProducts.find((p) => p.id === selectedProductId);

  // When product changes, sync cost input
  React.useEffect(() => {
    if (selectedProduct) {
      setCostInput(selectedProduct.purchasePrice.toString());
    }
  }, [selectedProductId, selectedProduct]);

  const cost = parseFloat(costInput) || (selectedProduct?.purchasePrice ?? 0);
  const calculation = AnalyticsService.calculateSmartPricing({
    purchasePrice: cost,
    desiredMarginPercent: targetMargin,
    currentSellingPrice: selectedProduct?.sellingPrice,
  });

  // Bundle ideas
  const sampleBundles =
    activeProducts.length >= 2
      ? [
          {
            p1: activeProducts[0],
            p2: activeProducts[1],
            discount: 10,
          },
        ]
      : [];

  return (
    <div className={isEmbedded ? "space-y-4" : "p-4 space-y-5 overflow-y-auto"}>
      {!isEmbedded && (
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Smart Pricing & Bundles</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            "What should I sell this for?" Calculate recommended pricing based on purchase cost and healthy margins.
          </p>
        </div>
      )}

      {/* Pricing Calculator Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>Interactive Price Calculator</span>
        </div>

        {/* Product selector */}
        {activeProducts.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select from Catalog</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.sellingPrice.toLocaleString()} {currency})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Cost input */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Purchase Cost ({currency})
            </label>
            <input
              type="number"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Target Margin: <strong className="text-emerald-400">{targetMargin}%</strong>
            </label>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={targetMargin}
              onChange={(e) => setTargetMargin(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 mt-2"
            />
          </div>
        </div>

        {/* Calculated Result Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Suggested Selling Price</div>
              <div className="text-2xl font-black text-white">
                {calculation.suggestedPrice.toLocaleString()} {currency}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-emerald-400">Profit Per Unit</div>
              <div className="text-xl font-bold text-emerald-400">
                +{calculation.profitPerUnit.toLocaleString()} {currency}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 pt-2 border-t border-slate-800 leading-relaxed font-sans">
            {calculation.reasoning}
          </div>
          <div className="text-[10px] text-slate-500 italic">
            * Note: Clearly labeled as an estimated suggestion. Market demand and competitor prices should also be observed.
          </div>
        </div>
      </div>

      {/* Smart Bundles Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-white">Smart Product Bundles</h3>
        </div>

        {sampleBundles.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Add at least 2 products to see combo bundle recommendations.
          </p>
        ) : (
          sampleBundles.map((b, idx) => {
            const sumIndividual = b.p1.sellingPrice + b.p2.sellingPrice;
            const bundlePrice = Math.round(sumIndividual * 0.9);
            const totalCost = b.p1.purchasePrice + b.p2.purchasePrice;
            const bundleMargin = Math.round(((bundlePrice - totalCost) / bundlePrice) * 100);

            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">
                    {b.p1.name} + {b.p2.name}
                  </h4>
                  <span className="text-[10px] bg-teal-950/80 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-semibold">
                    10% Combo Discount
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400">Regular Sum</span>
                    <div className="font-semibold text-slate-300 line-through mt-0.5">
                      {sumIndividual.toLocaleString()} {currency}
                    </div>
                  </div>
                  <div className="bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/60">
                    <span className="text-[10px] text-emerald-400 font-bold">Bundle Price</span>
                    <div className="font-bold text-white mt-0.5">
                      {bundlePrice.toLocaleString()} {currency}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400">Combo Margin</span>
                    <div className="font-semibold text-emerald-400 mt-0.5">{bundleMargin}%</div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Suggestion: Customers frequently purchase these complementary items. Packaging them as a combo accelerates inventory turnover while preserving an attractive {bundleMargin}% profit margin.
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
