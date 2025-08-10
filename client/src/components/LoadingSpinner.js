import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-[#0b9766] border-t-transparent rounded-full animate-spin`}></div>
      {text && <div className="text-[#91cab6] text-sm">{text}</div>}
    </div>
  );
} 