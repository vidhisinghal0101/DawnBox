import React from 'react';

export const DawnBoxLogo = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="sidebarGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ec4899" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6H4z" fill="url(#sidebarGrad)" opacity="0.4" />
    <path d="M22 12H2l3-7a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 5l3 7z" fill="url(#sidebarGrad)" />
    <circle cx="12" cy="7" r="3.5" fill="#fcd34d" />
  </svg>
);
