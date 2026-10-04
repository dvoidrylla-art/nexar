import React, { useState } from 'react';
import {
  Plus,
  ShoppingBag,
  ArrowDownRight,
  Package,
  UserPlus,
  X,
} from 'lucide-react';

interface QuickActionFABProps {
  onRecordSale: () => void;
  onRecordExpense: () => void;
  onAddProduct: () => void;
  onAddCustomer: () => void;
}

export const QuickActionFAB: React.FC<QuickActionFABProps> = ({
  onRecordSale,
  onRecordExpense,
  onAddProduct,
  onAddCustomer,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Record Sale',
      icon: ShoppingBag,
      color: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
      badge: 'Sale',
      onClick: () => {
        setIsOpen(false);
        onRecordSale();
      },
    },
    {
      label: 'Add Expense',
      icon: ArrowDownRight,
      color: 'bg-rose-500 text-slate-950 hover:bg-rose-400',
      badge: 'Expense',
      onClick: () => {
        setIsOpen(false);
        onRecordExpense();
      },
    },
    {
      label: 'Add Product',
      icon: Package,
      color: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
      badge: 'Product',
      onClick: () => {
        setIsOpen(false);
        onAddProduct();
      },
    },
    {
      label: 'Add Customer',
      icon: UserPlus,
      color: 'bg-teal-500 text-slate-950 hover:bg-teal-400',
      badge: 'Customer',
      onClick: () => {
        setIsOpen(false);
        onAddCustomer();
      },
    },
  ];

  return (
    <>
      {/* Backdrop overlay when speed dial is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Floating Action Button & Menu */}
      <div className="fixed right-4 bottom-20 z-50 flex flex-col items-end pointer-events-auto">
        {/* Speed Dial Menu Items */}
        {isOpen && (
          <div className="flex flex-col items-end space-y-2.5 mb-3 transition-all">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  onClick={act.onClick}
                  className="flex items-center space-x-2 group focus:outline-none"
                >
                  <span className="text-xs font-semibold text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg group-hover:bg-slate-800 transition">
                    {act.label}
                  </span>
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xl transition-transform transform active:scale-90 group-hover:scale-105 ${act.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 font-bold shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 text-white border border-slate-700 rotate-90 shadow-slate-950/50'
              : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30 rotate-0'
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7" />}
        </button>
      </div>
    </>
  );
};
