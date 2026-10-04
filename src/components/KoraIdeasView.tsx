import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Package,
  Users,
  CheckCircle2,
  X,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { BusinessInsight } from '../types';

interface KoraIdeasViewProps {
  insights: BusinessInsight[];
  currency: string;
  onDismissInsight: (insightId: string) => void;
  onActionClick?: (insight: BusinessInsight) => void;
  isEmbedded?: boolean;
}

export const KoraIdeasView: React.FC<KoraIdeasViewProps> = ({
  insights,
  currency,
  onDismissInsight,
  onActionClick,
  isEmbedded = false,
}) => {
  const activeInsights = insights.filter((i) => i.status !== 'dismissed');

  const getInsightIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'RESTOCK_SUGGESTION':
        return <Package className="w-4 h-4 text-amber-400" />;
      case 'FAST_SELLER':
      case 'SALES_TREND':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'CUSTOMER_DEBT':
      case 'INACTIVE_CUSTOMER':
        return <Users className="w-4 h-4 text-rose-400" />;
      case 'BUNDLE_OPPORTUNITY':
      case 'MARGIN_OPPORTUNITY':
        return <Lightbulb className="w-4 h-4 text-teal-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityBadge = (sev: BusinessInsight['severity']) => {
    if (sev === 'high') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
          Urgent
        </span>
      );
    }
    if (sev === 'medium') {
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
          Important
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
        Opportunity
      </span>
    );
  };

  return (
    <div className={isEmbedded ? "space-y-3" : "p-4 space-y-4 overflow-y-auto"}>
      {!isEmbedded && (
        <div>
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Kora Ideas</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            "I found a few things you may want to look at, based on your business records."
          </p>
        </div>
      )}

      {activeInsights.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No active alerts</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Kora is watching your business. Record a few sales and expenses, and I'll start highlighting opportunities and risks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeInsights.map((insight) => (
            <div
              key={insight.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-2.5 transition shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{insight.title}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      {getSeverityBadge(insight.severity)}
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {insight.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDismissInsight(insight.id)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{insight.description}</p>

              {/* Verified Evidence Box */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                <strong className="text-slate-300">Supporting Evidence: </strong>
                <span>{insight.evidence}</span>
              </div>

              {insight.actionLabel && onActionClick && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onActionClick(insight)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 py-1 px-2 rounded-lg hover:bg-slate-800 transition"
                  >
                    <span>{insight.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
