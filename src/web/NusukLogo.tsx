import React from 'react';

export function NusukLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nusukLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#DCEBF7" />
          <stop offset="1" stopColor="#9DC1DF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#nusukLogoGrad)"
        d="M24,1L30.74,7.74L40.26,7.74L40.26,17.26L47,24L40.26,30.74L40.26,40.26L30.74,40.26L24,47L17.26,40.26L7.74,40.26L7.74,30.74L1,24L7.74,17.26L7.74,7.74L17.26,7.74Z"
      />
      <path
        fill="#2F5C89"
        d="M24,4.5L29.71,10.21L37.79,10.21L37.79,18.29L43.5,24L37.79,29.71L37.79,37.79L29.71,37.79L24,43.5L18.29,37.79L10.21,37.79L10.21,29.71L4.5,24L10.21,18.29L10.21,10.21L18.29,10.21Z"
      />
      <g transform="translate(14.4, 14.4) scale(0.8)">
        <path
          fill="none"
          stroke="url(#nusukLogoGrad)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12.5,15A4.5,4.5 0,1 1,3.5,15A4.5,4.5 0,1 1,12.5,15Z M11.2,11.8L20,3 M16.5,6.5L19,9 M14,9L16,11"
        />
      </g>
    </svg>
  );
}

export function AutoCodesIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        stroke="#1E3A5C"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2,12 V10 a2,2 0 0 1 2,-2 H16 a2,2 0 0 1 2,2 V12 a2,2 0 0 0 0,4 V18 a2,2 0 0 1 -2,2 H4 a2,2 0 0 1 -2,-2 V16 a2,2 0 0 0 0,-4 Z"
      />
      <path
        stroke="#1E3A5C"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M12,10.5 v1 M12,13.5 v1 M12,16.5 v1"
      />
      <path
        stroke="#C8A24A"
        strokeWidth="1.3"
        strokeLinejoin="round"
        d="M19.5,1.8 L20.4,4.1 L22.7,5 L20.4,5.9 L19.5,8.2 L18.6,5.9 L16.3,5 L18.6,4.1 Z"
      />
    </svg>
  );
}

export function AutoQuizIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        stroke="#1E3A5C"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6,21 V10 a6,6 0 0 1 12,0 V21 M3,21 H21"
      />
      <path
        stroke="#1E3A5C"
        strokeWidth="2"
        strokeLinecap="round"
        d="M15,15 h0.01"
      />
      <path
        stroke="#C8A24A"
        strokeWidth="1.3"
        strokeLinejoin="round"
        d="M21,1.6 L21.8,3.6 L23.8,4.4 L21.8,5.2 L21,7.2 L20.2,5.2 L18.2,4.4 L20.2,3.6 Z"
      />
    </svg>
  );
}

export function StarDeco({ className = 'w-28 h-28' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path
        stroke="#7FA8D2"
        strokeWidth="0.6"
        d="M24,1L30.74,7.74L40.26,7.74L40.26,17.26L47,24L40.26,30.74L40.26,40.26L30.74,40.26L24,47L17.26,40.26L7.74,40.26L7.74,30.74L1,24L7.74,17.26L7.74,7.74L17.26,7.74Z"
      />
      <g transform="translate(24,24) scale(0.74) translate(-24,-24)">
        <path
          stroke="#7FA8D2"
          strokeWidth="0.7"
          d="M24,1L30.74,7.74L40.26,7.74L40.26,17.26L47,24L40.26,30.74L40.26,40.26L30.74,40.26L24,47L17.26,40.26L7.74,40.26L7.74,30.74L1,24L7.74,17.26L7.74,7.74L17.26,7.74Z"
        />
      </g>
      <g transform="translate(24,24) scale(0.48) translate(-24,-24)">
        <path
          stroke="#7FA8D2"
          strokeWidth="0.9"
          d="M24,1L30.74,7.74L40.26,7.74L40.26,17.26L47,24L40.26,30.74L40.26,40.26L30.74,40.26L24,47L17.26,40.26L7.74,40.26L7.74,30.74L1,24L7.74,17.26L7.74,7.74L17.26,7.74Z"
        />
      </g>
    </svg>
  );
}
