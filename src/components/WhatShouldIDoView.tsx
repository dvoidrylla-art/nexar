import React from 'react';
import { HelpCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface WhatShouldIDoViewProps {
  recommendations: {
    title: string;
    reason: string;
    supportingData: string;
    suggestedAction: string;
  }[];
  currency: string;
  onNavigateAction?: (title: string) => void;
  isEmbedded?: boolean;
}

export const WhatShouldIDoView: React.FC<WhatShouldIDoViewProps> = ({
  recommendations,
  currency,
  onNavigateAction,
  isEmbedded = false,
}) => {
  return (
    <div className={isEmbedded ? "space-y-3" : "p-4 space-y-4 overflow-y-auto"}>
      {!isEmbedded && (
        <div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">What should I do?</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized, evidence-based recommendations generated from your live business figures.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 transition hover:border-slate-700"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </div>
              <h3 className="font-bold text-sm text-white">{rec.title}</h3>
            </div>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Why: </span>
                <span className="text-slate-200">{rec.reason}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                <strong className="text-slate-300">Supporting Data: </strong>
                <span>{rec.supportingData}</span>
              </div>

              <div className="pt-1 text-emerald-400 font-medium flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Suggested Step: {rec.suggestedAction}</span>
              </div>
            </div>

            {onNavigateAction && (
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => onNavigateAction(rec.title)}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition border border-slate-700"
                >
                  <span>Take Action</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
