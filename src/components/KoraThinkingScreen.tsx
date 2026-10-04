import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  BarChart3,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { KoraLogo } from './KoraLogo';

interface KoraThinkingScreenProps {
  /** If inline, it renders cleanly as a card suitable for embedding in chat or views. If false, full-screen overlay. */
  isInline?: boolean;
  /** Custom title, defaults to "KORA is thinking..." */
  title?: string;
  /** Subtitle, defaults to "Turning your ideas into real opportunities" */
  subtitle?: string;
  /** Optional active step index (0 to 3). If omitted, auto-cycles. */
  activeStep?: number;
  /** Optional dismiss or cancel callback */
  onCancel?: () => void;
}

const STEPS = [
  {
    id: 'understanding',
    label: 'Understanding your business...',
    icon: Brain,
    desc: 'Reading recent sales, margins & inventory records',
  },
  {
    id: 'analyzing',
    label: 'Analyzing opportunities...',
    icon: Search,
    desc: 'Identifying fast-movers, profit gaps & customer patterns',
  },
  {
    id: 'building',
    label: 'Building your strategy...',
    icon: BarChart3,
    desc: 'Calculating recommended pricing & growth roadmap',
  },
  {
    id: 'preparing',
    label: 'Preparing your answer...',
    icon: Lightbulb,
    desc: 'Synthesizing actionable advice and next steps',
  },
];

export const KoraThinkingScreen: React.FC<KoraThinkingScreenProps> = ({
  isInline = false,
  title = 'KORA is thinking...',
  subtitle = 'Turning your ideas into real opportunities',
  activeStep: controlledStep,
  onCancel,
}) => {
  const [internalStep, setInternalStep] = useState(0);

  // Auto-cycle through the 4 steps while loading
  useEffect(() => {
    if (controlledStep !== undefined) return;
    const interval = setInterval(() => {
      setInternalStep((prev) => (prev + 1) % STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [controlledStep]);

  const currentStepIndex = controlledStep !== undefined ? controlledStep : internalStep;

  // Render the circular loading logo mark from the user's design
  const renderLoadingEmblem = (sizeClass: string = 'w-36 h-36') => (
    <div className={`relative ${sizeClass} mx-auto flex items-center justify-center select-none`}>
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-purple-600/20 blur-xl animate-pulse" />

      {/* Rotating neon light ring with flare */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-600 opacity-80 blur-[2px] animate-[spin_4s_linear_infinite]" />

      {/* High-resolution circular image asset from the uploaded design */}
      <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-cyan-400/90 shadow-[0_0_25px_rgba(6,182,212,0.5)] bg-slate-950 flex items-center justify-center">
        <img
          src="/src/assets/images/kora_loading_logo_1791134296653.jpg"
          alt="Kora Thinking Logo"
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If image fails, fallback to inline SVG vector representation
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Vector SVG Fallback with Cyan/Purple Ribbon K and Star in O */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <defs>
              <linearGradient id="kora-cyan-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="kora-violet-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="60%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
              <radialGradient id="ring-flare" cx="80%" cy="20%" r="30%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Neon Ring */}
            <circle cx="50" cy="50" r="46" stroke="url(#kora-cyan-blue)" strokeWidth="3" />
            <circle cx="78" cy="22" r="5" fill="url(#ring-flare)" />

            {/* 3D Cyan & Purple Ribbon K */}
            {/* Left curved stem */}
            <path
              d="M36 28C36 26.5 37.5 25 39.5 25C41.5 25 43 26.5 43 28V62C43 63.5 41.5 65 39.5 65C37.5 65 36 63.5 36 62V28Z"
              fill="url(#kora-cyan-blue)"
            />
            {/* Right upper wing */}
            <path
              d="M42 45L58 26C59.5 24.5 62 25 63 27L65 30C66 32 65 34 63.5 35.5L50 49L42 45Z"
              fill="url(#kora-violet-purple)"
            />
            {/* Right lower leg */}
            <path
              d="M48 47L64 63C65.5 64.5 65 66.5 63 67.5L60 69C58 70 56 69.5 54.5 68L39 52L48 47Z"
              fill="url(#kora-cyan-blue)"
            />

            {/* Typography K O R A with Star in O */}
            <g transform="translate(18, 77)">
              <text
                x="32"
                y="10"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                letterSpacing="3"
              >
                KORA
              </text>
              {/* Star inside the O (centered around x=31, y=6.5) */}
              <path
                d="M30 6.5L31 3.5L32 6.5L35 7.5L32 8.5L31 11.5L30 8.5L27 7.5Z"
                fill="#FFFFFF"
              />
            </g>
          </svg>
        </div>

        {/* Glint effect over the logo */}
        <div className="absolute -top-1 right-3 w-4 h-4 rounded-full bg-white blur-[1px] shadow-[0_0_12px_#ffffff]" />
      </div>
    </div>
  );

  // 1. INLINE / CARD MODE (Ideal for Chat response thinking, modals, or section loading)
  if (isInline) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-slate-950 border border-cyan-500/30 p-6 shadow-2xl space-y-6">
        {/* Subtle background ambient waves */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-blue-950/40 via-purple-950/20 to-transparent pointer-events-none" />

        {/* Top brand header */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-1 h-3.5 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
            <span className="font-semibold text-slate-300">Kora Intelligence</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/80">
            v1.0
          </span>
        </div>

        {/* Center Loading Logo */}
        <div className="py-2">
          {renderLoadingEmblem('w-28 h-28 sm:w-32 sm:h-32')}
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-1">
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            <span className="text-cyan-400">KORA</span>{' '}
            <span className="text-white">is thinking...</span>
          </h3>
          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        {/* 4 Animated Steps */}
        <div className="space-y-2.5 max-w-sm mx-auto">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-2.5 rounded-2xl transition duration-300 ${
                  isActive
                    ? 'bg-slate-900/90 border border-cyan-500/50 shadow-md shadow-cyan-950/40'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                {/* Radio ring indicator */}
                <div className="shrink-0 flex items-center justify-center">
                  {isActive ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00E5FF]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                  )}
                </div>

                {/* Icon badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Tagline */}
        <div className="text-center pt-2">
          <div className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-semibold">
            Bigger Dreams &bull; Smarter Plans &bull; Together
          </div>
        </div>
      </div>
    );
  }

  // 2. FULL VIEW / MODAL SCREEN MODE
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col justify-between p-6 sm:p-8 overflow-y-auto">
      {/* Top Corners Branding */}
      <div className="flex items-start justify-between">
        {/* Top-Left: "Your Ideas, Our Focus, Your Success" */}
        <div className="flex items-center space-x-2.5">
          <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-cyan-400 via-sky-500 to-purple-500 shadow-[0_0_10px_#00E5FF]" />
          <div className="text-[11px] leading-tight font-medium text-slate-300">
            <div>Your Ideas</div>
            <div>Our Focus</div>
            <div className="text-slate-400">Your Success</div>
          </div>
        </div>

        {/* Top-Right: KORA v1.0 */}
        <div className="text-right">
          <div className="text-xs font-black tracking-widest text-slate-200">KORA</div>
          <div className="text-[10px] text-cyan-400 font-mono">v1.0</div>
        </div>
      </div>

      {/* Center Content Area */}
      <div className="max-w-md w-full mx-auto my-auto space-y-7 py-6">
        {/* Glowing Circular Loading Logo */}
        <div>{renderLoadingEmblem('w-36 h-36 sm:w-44 sm:h-44')}</div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            <span className="text-cyan-400">KORA</span>{' '}
            <span className="text-white">is thinking...</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            {subtitle}
          </p>
        </div>

        {/* 4 Animated Sequential Thinking Steps */}
        <div className="space-y-3 pt-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-3.5 p-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-900/90 border border-cyan-500/50 shadow-lg shadow-cyan-950/60 scale-[1.02]'
                    : 'opacity-40 hover:opacity-60'
                }`}
              >
                {/* Radio Ring with Active Glow */}
                <div className="shrink-0 flex items-center justify-center">
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center animate-pulse shadow-[0_0_12px_#00E5FF]">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00E5FF]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700" />
                  )}
                </div>

                {/* Step Icon Badge */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition ${
                    isActive
                      ? 'bg-gradient-to-tr from-cyan-500/30 to-purple-600/30 text-cyan-300 border border-cyan-400/50 shadow-md'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Step Text & Description */}
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-bold truncate ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  {isActive && (
                    <div className="text-[11px] text-cyan-400/90 truncate animate-fadeIn">
                      {step.desc}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {onCancel && (
          <div className="text-center pt-2">
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Bottom Horizon Wave & Tagline */}
      <div className="relative pt-6">
        {/* Glowing Horizon Wave Gradient */}
        <div className="absolute inset-x-0 bottom-6 h-20 bg-gradient-to-t from-blue-600/20 via-purple-600/10 to-transparent blur-xl pointer-events-none" />

        <div className="relative text-center">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-slate-400 font-bold">
            BIGGER DREAMS &bull; SMARTER PLANS &bull; TOGETHER
          </div>
        </div>
      </div>
    </div>
  );
};
