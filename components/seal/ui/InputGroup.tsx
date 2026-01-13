import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getReducedMotionTransition } from '../data/variants';

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  'aria-label'?: string;
  id?: string;
  required?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  error,
  'aria-label': ariaLabel,
  id,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div style={{ gap: '0.625rem', display: 'flex', flexDirection: 'column' }}>
      <label 
        htmlFor={id}
        className={`text-[9px] uppercase tracking-[0.30em] font-black block ${
          error ? 'text-[#B45309]' : 'text-[#475569]'
        }`}
        style={{ opacity: 1 }}
      >
        {label}
        {required && <span className="text-[#B45309] ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={id}
        type="text"
        name={`${id}-no-autofill`}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        placeholder={placeholder}
        aria-label={ariaLabel || label}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full bg-[#F8F7F3] text-xl md:text-2xl lg:text-3xl font-serif font-light tracking-tight outline-none transition-all duration-200 ease-out text-[#1E293B] rounded-t-sm placeholder:text-[#94A3B8]"
        style={{
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: `1px solid ${error ? 'rgba(180, 83, 9, 0.4)' : isFocused ? '#B8A895' : isHovered ? '#C8BBA7' : '#D4C9BC'}`,
          boxShadow: isFocused ? '0 0 0 3px rgba(184, 168, 149, 0.06)' : 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          color: '#1E293B',
          lineHeight: 1.5,
          transition: 'border-color 200ms ease-out, box-shadow 200ms ease-out',
        }}
        data-1p-ignore
        data-lpignore="true"
      />
      {error && (
        <motion.p
          id={id ? `${id}-error` : undefined}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={getReducedMotionTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
          className="text-[8px] text-[#B45309] font-black uppercase tracking-[0.15em]"
          style={{ marginTop: '0.25rem', lineHeight: 1.5 }}
          role="alert"
          aria-live="polite"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
