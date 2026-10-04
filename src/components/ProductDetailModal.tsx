import React, { useState } from 'react';
import {
  X,
  Package,
  TrendingUp,
  History,
  Edit2,
  Archive,
  ShoppingBag,
  PlusCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Product, Sale, InventoryTransaction } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  currency: string;
  sales: Sale[];
  transactions: InventoryTransaction[];
  onClose: () => void;
  onEdit: (product: Product) => void;
  onRestock: (productId: string, quantity: number, unitCost?: number) => void;
  onSell: (product: Product) => void;
  onArchive: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  sales,
  transactions,
  onClose,
  onEdit,
  onRestock,
  onSell,
  onArchive,
}) => {
  const [restockQty, setRestockQty] = useState<string>('10');
  const [restockCost, setRestockCost] = useState<string>('');
  const [showRestockForm, setShowRestockForm] = useState<boolean>(false);

  if (!product) return null;

  // Profit calculations
  const profitPerUnit = product.sellingPrice - product.purchasePrice;
  const profitMargin =
    product.sellingPrice > 0
      ? Math.round((profitPerUnit / product.sellingPrice) * 100)
      : 0;

  // Filter sales involving this product
  const relevantSales = sales.filter((s) =>
    s.items.some((it) => it.productId === product.id)
  );

  const totalUnitsSold = relevantSales.reduce((acc, s) => {
    const item = s.items.find((it) => it.productId === product.id);
    return acc + (item?.quantity || 0);
  }, 0);

  const totalRevenueGenerated = relevantSales.reduce((acc, s) => {
    const item = s.items.find((it) => it.productId === product.id);
    return acc + (item?.subtotal || 0);
  }, 0);

  // Relevant inventory transactions
  const relevantTransactions = transactions.filter((t) => t.productId === product.id);

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(restockQty, 10);
    const cost = restockCost ? parseFloat(restockCost) : undefined;
    if (qty > 0) {
      onRestock(product.id, qty, cost);
      setShowRestockForm(false);
      setRestockQty('10');
      setRestockCost('');
    }
  };

  const isLowStock = product.currentStock <= product.minStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{product.name}</h2>
              <span className="text-[11px] text-slate-400">
                {product.category} {product.supplier ? `• Supplier: ${product.supplier}` : ''}
              </span>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Stock banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLowStock
                ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-200'
            }`}
          >
            <div>
              <div className="text-xs text-slate-400">Current Stock</div>
              <div className="text-2xl font-black text-white">{product.currentStock} units</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Min alert threshold: {product.minStock} units
              </div>
            </div>

            {isLowStock ? (
              <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-semibold bg-amber-950/80 px-2.5 py-1.5 rounded-lg border border-amber-800">
                <AlertTriangle className="w-4 h-4" />
                <span>Low Stock</span>
              </div>
            ) : (
              <div className="text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-1.5 rounded-lg border border-emerald-800">
                In Stock
              </div>
            )}
          </div>

          {/* Unit economics cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Selling Price</div>
              <div className="text-base font-bold text-white mt-0.5">
                {product.sellingPrice.toLocaleString()} {currency}
              </div>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Purchase Cost</div>
              <div className="text-base font-bold text-slate-300 mt-0.5">
                {product.purchasePrice.toLocaleString()} {currency}
              </div>
            </div>

            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/60">
              <div className="text-[11px] text-emerald-400">Profit Per Unit</div>
              <div className="text-base font-bold text-emerald-300 mt-0.5">
                +{profitPerUnit.toLocaleString()} {currency}
              </div>
            </div>

            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/60">
              <div className="text-[11px] text-emerald-400">Profit Margin</div>
              <div className="text-base font-bold text-emerald-300 mt-0.5">{profitMargin}%</div>
            </div>
          </div>

          {/* Sales Performance Summary */}
          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-800 flex justify-around text-center">
            <div>
              <div className="text-[11px] text-slate-400">Total Sold</div>
              <div className="text-lg font-bold text-white mt-0.5">{totalUnitsSold} units</div>
            </div>
            <div className="border-r border-slate-700/60" />
            <div>
              <div className="text-[11px] text-slate-400">Total Revenue</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {totalRevenueGenerated.toLocaleString()} {currency}
              </div>
            </div>
          </div>

          {/* Restock Form (Toggleable) */}
          {showRestockForm ? (
            <form
              onSubmit={handleRestockSubmit}
              className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Restock {product.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowRestockForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Quantity Added *</label>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Unit Cost ({currency})
                  </label>
                  <input
                    type="number"
                    placeholder={product.purchasePrice.toString()}
                    value={restockCost}
                    onChange={(e) => setRestockCost(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition"
              >
                Confirm Restock
              </button>
            </form>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  onClose();
                  onSell(product);
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-md shadow-emerald-500/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Sell This Product</span>
              </button>

              <button
                onClick={() => setShowRestockForm(true)}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition border border-slate-700"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Restock</span>
              </button>
            </div>
          )}

          {/* Inventory Movement History (Audit Trail) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Stock Movement Audit Trail</span>
            </h3>

            {relevantTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No movement recorded yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {relevantTransactions.slice(0, 6).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2 bg-slate-800/40 rounded-lg text-[11px] flex items-center justify-between border border-slate-800"
                  >
                    <div>
                      <span className="font-semibold text-white">{tx.type}</span>
                      <span className="text-slate-400 ml-1.5">
                        {tx.reason || (tx.quantityChange > 0 ? 'Stock intake' : 'Item sold')}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()} • {tx.previousStock} → {tx.newStock} units
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        tx.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
          <button
            onClick={() => {
              if (window.confirm(`Archive ${product.name}?`)) {
                onArchive(product.id);
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition border border-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
