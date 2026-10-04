import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { ActionPlanItem, ActionPlanStatus, ActionPlanTimeframe } from '../types';

interface GrowBusinessViewProps {
  actionPlans: ActionPlanItem[];
  onUpdateStatus: (planId: string, status: ActionPlanStatus) => void;
  isEmbedded?: boolean;
}

export const GrowBusinessView: React.FC<GrowBusinessViewProps> = ({
  actionPlans,
  onUpdateStatus,
  isEmbedded = false,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<ActionPlanTimeframe>('Today');

  const filteredPlans = actionPlans.filter((p) => p.timeframe === selectedTimeframe);

  const getStatusBadge = (status: ActionPlanStatus) => {
    switch (status) {
      case 'Done':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            <span>Done</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800">
            <Clock className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            <Circle className="w-3 h-3" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  return (
    <div className={isEmbedded ? "space-y-3" : "p-4 space-y-4 overflow-y-auto"}>
      {!isEmbedded && (
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white">Grow My Business</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Actionable roadmap broken down into manageable phases for your store.
          </p>
        </div>
      )}

      {/* Timeframe selector tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        {(['Today', 'This Week', 'This Month'] as ActionPlanTimeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              selectedTimeframe === tf
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Action Plan list */}
      <div className="space-y-3">
        {filteredPlans.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-sm text-white">{item.title}</h3>
              {getStatusBadge(item.status)}
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <p>
                <strong className="text-slate-400">Why it matters:</strong> {item.reason}
              </p>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <strong className="text-slate-300">Evidence:</strong> {item.supportingData}
              </div>
              <p className="text-emerald-400 font-medium">
                👉 Suggested Action: {item.suggestedAction}
              </p>
            </div>

            {/* Toggle Status Buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">Update progress:</span>
              <div className="flex space-x-1.5">
                {(['Not Started', 'In Progress', 'Done'] as ActionPlanStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(item.id, st)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${
                      item.status === st
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
