import React, { useState } from 'react';
import {
  X,
  ArrowDownRight,
  Plus,
  Calendar,
  Filter,
  Search,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';

interface ExpensesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  expenses: Expense[];
  onOpenAddExpense: () => void;
}

export const ExpensesListModal: React.FC<ExpensesListModalProps> = ({
  isOpen,
  onClose,
  currency,
  expenses,
  onOpenAddExpense,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCat !== 'all' && e.category !== selectedCat) return false;
    return true;
  });

  const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Operating Expenses</h2>
              <p className="text-[11px] text-slate-400">
                {expenses.length} records • Total: {totalAmount.toLocaleString()} {currency}
              </p>
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
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Action button & search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAddExpense();
              }}
              className="py-2 px-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1 shrink-0 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Empty State (Requirement 8) */}
          {filtered.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3 my-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-2xl">
                💸
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {search ? 'No matching expenses' : 'Track where your money goes 💸'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  {search
                    ? 'Try searching with another keyword.'
                    : 'Record your expenses and Kora will help you understand your costs.'}
                </p>
              </div>
              {!search && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddExpense();
                  }}
                  className="py-2.5 px-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 transition shadow-lg shadow-rose-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-800/50 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-white truncate">{exp.category}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {exp.description}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(exp.date).toLocaleDateString()} • {exp.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-rose-400">
                      -{exp.amount.toLocaleString()} {currency}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
