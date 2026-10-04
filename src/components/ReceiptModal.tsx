import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { Sale } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: Sale | null;
  currency: string;
  businessName: string;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  sale,
  currency,
  businessName,
  onClose,
  onNewSale,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sale) return null;

  const receiptDate = new Date(sale.date).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with success badge & close button */}
        <div className="relative p-5 pb-3 text-center bg-slate-900 border-b border-slate-800">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Back to Screen"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">✅ Sale Recorded</h2>
          <p className="text-xs text-slate-400">Inventory and accounts updated</p>
        </div>

        {/* Receipt Details Card */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-3 shadow-inner">
            <div className="text-center border-b border-dashed border-slate-700 pb-2">
              <div className="font-bold text-sm text-white tracking-wider">{businessName}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">OFFICIAL RECEIPT</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{sale.receiptNumber}</div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{receiptDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-white">{sale.customerName || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span>{sale.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-dashed border-slate-700 py-2 space-y-1.5">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <div className="truncate pr-2">
                    <span className="font-bold text-white">{item.quantity}x</span> {item.productName}
                  </div>
                  <div className="font-bold text-white shrink-0">
                    {item.subtotal.toLocaleString()} {currency}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex justify-between text-sm font-bold text-white">
                <span>TOTAL:</span>
                <span>{sale.totalAmount.toLocaleString()} {currency}</span>
              </div>

              <div className="flex justify-between text-emerald-400">
                <span>Amount Paid:</span>
                <span>{sale.amountPaid.toLocaleString()} {currency}</span>
              </div>

              {sale.outstandingDebt > 0 && (
                <div className="flex justify-between font-bold text-rose-400 bg-rose-950/40 px-2 py-1 rounded">
                  <span>Balance Due:</span>
                  <span>{sale.outstandingDebt.toLocaleString()} {currency}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                <span>Est. Gross Profit:</span>
                <span className="text-emerald-400 font-semibold">
                  +{sale.estimatedGrossProfit.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-700">
              Powered by Kora Business OS
            </div>
          </div>
        </div>

        {/* Action Buttons: Done / Back to Screen & New Sale */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex space-x-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition border border-slate-700 cursor-pointer active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Back to Screen</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                onNewSale();
              }}
              className="flex-1 py-3 px-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Sale</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
