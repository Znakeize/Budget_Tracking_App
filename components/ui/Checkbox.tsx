import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, id, className = '' }) => {
  // Use a stable ID. In React 18+, useId is preferred but for compatibility we can fallback or generate.
  const uniqueId = id || React.useId?.() || `cb-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`custom-cb-wrapper ${className}`}>
      <input 
        className="custom-cb-input" 
        id={uniqueId} 
        type="checkbox" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label className="custom-cb-label" htmlFor={uniqueId}>
        <svg viewBox="0 0 18 18" height="18px" width="18px">
          <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z" />
          <polyline points="1 9 7 14 15 4" />
        </svg>
      </label>
    </div>
  );
};
