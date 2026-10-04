import React, { useState } from 'react';

interface KoraLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  isLoading?: boolean;
}

const SIZE_MAP = {
  xs: { container: 'w-5 h-5 rounded-full text-xs', img: 'w-5 h-5', text: 'text-xs' },
  sm: { container: 'w-8 h-8 rounded-full text-sm', img: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10 rounded-full text-base', img: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-14 h-14 rounded-full text-xl', img: 'w-14 h-14', text: 'text-xl' },
  xl: { container: 'w-24 h-24 rounded-full text-3xl', img: 'w-24 h-24', text: 'text-2xl' },
};

export const KoraLogo: React.FC<KoraLogoProps> = ({
  size = 'sm',
  className = '',
  showText = false,
  isLoading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_MAP[size];

  // When loading, use the dedicated circular thinking logo
  const logoSrc = isLoading
    ? '/src/assets/images/kora_loading_logo_1791134296653.jpg'
    : '/src/assets/images/kora_logo_1791131488559.jpg';

  return (
    <div className={`flex items-center space-x-2 shrink-0 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Animated glowing cyan/purple ring when loading */}
        {isLoading && (
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-600 blur-[2px] animate-[spin_3s_linear_infinite]" />
        )}

        <div
          className={`relative overflow-hidden flex items-center justify-center select-none shadow-md bg-slate-950 ${sizeConfig.container} ${
            isLoading
              ? 'border-2 border-cyan-400 shadow-cyan-500/40 ring-1 ring-cyan-300/60'
              : 'border border-emerald-500/30 shadow-emerald-500/20'
          }`}
        >
          {!imageError ? (
            <img
              src={logoSrc}
              alt="Kora Logo"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            /* High-fidelity Vector SVG Geometric K Mark Fallback with Cyan/Purple Ribbon & Star in O */
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="kora-cyan-blue-fallback" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <linearGradient id="kora-violet-fallback" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>

              {/* Background disc */}
              <circle cx="20" cy="20" r="20" fill="#030712" />

              {/* Glowing ring rim */}
              <circle
                cx="20"
                cy="20"
                r="18.5"
                stroke={isLoading ? '#00E5FF' : '#10B981'}
                strokeWidth={isLoading ? '1.5' : '1'}
              />

              {/* Left stem */}
              <path
                d="M14 11C14 10.4 14.4 10 15 10H17C17.6 10 18 10.4 18 11V29C18 29.6 17.6 30 17 30H15C14.4 30 14 29.6 14 29V11Z"
                fill="url(#kora-cyan-blue-fallback)"
              />

              {/* Upper ribbon wing */}
              <path
                d="M17.5 21L25.5 11.5C26 11 26.8 11 27.2 11.5L28.5 13C29 13.5 29 14.2 28.5 14.8L21.5 23L17.5 21Z"
                fill="url(#kora-violet-fallback)"
              />

              {/* Lower ribbon leg */}
              <path
                d="M20 22L27 30C27.5 30.5 27.3 31.2 26.8 31.5L25 32.5C24.5 32.8 23.8 32.6 23.4 32.2L16 23.5L20 22Z"
                fill="url(#kora-cyan-blue-fallback)"
              />

              {/* Star sparkle in O or node */}
              <path
                d="M20 20L20.8 18L21.6 20L23.6 20.8L21.6 21.6L20.8 23.6L20 21.6L18 20.8Z"
                fill="#FFFFFF"
              />
            </svg>
          )}
        </div>
      </div>

      {showText && (
        <span className={`font-black tracking-tight text-white ${sizeConfig.text}`}>
          Kora<span className="text-cyan-400">.</span>
        </span>
      )}
    </div>
  );
};
