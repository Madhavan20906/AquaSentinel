import type { SVGProps } from 'react';

export function AquaSentinelEmblem({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-md transition-transform duration-200 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="emblemBgGrad" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0a2a28" />
          <stop offset="50%" stop-color="#0f3b38" />
          <stop offset="100%" stop-color="#081e1d" />
        </linearGradient>
        <linearGradient id="emblemBorder" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.9" />
          <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.8" />
        </linearGradient>
        <linearGradient id="emblemDrop" x1="90" y1="34" x2="90" y2="138" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="35%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#0d9488" />
        </linearGradient>
        <linearGradient id="emblemWave1" x1="40" y1="100" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>
        <linearGradient id="emblemWave2" x1="45" y1="115" x2="135" y2="152" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#0d9488" stop-opacity="0.9" />
        </linearGradient>
        <radialGradient id="emblemBeacon" cx="90" cy="50" r="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fde047" stop-opacity="1" />
          <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
        </radialGradient>
      </defs>

      {/* Hex/Squircle Shield Badge */}
      <rect x="8" y="8" width="164" height="164" rx="42" fill="url(#emblemBgGrad)" stroke="url(#emblemBorder)" stroke-width="4.5" />

      {/* Sentinel Radar Range Arcs */}
      <circle cx="90" cy="90" r="54" stroke="#14b8a6" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="4 4" fill="none" />
      <circle cx="90" cy="90" r="32" stroke="#2dd4bf" stroke-opacity="0.18" stroke-width="1.5" fill="none" />

      {/* Water Droplet Sentinel Core */}
      <path
        d="M90 34 C90 34, 126 78, 126 102 C126 122 109.9 138 90 138 C70.1 138 54 122 54 102 C54 78, 90 34, 90 34 Z"
        fill="url(#emblemDrop)"
      />

      {/* Dynamic Fluid Flow Waves */}
      <path
        d="M60 106 C72 98, 80 114, 92 106 C104 98, 112 110, 120 104 C123.5 108.5, 125.5 114, 125.5 120 C121 127, 108 123, 96 129 C84 135, 70 128, 60 124 C57 118, 56.5 112, 60 106 Z"
        fill="url(#emblemWave1)"
        opacity="0.95"
      />
      <path
        d="M66 120 C76 115, 84 124, 94 119 C104 114, 114 121, 122 117 C120 124, 114 130, 106 133 C95 137, 82 133, 72 131 C68.5 127.5, 66.5 124, 66 120 Z"
        fill="url(#emblemWave2)"
        opacity="0.85"
      />

      {/* Luminous Sentinel Beacon Node */}
      <circle cx="90" cy="50" r="14" fill="url(#emblemBeacon)" />
      <circle cx="90" cy="50" r="6" fill="#fef08a" stroke="#d97706" stroke-width="1.5" />
      <circle cx="90" cy="50" r="2.5" fill="#ffffff" />

      {/* Top Sentinel Notch */}
      <path d="M85 14 L95 14 L90 22 Z" fill="#2dd4bf" opacity="0.9" />
    </svg>
  );
}

export function AquaSentinelLogo({
  light = false,
  size = 'default',
  showSubtitle = false,
}: {
  light?: boolean;
  size?: 'sm' | 'default' | 'lg';
  showSubtitle?: boolean;
}) {
  const pixelSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-3 select-none">
      <AquaSentinelEmblem size={pixelSize} />
      <div className="flex flex-col">
        <span className={`font-display ${textSize} font-bold tracking-tight leading-tight ${light ? 'text-white' : 'text-[hsl(var(--foreground))]'}`}>
          Aqua<span className="bg-gradient-to-r from-amber-400 via-amber-300 to-teal-300 bg-clip-text text-transparent">Sentinel</span>
        </span>
        {showSubtitle && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-teal-300/80 -mt-0.5">
            Environmental Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
