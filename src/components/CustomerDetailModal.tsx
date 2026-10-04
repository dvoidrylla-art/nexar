import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Wallet,
  ShoppingBag,
  MessageSquare,
  Copy,
  Check,
  History,
  DollarSign,
} from 'lucide-react';
import { Customer, Sale, CustomerPayment } from '../types';

interface CustomerDetailModalProps {
  customer: Customer | null;
  currency: string;
  businessName: string;
  sales: Sale[];
  payments: CustomerPayment[];
  onClose: () => void;
  onOpenRecordPayment: (customer: Customer) => void;
  onOpenRecordSale: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  currency,
  businessName,
  sales,
  payments,
  onClose,
  onOpenRecordPayment,
  onOpenRecordSale,
}) => {
  const [showReminderDraft, setShowReminderDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!customer) return null;

  const customerSales = sales.filter((s) => s.customerId === customer.id || s.customerName === customer.name);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  const reminderText = `Hello ${customer.name}, greetings from ${businessName}! This is a gentle note regarding your outstanding account balance of ${customer.outstandingDebt.toLocaleString()} ${currency}. Whenever convenient, please let us know when you would like to settle it. Thank you for your continued business!`;

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{customer.name}</h2>
              {customer.phone ? (
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <Phone className="w-3 h-3" />
                  <span>{customer.phone}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">No phone attached</span>
              )}
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
          {/* Account Balance Summary - Clear Visual Hierarchy (Requirement 17) */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Account Overview
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium">Total Purchases</div>
                <div className="text-sm font-extrabold text-white mt-1 truncate">
                  {customer.totalPurchases.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">{currency}</div>
              </div>

              <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/60">
                <div className="text-[10px] text-emerald-400 font-medium">Total Paid</div>
                <div className="text-sm font-extrabold text-emerald-300 mt-1 truncate">
                  {customer.amountPaid.toLocaleString()}
                </div>
                <div className="text-[9px] text-emerald-500">{currency}</div>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  customer.outstandingDebt > 0
                    ? 'bg-rose-950/50 border-rose-900/80 text-rose-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-medium text-rose-400">Outstanding Debt</div>
                <div
                  className={`text-sm font-extrabold mt-1 truncate ${
                    customer.outstandingDebt > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {customer.outstandingDebt.toLocaleString()}
                </div>
                <div className="text-[9px] text-rose-500">{currency}</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenRecordPayment(customer);
              }}
              className="py-2.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex flex-col items-center justify-center space-y-1 transition shadow-md shadow-emerald-500/20"
            >
              <Wallet className="w-4 h-4" />
              <span>Record Pay</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenRecordSale(customer);
              }}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex flex-col items-center justify-center space-y-1 transition border border-slate-700"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>New Sale</span>
            </button>

            <button
              onClick={() => setShowReminderDraft(!showReminderDraft)}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex flex-col items-center justify-center space-y-1 transition border border-slate-700"
            >
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Reminder</span>
            </button>
          </div>

          {/* Reminder Draft Card (Owner reviews and copies, Kora never auto-sends) */}
          {showReminderDraft && (
            <div className="bg-slate-950 border border-teal-800/60 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
                <span className="flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Polite Debt Reminder Draft</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Review before sending</span>
              </div>
              <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                "{reminderText}"
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyReminder}
                  className="flex-1 py-1.5 px-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy for WhatsApp / SMS'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Purchase History */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Purchase History ({customerSales.length})</span>
            </h3>

            {customerSales.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No purchase recorded yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {customerSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-2.5 bg-slate-800/40 rounded-xl text-xs border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {sale.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sale.date).toLocaleDateString()} • {sale.paymentMethod} •{' '}
                        <span
                          className={
                            sale.paymentStatus === 'Paid'
                              ? 'text-emerald-400'
                              : sale.paymentStatus === 'Partially Paid'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {sale.paymentStatus}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {sale.totalAmount.toLocaleString()} {currency}
                      </div>
                      {sale.outstandingDebt > 0 && (
                        <div className="text-[10px] font-bold text-rose-400">
                          Due: {sale.outstandingDebt.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History */}
          {customerPayments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300">Debt Payments ({customerPayments.length})</h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {customerPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 bg-slate-800/30 rounded-lg text-xs border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-slate-300">Payment received</span>
                      <div className="text-[10px] text-slate-500">
                        {new Date(p.date).toLocaleDateString()} • {p.paymentMethod}
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold">
                      +{p.amount.toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
