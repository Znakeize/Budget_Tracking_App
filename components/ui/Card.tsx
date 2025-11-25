import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', gradient, onClick }) => {
  const baseClasses = "glass-panel rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300";
  // If gradient is provided, it overrides bg-white/5. If not, use white/5 in dark and white in light.
  const bgClasses = gradient ? `bg-gradient-to-br ${gradient}` : "bg-white dark:bg-white/5";
  
  return (
    <div className={`${baseClasses} ${bgClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};