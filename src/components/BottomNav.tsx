import React from 'react';
import {
  Home,
  Package,
  ShoppingBag,
  Users,
  Sparkles,
} from 'lucide-react';

export type TabType = 'home' | 'products' | 'sales' | 'customers' | 'kora';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  badgeCount = 0,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'products' as TabType, label: 'Products', icon: Package },
    { id: 'sales' as TabType, label: 'Sales', icon: ShoppingBag },
    { id: 'customers' as TabType, label: 'Customers', icon: Users },
    {
      id: 'kora' as TabType,
      label: 'Kora',
      icon: Sparkles,
      isSpecial: true,
      hasBadge: badgeCount > 0,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center space-y-1 transition duration-150 ${
                isActive
                  ? tab.isSpecial
                    ? 'text-emerald-400 font-semibold'
                    : 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.isSpecial ? (
                  <div
                    className={`p-1.5 rounded-xl transition ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}

                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-slate-950 font-bold flex items-center justify-center ring-2 ring-slate-900">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>

              <span className="text-[11px] tracking-tight">{tab.label}</span>

              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
