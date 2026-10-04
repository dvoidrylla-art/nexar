import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Wallet } from 'lucide-react';
import { Customer, PaymentMethod } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  currency: string;
  onRecordPayment: (params: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  currency,
  onRecordPayment,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (customer.outstandingDebt > 0 && parsedAmount > customer.outstandingDebt) {
      setError(`Payment cannot exceed outstanding balance of ${customer.outstandingDebt.toLocaleString()} ${currency}.`);
      return;
    }

    onRecordPayment({
      customerId: customer.id,
      amount: parsedAmount,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Record Debt Payment</h2>
              <p className="text-[11px] text-slate-400">Reduce customer balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Customer info & debt banner */}
          <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Customer</div>
              <div className="text-sm font-bold text-white">{customer.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-rose-400">Current Debt</div>
              <div className="text-base font-extrabold text-rose-400">
                {customer.outstandingDebt.toLocaleString()} {currency}
              </div>
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-300">Amount Received *</label>
              {customer.outstandingDebt > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(customer.outstandingDebt.toString())}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Pay Full Debt
                </button>
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 6000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-base focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Mobile Money', 'Card'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 text-xs font-medium rounded-xl border transition ${
                    paymentMethod === method
                      ? 'bg-slate-700 border-emerald-500 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Partial settlement for shirts"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex space-x-2">
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
              <span>Confirm Payment</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
