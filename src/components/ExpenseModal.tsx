import React, { useState } from 'react';
import { X, ArrowDownRight, CheckCircle2, DollarSign } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onRecordExpense: (expenseData: {
    amount: number;
    category: ExpenseCategory;
    description: string;
    paymentMethod: PaymentMethod;
    date: string;
  }) => void;
}

const EXPENSE_CATEGORIES: { label: ExpenseCategory; icon: string }[] = [
  { label: 'Transport', icon: '🚗' },
  { label: 'Electricity', icon: '⚡' },
  { label: 'Rent', icon: '🏠' },
  { label: 'Salaries', icon: '👥' },
  { label: 'Packaging', icon: '📦' },
  { label: 'Supplies', icon: '📎' },
  { label: 'Marketing', icon: '📢' },
  { label: 'Maintenance', icon: '🔧' },
  { label: 'Other', icon: '💳' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  currency,
  onRecordExpense,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Transport');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    onRecordExpense({
      amount: parsedAmount,
      category,
      description: description.trim() || `${category} expense`,
      paymentMethod,
      date: new Date(date).toISOString(),
    });

    onClose();
  };

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
              <h2 className="text-base font-bold text-white leading-tight">Record Expense</h2>
              <p className="text-[11px] text-slate-400">Track operating costs to understand real profit</p>
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

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount ({currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-lg placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <span className="absolute right-4 top-3.5 text-xs font-semibold text-slate-400">
                {currency}
              </span>
            </div>
          </div>

          {/* Category selection chips */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition ${
                      isSelected
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Taxi fare to Dakar wholesale market"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Submit */}
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
              className="flex-1 py-2.5 px-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-rose-500/20"
            >
              <span>Save Expense</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
