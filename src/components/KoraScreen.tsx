import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Lightbulb,
  HelpCircle,
  TrendingUp,
  Calculator,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  BusinessProfile,
  Product,
  Customer,
  Sale,
  Expense,
  DashboardMetrics,
  BusinessInsight,
  ActionPlanItem,
  ActionPlanStatus,
} from '../types';
import { KoraChat } from './KoraChat';
import { KoraIdeasView } from './KoraIdeasView';
import { WhatShouldIDoView } from './WhatShouldIDoView';
import { GrowBusinessView } from './GrowBusinessView';
import { SmartPricingView } from './SmartPricingView';
import { AnalyticsService } from '../services/analytics';

export type KoraSubTab = 'chat' | 'feed' | 'ideas' | 'what_to_do' | 'grow' | 'pricing';
export type MovableSectionId = 'ideas' | 'what_to_do' | 'grow' | 'pricing';

const DEFAULT_SECTION_ORDER: MovableSectionId[] = [
  'ideas',
  'what_to_do',
  'grow',
  'pricing',
];

const STORAGE_KEY = 'kora_vertical_sections_order_v1';

interface KoraScreenProps {
  business: BusinessProfile | null;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  metrics: DashboardMetrics;
  currency: string;
  insights: BusinessInsight[];
  actionPlans: ActionPlanItem[];
  defaultSubTab?: KoraSubTab;
  initialPrompt?: string;
  onDismissInsight: (insightId: string) => void;
  onUpdateActionPlanStatus: (planId: string, status: ActionPlanStatus) => void;
  onExecutePendingSale: (saleData: any) => void;
  onExecutePendingExpense: (expenseData: any) => void;
  onExecutePendingPayment: (paymentData: any) => void;
  onNavigateAction?: (title: string) => void;
}

export const KoraScreen: React.FC<KoraScreenProps> = ({
  business,
  products,
  customers,
  sales,
  expenses,
  metrics,
  currency,
  insights,
  actionPlans,
  defaultSubTab = 'chat',
  initialPrompt,
  onDismissInsight,
  onUpdateActionPlanStatus,
  onExecutePendingSale,
  onExecutePendingExpense,
  onExecutePendingPayment,
  onNavigateAction,
}) => {
  // If a specific advisory module was requested, default to 'feed' and scroll to it
  const initialTab =
    defaultSubTab === 'chat'
      ? 'chat'
      : 'feed';

  const [subTab, setSubTab] = useState<'chat' | 'feed'>(initialTab);

  // Vertical order state for the 4 advisory modules
  const [sectionOrder, setSectionOrder] = useState<MovableSectionId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === DEFAULT_SECTION_ORDER.length &&
          DEFAULT_SECTION_ORDER.every((id) => parsed.includes(id))
        ) {
          return parsed as MovableSectionId[];
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_SECTION_ORDER;
  });

  // Track collapsed state for sections in vertical feed
  const [collapsedSections, setCollapsedSections] = useState<Record<MovableSectionId, boolean>>({
    ideas: false,
    what_to_do: false,
    grow: false,
    pricing: false,
  });

  // Highlight effect when a section moves
  const [movedSectionId, setMovedSectionId] = useState<MovableSectionId | null>(null);

  // References for scrolling
  const sectionRefs = {
    ideas: useRef<HTMLDivElement>(null),
    what_to_do: useRef<HTMLDivElement>(null),
    grow: useRef<HTMLDivElement>(null),
    pricing: useRef<HTMLDivElement>(null),
  };

  // Handle external tab switches (e.g. from Home shortcuts)
  useEffect(() => {
    if (!defaultSubTab) return;
    if (defaultSubTab === 'chat') {
      setSubTab('chat');
    } else if (defaultSubTab === 'feed') {
      setSubTab('feed');
    } else if (['ideas', 'what_to_do', 'grow', 'pricing'].includes(defaultSubTab)) {
      setSubTab('feed');
      const targetSec = defaultSubTab as MovableSectionId;
      setTimeout(() => {
        sectionRefs[targetSec]?.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 250);
    }
  }, [defaultSubTab]);

  // Persist order changes
  const saveOrder = (newOrder: MovableSectionId[]) => {
    setSectionOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  // Move section vertically up
  const moveSectionUp = (id: MovableSectionId) => {
    const currentIndex = sectionOrder.indexOf(id);
    if (currentIndex <= 0) return;
    const newOrder = [...sectionOrder];
    const prev = newOrder[currentIndex - 1];
    newOrder[currentIndex - 1] = id;
    newOrder[currentIndex] = prev;
    saveOrder(newOrder);
    triggerMoveHighlight(id);
  };

  // Move section vertically down
  const moveSectionDown = (id: MovableSectionId) => {
    const currentIndex = sectionOrder.indexOf(id);
    if (currentIndex < 0 || currentIndex >= sectionOrder.length - 1) return;
    const newOrder = [...sectionOrder];
    const next = newOrder[currentIndex + 1];
    newOrder[currentIndex + 1] = id;
    newOrder[currentIndex] = next;
    saveOrder(newOrder);
    triggerMoveHighlight(id);
  };

  const triggerMoveHighlight = (id: MovableSectionId) => {
    setMovedSectionId(id);
    setTimeout(() => {
      setMovedSectionId(null);
    }, 1200);
    // Smooth scroll to the moved section
    setTimeout(() => {
      sectionRefs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const resetSectionOrder = () => {
    saveOrder(DEFAULT_SECTION_ORDER);
  };

  const toggleCollapse = (id: MovableSectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const scrollToSection = (id: MovableSectionId) => {
    sectionRefs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const recommendations = AnalyticsService.getWhatShouldIDo({
    currency,
    products,
    customers,
    sales,
    expenses,
  });

  const activeInsights = insights.filter((i) => i.status !== 'dismissed');

  // Metadata dictionary for the 4 sections
  const SECTION_META: Record<
    MovableSectionId,
    {
      title: string;
      shortTitle: string;
      description: string;
      icon: React.ReactNode;
      color: string;
      badge?: string;
    }
  > = {
    ideas: {
      title: 'The Idea (Kora Ideas)',
      shortTitle: 'The Idea',
      description: 'AI noticed patterns, risk alerts, and profit opportunities',
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      color: 'amber',
      badge: `${activeInsights.length} active`,
    },
    what_to_do: {
      title: 'What to Do?',
      shortTitle: 'What to Do',
      description: 'Prioritized daily action steps grounded in inventory & debt data',
      icon: <HelpCircle className="w-4 h-4 text-emerald-400" />,
      color: 'emerald',
      badge: `${recommendations.length} steps`,
    },
    grow: {
      title: 'Grow Business',
      shortTitle: 'Grow Business',
      description: 'Phased growth roadmap for today, this week & this month',
      icon: <TrendingUp className="w-4 h-4 text-teal-400" />,
      color: 'teal',
      badge: `${actionPlans.length} actions`,
    },
    pricing: {
      title: 'Smart Pricing & Bundles',
      shortTitle: 'Smart Pricing',
      description: 'Dynamic margin calculator and high-conversion combo suggestions',
      icon: <Calculator className="w-4 h-4 text-emerald-400" />,
      color: 'emerald',
      badge: `${products.length} products`,
    },
  };

  // Render module content by ID
  const renderModuleContent = (id: MovableSectionId) => {
    switch (id) {
      case 'ideas':
        return (
          <KoraIdeasView
            insights={insights}
            currency={currency}
            onDismissInsight={onDismissInsight}
            isEmbedded={true}
          />
        );
      case 'what_to_do':
        return (
          <WhatShouldIDoView
            recommendations={recommendations}
            currency={currency}
            onNavigateAction={onNavigateAction}
            isEmbedded={true}
          />
        );
      case 'grow':
        return (
          <GrowBusinessView
            actionPlans={actionPlans}
            onUpdateStatus={onUpdateActionPlanStatus}
            isEmbedded={true}
          />
        );
      case 'pricing':
        return (
          <SmartPricingView
            products={products}
            currency={currency}
            isEmbedded={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] pb-16 max-w-3xl mx-auto w-full">
      {/* Subtab Bar - Streamlined to Chat & Voice and Advisory Stream */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2">
          {/* 1. Chat & Voice Tab */}
          <button
            onClick={() => setSubTab('chat')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
              subTab === 'chat'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat & Voice</span>
          </button>

          {/* 2. Advisory Stream Tab (Holds The Idea, What to do, Grow Business & Smart Pricing with vertical movement) */}
          <button
            onClick={() => setSubTab('feed')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              subTab === 'feed'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Vertical Advisory Stream"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Advisory & Growth</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/80 text-emerald-400 font-semibold border border-emerald-500/30">
              4 Modules
            </span>
          </button>
        </div>

        {/* Vertical movement indicator */}
        {subTab === 'feed' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={resetSectionOrder}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium flex items-center space-x-1 border border-slate-700 transition"
              title="Reset modules to default vertical order"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Reset Order</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden relative">
        {/* CHAT TAB */}
        {subTab === 'chat' && (
          <KoraChat
            business={business}
            products={products}
            customers={customers}
            sales={sales}
            expenses={expenses}
            metrics={metrics}
            currency={currency}
            initialPrompt={initialPrompt}
            onExecutePendingSale={onExecutePendingSale}
            onExecutePendingExpense={onExecutePendingExpense}
            onExecutePendingPayment={onExecutePendingPayment}
          />
        )}

        {/* ADVISORY STREAM (The Idea, What to do, Grow business, Smart pricing with full vertical movement) */}
        {subTab === 'feed' && (
          <div className="h-full overflow-y-auto px-4 py-4 space-y-6 pb-28 scroll-smooth">
            {/* Quick-Jump Vertical Pill Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                Jump To:
              </span>
              {sectionOrder.map((secId, idx) => {
                const meta = SECTION_META[secId];
                return (
                  <button
                    key={secId}
                    onClick={() => scrollToSection(secId)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs shrink-0 transition"
                  >
                    <span>{idx + 1}.</span>
                    <span>{meta.shortTitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Vertically Stacked & Movable Sections */}
            <div className="space-y-6">
              {sectionOrder.map((sectionId, index) => {
                const meta = SECTION_META[sectionId];
                const isFirst = index === 0;
                const isLast = index === sectionOrder.length - 1;
                const isCollapsed = !!collapsedSections[sectionId];
                const isRecentlyMoved = movedSectionId === sectionId;

                return (
                  <section
                    key={sectionId}
                    ref={sectionRefs[sectionId]}
                    id={`section-${sectionId}`}
                    className={`bg-slate-900/90 border rounded-3xl overflow-hidden transition-all duration-300 shadow-md ${
                      isRecentlyMoved
                        ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-emerald-950/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Section Header with Vertical Move Controls */}
                    <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {/* Position Indicator Badge */}
                        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="shrink-0">{meta.icon}</span>
                            <h3 className="text-sm font-bold text-white truncate">
                              {meta.title}
                            </h3>
                            {meta.badge && (
                              <span className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                                {meta.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Movement & View Controls */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Move Up Button */}
                        <button
                          onClick={() => moveSectionUp(sectionId)}
                          disabled={isFirst}
                          className={`p-1.5 rounded-xl border transition flex items-center justify-center ${
                            isFirst
                              ? 'text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
                              : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/50 border-slate-700 active:scale-95'
                          }`}
                          title={isFirst ? 'Already at the top' : `Move "${meta.shortTitle}" Up vertically`}
                          aria-label={`Move ${meta.shortTitle} Up`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        {/* Move Down Button */}
                        <button
                          onClick={() => moveSectionDown(sectionId)}
                          disabled={isLast}
                          className={`p-1.5 rounded-xl border transition flex items-center justify-center ${
                            isLast
                              ? 'text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
                              : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/50 border-slate-700 active:scale-95'
                          }`}
                          title={isLast ? 'Already at the bottom' : `Move "${meta.shortTitle}" Down vertically`}
                          aria-label={`Move ${meta.shortTitle} Down`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        {/* Collapse / Expand Toggle */}
                        <button
                          onClick={() => toggleCollapse(sectionId)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                          title={isCollapsed ? 'Expand section' : 'Collapse section'}
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Section Body */}
                    {!isCollapsed ? (
                      <div className="p-4 bg-slate-950/50">
                        {renderModuleContent(sectionId)}
                      </div>
                    ) : (
                      <div
                        onClick={() => toggleCollapse(sectionId)}
                        className="px-4 py-2.5 bg-slate-950/30 text-xs text-slate-500 flex items-center justify-between cursor-pointer hover:bg-slate-950/60 transition"
                      >
                        <span>Section collapsed. Click to expand.</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Bottom Stream Summary */}
            <div className="text-center py-6 text-xs text-slate-500 space-y-2">
              <p>You have reached the end of the vertical advisory stream.</p>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  document.querySelector('.scroll-smooth')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs transition"
              >
                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
