import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Wallet,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Customer } from '../types';

interface CustomersScreenProps {
  customers: Customer[];
  currency: string;
  onOpenAddCustomer: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  currency,
  onOpenAddCustomer,
  onSelectCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'debt_only'>('all');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery));

    if (!matchesSearch) return false;
    if (filterMode === 'debt_only') {
      return c.outstandingDebt > 0;
    }
    return true;
  });

  const totalOutstandingDebt = customers.reduce((acc, c) => acc + (c.outstandingDebt || 0), 0);
  const debtorCount = customers.filter((c) => c.outstandingDebt > 0).length;

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customers</h2>
          <p className="text-xs text-slate-400">
            {customers.length} client accounts tracked
          </p>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Debt overview banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs text-slate-400 font-medium">Total Customer Debt</div>
          <div className="text-xl font-black text-rose-400 mt-0.5">
            {totalOutstandingDebt.toLocaleString()} {currency}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {debtorCount} customer{debtorCount === 1 ? '' : 's'} with unpaid balances
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`py-1 px-3 rounded-lg text-xs font-medium transition ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({customers.length})
          </button>

          <button
            onClick={() => setFilterMode('debt_only')}
            className={`py-1 px-3 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              filterMode === 'debt_only'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Has Debt ({debtorCount})</span>
          </button>
        </div>
      </div>

      {/* Customer List or Empty State (Requirement 8) */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 mt-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-2xl">
            👥
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {searchQuery ? 'No customers match your search' : 'Build your customer list 👥'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Add customers to track purchases, payments and outstanding balances.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={onOpenAddCustomer}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCustomers.map((c) => {
            const hasDebt = c.outstandingDebt > 0;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition shadow-sm group active:scale-98"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate">
                      {c.name}
                    </div>

                    {/* Clear visual hierarchy: Purchases, Paid, Outstanding (Requirement 17) */}
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 truncate">
                      <span>Purchases: {c.totalPurchases.toLocaleString()}</span>
                      <span>•</span>
                      <span>Paid: {c.amountPaid.toLocaleString()}</span>
                      {c.phone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center space-x-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{c.phone}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center space-x-3">
                  <div>
                    {hasDebt ? (
                      <div className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-900/60">
                        Owes: {c.outstandingDebt.toLocaleString()} {currency}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-900/60">
                        All Paid
                      </div>
                    )}
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
