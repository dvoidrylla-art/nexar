import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Product } from '../types';

interface ProductsScreenProps {
  products: Product[];
  currency: string;
  onOpenAddProduct: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickRestock: (product: Product) => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  products,
  currency,
  onOpenAddProduct,
  onSelectProduct,
  onQuickRestock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  const activeProducts = products.filter((p) => !p.isArchived);

  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterMode === 'low_stock') {
      return p.currentStock > 0 && p.currentStock <= p.minStock;
    }
    if (filterMode === 'out_of_stock') {
      return p.currentStock <= 0;
    }
    return true;
  });

  const lowStockCount = activeProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = activeProducts.filter((p) => p.currentStock <= 0).length;

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Products</h2>
          <p className="text-xs text-slate-400">
            {activeProducts.length} items in your catalog
          </p>
        </div>

        <button
          onClick={onOpenAddProduct}
          className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products by name, category, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`py-1 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({activeProducts.length})
          </button>

          <button
            onClick={() => setFilterMode('low_stock')}
            className={`py-1 px-3 rounded-lg text-xs font-medium whitespace-nowrap flex items-center space-x-1 transition ${
              filterMode === 'low_stock'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Stock ({lowStockCount})</span>
          </button>

          {outOfStockCount > 0 && (
            <button
              onClick={() => setFilterMode('out_of_stock')}
              className={`py-1 px-3 rounded-lg text-xs font-medium whitespace-nowrap flex items-center space-x-1 transition ${
                filterMode === 'out_of_stock'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔴</span>
              <span>Out of Stock ({outOfStockCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Products List or Empty State (Requirement 8) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 mt-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-2xl">
            📦
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {searchQuery ? 'No matching products found' : 'Your inventory starts here 📦'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Add your first product and Kora will start tracking your stock.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={onOpenAddProduct}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.currentStock <= 0;
            const isLow = !isOutOfStock && prod.currentStock <= prod.minStock;
            const profitPerUnit = prod.sellingPrice - prod.purchasePrice;
            const margin =
              prod.sellingPrice > 0 ? ((profitPerUnit / prod.sellingPrice) * 100).toFixed(1) : '0';

            return (
              <div
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition shadow-sm group active:scale-98"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isOutOfStock
                        ? 'bg-rose-950/60 border border-rose-800 text-rose-400'
                        : isLow
                        ? 'bg-amber-950/60 border border-amber-800/80 text-amber-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate">
                        {prod.name}
                      </div>
                      {/* Subtle stock warnings (Requirement 16) */}
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800 shrink-0">
                          🔴 Out of stock
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800 shrink-0">
                          {prod.currentStock} left ⚠️
                        </span>
                      ) : null}
                    </div>

                    {/* Stock, Category, Cost, and Profit Margin (Requirement 18) */}
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 truncate">
                      <span>{prod.category}</span>
                      <span>•</span>
                      <span>Cost: {prod.purchasePrice.toLocaleString()} {currency}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        Margin {margin}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center space-x-3">
                  <div>
                    <div className="font-black text-sm text-white">
                      {prod.sellingPrice.toLocaleString()} {currency}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {!isOutOfStock && !isLow && `${prod.currentStock} in stock`}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
