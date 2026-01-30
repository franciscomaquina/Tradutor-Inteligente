import React from 'react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="10%" y1="10%" x2="90%" y2="90%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Background Bubble Shape - Smooth & Modern */}
    <path 
      d="M20 35C20 23.9543 28.9543 15 40 15H70C81.0457 15 90 23.9543 90 35V60C90 71.0457 81.0457 80 70 80H55L35 90V80H40C28.9543 80 20 71.0457 20 60V35Z" 
      fill="url(#logoGradient)" 
      className="drop-shadow-sm"
    />
    
    {/* Inner Cutout/Spark representing AI Logic */}
    <path
      d="M55 35L58 43L66 45L58 47L55 55L52 47L44 45L52 43L55 35Z"
      fill="white"
    />
    <circle cx="70" cy="35" r="3" fill="white" fillOpacity="0.6" />
    <circle cx="40" cy="60" r="3" fill="white" fillOpacity="0.6" />
    
    {/* Circuit lines connecting dots to spark */}
    <path d="M67 36L60 42" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
    <path d="M43 59L50 50" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
  </svg>
);