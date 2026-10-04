import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  Calendar,
} from 'lucide-react';
import { Sale } from '../types';
import { KoraLogo } from './KoraLogo';

interface SalesScreenProps {
  sales: Sale[];
  currency: string;
  onOpenRecordSale: () => void;
  onSelectSale: (sale: Sale) => void;
  onOpenKoraWithPrompt?: (prompt?: string) => void;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({
  sales,
  currency,
  onOpenRecordSale,
  onSelectSale,
  onOpenKoraWithPrompt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Partially Paid' | 'Unpaid'>('all');

  // Interactive search debouncing with animated loading symbol
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        setIsSearching(false);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDebouncedQuery('');
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Check same calendar day for real today's sales calculation
  const isSameDay = (dateStrOrObj: string | Date) => {
    try {
      const d = new Date(dateStrOrObj);
      const today = new Date();
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    } catch {
      return false;
    }
  };

  // Helper to test if a date is today or yesterday
  const getRelativeDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      if (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      ) {
        return 'today';
      }
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (
        d.getFullYear() === yesterday.getFullYear() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getDate() === yesterday.getDate()
      ) {
        return 'yesterday';
      }
      return '';
    } catch {
      return '';
    }
  };

  // Calculate real today's sales directly from the database records
  const todaySalesTotal = sales
    .filter((s) => s.date && isSameDay(s.date))
    .reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  // Check if a sale matches query by customer name or date (plus receipt # or item name)
  const matchesQuery = (sale: Sale, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();

    // 1. Customer name match
    if (sale.customerName && sale.customerName.toLowerCase().includes(q)) {
      return true;
    }
    if (!sale.customerName && 'walk-in customer'.includes(q)) {
      return true;
    }

    // 2. Receipt number match
    if (sale.receiptNumber && sale.receiptNumber.toLowerCase().includes(q)) {
      return true;
    }

    // 3. Products in this transaction
    if (sale.items && sale.items.some((it) => it.productName.toLowerCase().includes(q))) {
      return true;
    }

    // 4. Date matching (supports YYYY-MM-DD, Month Name, 'Oct 4', 'today', 'yesterday', '10/04', etc.)
    if (sale.date) {
      try {
        const d = new Date(sale.date);
        const iso = sale.date.toLowerCase();
        if (iso.includes(q)) return true;

        const rel = getRelativeDateLabel(sale.date);
        if (rel && rel.includes(q)) return true;

        const localeLong = d.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).toLowerCase();
        if (localeLong.includes(q)) return true;

        const localeShort = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).toLowerCase();
        if (localeShort.includes(q)) return true;

        const localeNumeric = d.toLocaleDateString().toLowerCase();
        if (localeNumeric.includes(q)) return true;

        const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (weekday.includes(q)) return true;
      } catch (err) {
        console.error('Date parsing error during sale search:', err);
      }
    }

    return false;
  };

  const activeQuery = isSearching ? debouncedQuery : (debouncedQuery || searchQuery);

  const filteredSales = sales.filter((s) => {
    if (!matchesQuery(s, activeQuery)) return false;
    if (statusFilter !== 'all' && s.paymentStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-3.5 sm:p-4 space-y-3.5 pb-28 max-w-2xl mx-auto">
      {/* 1. Page Title & Real Today's Sales Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
            Sales
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Today's sales: <span className="text-emerald-400 font-bold">{todaySalesTotal.toLocaleString()} {currency}</span>
          </p>
        </div>

        <button
          onClick={onOpenRecordSale}
          className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Sale</span>
        </button>
      </div>

      {/* 2. Search Bar with Loading Symbol (Customer Name or Date) */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search by customer name or date (e.g. Amina, Oct 4, today)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs placeholder-slate-500 transition shadow-inner focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

          {/* Loading symbol while searching */}
          {isSearching ? (
            <div className="absolute right-3 flex items-center space-x-1" title="Searching transactions...">
              <KoraLogo size="xs" isLoading={true} />
            </div>
          ) : searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Searching feedback & result count */}
        {isSearching && (
          <div className="flex items-center space-x-1.5 text-[11px] text-cyan-400 font-medium px-1 mt-1.5">
            <KoraLogo size="xs" isLoading={true} />
            <span>Searching transactions by customer or date...</span>
          </div>
        )}

        {!isSearching && searchQuery.trim() && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-1.5">
            <span className="flex items-center space-x-1 truncate">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <span>
                Found {filteredSales.length} transaction{filteredSales.length === 1 ? '' : 's'} matching "{searchQuery}"
              </span>
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-400 hover:text-emerald-300 font-medium shrink-0 ml-2"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* 3. Horizontally scrollable status filters: All Sales, Paid, Partially Paid, Unpaid */}
      <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
        {(
          [
            { id: 'all' as const, label: 'All Sales' },
            { id: 'Paid' as const, label: 'Paid' },
            { id: 'Partially Paid' as const, label: 'Partially Paid' },
            { id: 'Unpaid' as const, label: 'Unpaid' },
          ]
        ).map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`py-1.5 px-3 rounded-xl font-semibold whitespace-nowrap shrink-0 transition ${
              statusFilter === st.id
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* 4. Kora Assistant Shortcut */}
      <div className="bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-3.5 flex items-center justify-between transition shadow-sm">
        <div className="flex items-center space-x-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>✨ Ask Kora</span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">"What should I do today?"</p>
          </div>
        </div>

        <button
          onClick={() => onOpenKoraWithPrompt?.('What should I do today?')}
          className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1 transition shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
        >
          <span>Ask Kora</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Empty State OR Real Sales List */}
      {sales.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-2xl shadow-inner">
            🚀
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Your first sale starts here 🚀
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Record a sale and Kora will automatically update:
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 max-w-xs mx-auto text-left text-xs space-y-2 text-slate-300 font-medium">
            <div className="flex items-center space-x-2.5">
              <span className="text-emerald-400 font-black">•</span>
              <span>Revenue</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="text-emerald-400 font-black">•</span>
              <span>Profit</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="text-emerald-400 font-black">•</span>
              <span>Inventory</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="text-emerald-400 font-black">•</span>
              <span>Customer history</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="text-emerald-400 font-black">•</span>
              <span>Business insights</span>
            </div>
          </div>

          <button
            onClick={onOpenRecordSale}
            className="w-full max-w-xs mx-auto py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record your first sale</span>
          </button>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-300">No matching transactions found</p>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No transactions match "${searchQuery}". Check customer name or date.`
              : 'No transactions match the selected filter.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
          >
            Reset search & filters
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSales.map((sale) => {
            const dateStr = new Date(sale.date).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });
            const timeStr = new Date(sale.date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sale.id}
                onClick={() => onSelectSale(sale)}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition shadow-sm group active:scale-98"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                      {sale.receiptNumber}
                    </span>
                    <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate">
                      {sale.customerName || 'Walk-in Customer'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 truncate">
                    {sale.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500 inline" />
                      <span>
                        {dateStr} at {timeStr}
                      </span>
                    </span>
                    <span>•</span>
                    <span>{sale.paymentMethod}</span>
                    <span>•</span>
                    <span
                      className={`font-semibold ${
                        sale.paymentStatus === 'Paid'
                          ? 'text-emerald-400'
                          : sale.paymentStatus === 'Partially Paid'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center space-x-3">
                  <div>
                    <div className="font-black text-sm text-white">
                      {sale.totalAmount.toLocaleString()} {currency}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      +{sale.estimatedGrossProfit.toLocaleString()} profit
                    </div>
                    {sale.outstandingDebt > 0 && (
                      <div className="text-[10px] text-rose-400 font-bold mt-0.5">
                        Owed: {sale.outstandingDebt.toLocaleString()}
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
