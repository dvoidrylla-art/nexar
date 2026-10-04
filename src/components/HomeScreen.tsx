import React from 'react';
import {
  ShoppingBag,
  ArrowDownRight,
  Package,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Wallet,
  Clock,
  HelpCircle,
  Sparkles,
  Layers,
  Calculator,
  ArrowUpDown,
} from 'lucide-react';
import {
  BusinessProfile,
  DashboardMetrics,
  BusinessInsight,
  Sale,
  Expense,
  CustomerPayment,
} from '../types';

interface HomeScreenProps {
  business: BusinessProfile | null;
  metrics: DashboardMetrics;
  currency: string;
  insights: BusinessInsight[];
  recentSales: Sale[];
  recentExpenses: Expense[];
  recentPayments: CustomerPayment[];
  onOpenSaleModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenProductModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenWhatShouldIDo: () => void;
  onOpenKoraWithPrompt: (prompt?: string) => void;
  onDismissInsight: (id: string) => void;
  onViewInsight: (insight: BusinessInsight) => void;
  onOpenKoraSubTab?: (subTab: 'chat' | 'feed' | 'ideas' | 'what_to_do' | 'grow' | 'pricing') => void;
}

const KORA_PROMPT_CHIPS = [
  'What should I do today?',
  'How are my sales?',
  'What should I restock?',
  'Who owes me money?',
  'How can I increase my profit?',
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  business,
  metrics,
  currency,
  insights,
  recentSales,
  recentExpenses,
  recentPayments,
  onOpenSaleModal,
  onOpenExpenseModal,
  onOpenProductModal,
  onOpenCustomerModal,
  onOpenWhatShouldIDo,
  onOpenKoraWithPrompt,
  onDismissInsight,
  onViewInsight,
  onOpenKoraSubTab,
}) => {
  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 18) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  const activeInsights = insights.filter((i) => i.status !== 'dismissed');
  const topInsight = activeInsights[0];

  // Merge recent activity items chronologically
  const activityList = [
    ...recentSales.map((s) => ({
      id: s.id,
      type: 'SALE' as const,
      title: `Sale — ${s.items[0]?.productName || 'Items'}${
        s.items.length > 1 ? ` (+${s.items.length - 1} more)` : ''
      }`,
      amount: s.totalAmount,
      date: s.date,
      customer: s.customerName,
      status: s.paymentStatus,
    })),
    ...recentExpenses.map((e) => ({
      id: e.id,
      type: 'EXPENSE' as const,
      title: `Expense — ${e.category}`,
      amount: -e.amount,
      date: e.date,
      customer: e.description,
      status: 'Paid',
    })),
    ...recentPayments.map((p) => ({
      id: p.id,
      type: 'PAYMENT' as const,
      title: `Payment — ${p.customerName}`,
      amount: p.amount,
      date: p.date,
      customer: p.customerName,
      status: 'Settled',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="p-4 space-y-5 pb-24 max-w-4xl mx-auto">
      {/* 1. Header Greeting & Business Name */}
      <div>
        <div className="text-xs text-slate-400 font-medium tracking-tight">
          {getGreeting()}
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
          {business?.name || 'My Business'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Here's how your business is doing today.
        </p>
      </div>

      {/* 2. PROMINENT ASK KORA WIDGET (Requirement 5) */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-3.5 space-y-2.5 transition shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-tight">Ask Kora</span>
              <span className="text-[10px] text-emerald-400 font-medium ml-2 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80">
                AI Business Assistant
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpenKoraWithPrompt('What should I do today?')}
            className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1 transition shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <span>Ask Kora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Suggested Question Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-1">
          {KORA_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onOpenKoraWithPrompt(chip)}
              className="text-[11px] px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 shrink-0 transition active:scale-95"
            >
              "{chip}"
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Responsive 2-column layout on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT COLUMN (or Top on mobile): Metrics */}
        <div className="space-y-5">
          {/* SECTION: TODAY */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Today</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Today's Sales */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] text-slate-400 font-medium">Sales</div>
                <div className="text-base font-extrabold text-white truncate">
                  {metrics.todaySales.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">{currency}</div>
              </div>

              {/* Today's Expenses */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] text-slate-400 font-medium">Expenses</div>
                <div className="text-base font-extrabold text-rose-400 truncate">
                  {metrics.todayExpenses.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">{currency}</div>
              </div>

              {/* Estimated Profit */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] text-emerald-400 font-medium truncate">Est. Profit</div>
                <div
                  className={`text-base font-extrabold truncate ${
                    metrics.estimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {metrics.estimatedProfit >= 0 ? '+' : ''}
                  {metrics.estimatedProfit.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">{currency}</div>
              </div>
            </div>
          </div>

          {/* SECTION: BUSINESS SNAPSHOT */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Business Snapshot
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Customers Owe You */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] text-rose-400 font-medium truncate">Customers Owe</div>
                <div className="text-base font-extrabold text-rose-400 truncate">
                  {metrics.customerDebt.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">{currency} unpaid</div>
              </div>

              {/* Low-stock products */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] text-slate-400 font-medium truncate">Low-Stock</div>
                <div
                  className={`text-base font-extrabold truncate ${
                    metrics.lowStockCount > 0 ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  {metrics.lowStockCount}
                </div>
                <div className="text-[9px] text-slate-500">
                  {metrics.lowStockCount === 1 ? 'product' : 'products'}
                </div>
              </div>

              {/* Inventory value */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] text-slate-400 font-medium truncate">Inventory Value</div>
                <div className="text-base font-extrabold text-slate-200 truncate">
                  {metrics.inventoryValuePurchase.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">{currency} at cost</div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS (Large Touch Buttons) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Actions
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={onOpenSaleModal}
                className="py-3 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="tracking-tight">Sale</span>
              </button>

              <button
                onClick={onOpenExpenseModal}
                className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition border border-slate-700 active:scale-95"
              >
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
                <span className="tracking-tight">Expense</span>
              </button>

              <button
                onClick={onOpenProductModal}
                className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition border border-slate-700 active:scale-95"
              >
                <Package className="w-5 h-5 text-amber-400" />
                <span className="tracking-tight">Product</span>
              </button>

              <button
                onClick={onOpenCustomerModal}
                className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition border border-slate-700 active:scale-95"
              >
                <UserPlus className="w-5 h-5 text-teal-400" />
                <span className="tracking-tight">Customer</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (or Below on mobile): Insights & Actions */}
        <div className="space-y-5">
          {/* ✨ KORA NOTICED SOMETHING (Requirement 9 & 11) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">✨</span>
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  Kora noticed something
                </h3>
              </div>
              {topInsight && (
                <button
                  onClick={() => onDismissInsight(topInsight.id)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Dismiss
                </button>
              )}
            </div>

            {topInsight ? (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-100">{topInsight.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {topInsight.description}
                </p>
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono">
                  Evidence: {topInsight.evidence}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Evidence-based insight
                  </span>
                  <button
                    onClick={() => onViewInsight(topInsight)}
                    className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1 shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-1">
                Kora is watching your business. Record more activity and I'll start finding useful patterns.
              </div>
            )}
          </div>

          {/* 🤖 WHAT SHOULD I DO? CTA (Requirement 12) */}
          <button
            onClick={onOpenWhatShouldIDo}
            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between text-left transition group shadow-sm active:scale-98"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold shrink-0">
                🤖
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">What should I do?</h4>
                <p className="text-[11px] text-slate-400">
                  Analyze inventory, customer debts, and sales for prioritized actions
                </p>
              </div>
            </div>
            <div className="py-1.5 px-3 bg-slate-800 group-hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition border border-slate-700 flex items-center space-x-1 shrink-0">
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
            </div>
          </button>

          {/* 4 ADVISORY MODULES QUICK JUMP (The Idea, What to do, Grow Business, Smart Pricing) */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Advisory Modules
                </span>
              </div>
              {onOpenKoraSubTab && (
                <button
                  onClick={() => onOpenKoraSubTab('feed')}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 transition"
                >
                  <span>Vertical Stream</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenKoraSubTab ? onOpenKoraSubTab('ideas') : onOpenWhatShouldIDo()}
                className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 text-left transition flex items-center space-x-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                    The Idea
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Risk & opportunity</div>
                </div>
              </button>

              <button
                onClick={() => onOpenKoraSubTab ? onOpenKoraSubTab('what_to_do') : onOpenWhatShouldIDo()}
                className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 text-left transition flex items-center space-x-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                    What to Do?
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Daily action steps</div>
                </div>
              </button>

              <button
                onClick={() => onOpenKoraSubTab ? onOpenKoraSubTab('grow') : onOpenWhatShouldIDo()}
                className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 text-left transition flex items-center space-x-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                    Grow Business
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Phased roadmap</div>
                </div>
              </button>

              <button
                onClick={() => onOpenKoraSubTab ? onOpenKoraSubTab('pricing') : onOpenWhatShouldIDo()}
                className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 text-left transition flex items-center space-x-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                    Smart Pricing
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Margins & bundles</div>
                </div>
              </button>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Recent Activity
              </span>
              <span className="text-[10px] text-slate-500">Live journal</span>
            </div>

            {activityList.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 space-y-1">
                <Clock className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                <p>No activity recorded yet.</p>
                <p className="text-[10px] text-slate-600">
                  Use Quick Actions to record your first sale or expense.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {activityList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          item.type === 'SALE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.type === 'EXPENSE'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-teal-500/20 text-teal-400'
                        }`}
                      >
                        {item.type === 'SALE' ? (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        ) : item.type === 'EXPENSE' ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <Wallet className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white leading-tight truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {new Date(item.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {item.customer || 'Walk-in'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-bold ${
                          item.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.amount > 0 ? `+${item.amount.toLocaleString()}` : item.amount.toLocaleString()}{' '}
                        {currency}
                      </div>
                      <div className="text-[9px] text-slate-500">{item.status}</div>
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
