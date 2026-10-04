import React, { useState } from 'react';
import {
  X,
  BarChart3,
  TrendingUp,
  ArrowDownRight,
  Package,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';
import { Sale, Expense, Product, Customer } from '../types';

interface ReportsViewProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  isOpen,
  onClose,
  currency,
  sales,
  expenses,
  products,
  customers,
}) => {
  const [filter, setFilter] = useState<DateFilter>('month');

  if (!isOpen) return null;

  // Filter sales and expenses by selected period
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filteredSales = sales.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'today') return s.date.startsWith(todayStr);

    const sDate = new Date(s.date);
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sDate >= weekAgo;
    }
    if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return sDate >= monthAgo;
    }
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'today') return e.date.startsWith(todayStr);

    const eDate = new Date(e.date);
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return eDate >= weekAgo;
    }
    if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return eDate >= monthAgo;
    }
    return true;
  });

  const totalSales = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalGrossProfit = filteredSales.reduce((acc, s) => acc + s.estimatedGrossProfit, 0);
  const netEstimatedProfit = totalGrossProfit - totalExpenses;

  const totalUnitsSold = filteredSales.reduce(
    (acc, s) => acc + s.items.reduce((iAcc, it) => iAcc + it.quantity, 0),
    0
  );

  // Top products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const s of filteredSales) {
    for (const item of s.items) {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.subtotal;
    }
  }

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

  // Inventory value
  const totalInventoryCost = products
    .filter((p) => !p.isArchived)
    .reduce((acc, p) => acc + Math.max(0, p.currentStock) * p.purchasePrice, 0);

  const totalInventorySelling = products
    .filter((p) => !p.isArchived)
    .reduce((acc, p) => acc + Math.max(0, p.currentStock) * p.sellingPrice, 0);

  // Outstanding debts
  const totalDebts = customers.reduce((acc, c) => acc + (c.outstandingDebt || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Business Reports</h2>
              <p className="text-[11px] text-slate-400">Revenue, profit margins, and performance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['today', 'week', 'month', 'all'] as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  filter === f
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'today' ? 'Today' : f === 'week' ? '7 Days' : f === 'month' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Total Sales</div>
              <div className="text-xl font-black text-white mt-0.5">
                {totalSales.toLocaleString()} {currency}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {filteredSales.length} transaction(s) • {totalUnitsSold} units
              </div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Operating Expenses</div>
              <div className="text-xl font-black text-rose-400 mt-0.5">
                {totalExpenses.toLocaleString()} {currency}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {filteredExpenses.length} expense record(s)
              </div>
            </div>

            <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-900/60">
              <div className="text-xs text-emerald-400">Gross Profit</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">
                +{totalGrossProfit.toLocaleString()} {currency}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Margin: {totalSales > 0 ? Math.round((totalGrossProfit / totalSales) * 100) : 0}%
              </div>
            </div>

            <div className="bg-teal-950/40 p-3.5 rounded-xl border border-teal-900/60">
              <div className="text-xs text-teal-400">Estimated Net Profit</div>
              <div
                className={`text-xl font-black mt-0.5 ${
                  netEstimatedProfit >= 0 ? 'text-teal-300' : 'text-rose-400'
                }`}
              >
                {netEstimatedProfit >= 0 ? '+' : ''}
                {netEstimatedProfit.toLocaleString()} {currency}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Gross profit minus expenses</div>
            </div>
          </div>

          {/* Balance sheet health */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400">Inventory At Cost</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">
                {totalInventoryCost.toLocaleString()} {currency}
              </div>
              <div className="text-[10px] text-slate-500">Retail value: {totalInventorySelling.toLocaleString()}</div>
            </div>

            <div>
              <div className="text-[11px] text-rose-400">Outstanding Customer Debt</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">
                {totalDebts.toLocaleString()} {currency}
              </div>
              <div className="text-[10px] text-slate-500">Money owed to business</div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Selling Products ({topProducts.length})</span>
            </h3>

            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No sales recorded for this period.</p>
            ) : (
              <div className="space-y-1.5">
                {topProducts.slice(0, 5).map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-800/40 rounded-xl text-xs flex items-center justify-between border border-slate-800"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-white">{prod.name}</div>
                        <div className="text-[10px] text-slate-400">{prod.qty} units sold</div>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-400">
                      {prod.revenue.toLocaleString()} {currency}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
