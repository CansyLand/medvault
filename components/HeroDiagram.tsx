
import React from 'react';

export const HeroDiagram: React.FC = () => {
  return (
    <svg viewBox="0 0 800 1000" className="w-full h-full opacity-80">
      <defs>
        <pattern id="dotGridLight" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(126, 34, 206, 0.08)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotGridLight)" />

      <g className="diagram-paths">
        <path d="M 100 300 H 600" className="diagram-path" />
        <path d="M 220 100 V 300" className="diagram-path" />
        <path d="M 520 100 V 300" className="diagram-path" />
        <path d="M 320 300 V 850" className="diagram-path" />
        <path d="M 320 420 H 100" className="diagram-path" />
        <path d="M 320 680 H 520 V 500" className="diagram-path" />
        <path d="M 320 850 H 520" className="diagram-path" />
        
        <path d="M 520 180 Q 620 180 620 300" className="diagram-path" />
        <path d="M 220 420 Q 220 540 320 540" className="diagram-path" />
        <path d="M 520 540 Q 620 540 620 680" className="diagram-path" />
        <path d="M 320 780 Q 420 780 420 900" className="diagram-path" />
      </g>

      {/* Nodes using darker purple */}
      <circle cx="220" cy="300" r="10" className="diagram-node" />
      <circle cx="320" cy="420" r="10" className="diagram-node" />
      <circle cx="520" cy="180" r="10" className="diagram-node" />
      <circle cx="420" cy="540" r="10" className="diagram-node" />
      <circle cx="520" cy="420" r="10" className="diagram-node" />

      <rect x="210" y="90" width="22" height="22" rx="4" className="diagram-node" />
      <rect x="610" y="670" width="22" height="22" rx="4" className="diagram-node" />

      <g transform="translate(420, 300) rotate(45)">
        <rect x="-10" y="-10" width="20" height="20" rx="2" className="diagram-node" />
      </g>
      <g transform="translate(220, 540) rotate(45)">
        <rect x="-10" y="-10" width="20" height="20" rx="2" className="diagram-node" />
      </g>
      <g transform="translate(520, 680) rotate(45)">
        <rect x="-10" y="-10" width="20" height="20" rx="2" className="diagram-node" />
      </g>
      <g transform="translate(320, 850) rotate(45)">
        <rect x="-10" y="-10" width="20" height="20" rx="2" className="diagram-node" />
      </g>

      <g transform="translate(50, 250)">
        <path d="M 50 0 A 50 50 0 1 0 50 100" fill="none" stroke="#7e22ce" strokeWidth="12" strokeLinecap="round" />
        <circle cx="50" cy="50" r="10" className="diagram-node" />
        <line x1="62" y1="50" x2="100" y2="50" stroke="#7e22ce" strokeWidth="6" />
      </g>
      
      <text x="700" y="940" fill="#7e22ce" className="text-xl font-bold opacity-20 font-merriweather">core3</text>
    </svg>
  );
};
