import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { getReducedMotionTransition } from '../data/variants';

interface DropdownProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  error?: string;
  'aria-label'?: string;
  id?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  isOpen, 
  onToggle, 
  onClose,
  searchable = false,
  searchValue = '',
  onSearchChange,
  error,
  'aria-label': ariaLabel,
  id,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Reset focused index when options change
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen, options]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        onToggle();
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      buttonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchable && searchInputRef.current) {
        searchInputRef.current.blur();
      }
      const nextIndex = focusedIndex < options.length - 1 ? focusedIndex + 1 : 0;
      setFocusedIndex(nextIndex);
      scrollToIndex(nextIndex);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchable && searchInputRef.current) {
        searchInputRef.current.blur();
      }
      const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : options.length - 1;
      setFocusedIndex(prevIndex);
      scrollToIndex(prevIndex);
    }

    if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < options.length) {
      e.preventDefault();
      onChange(options[focusedIndex]);
      onClose();
      buttonRef.current?.focus();
    }

    if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
      scrollToIndex(0);
    }

    if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = options.length - 1;
      setFocusedIndex(lastIndex);
      scrollToIndex(lastIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.children;
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  const filteredOptions = searchable && searchValue
    ? options.filter(opt => opt.toLowerCase().includes(searchValue.toLowerCase()))
    : options;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
                  className={`w-full bg-[#F8F7F3] border-b flex items-center justify-between cursor-pointer group transition-all duration-200 ease-out focus:outline-none rounded-t-sm ${
          error ? 'border-[#B45309]/40' : 'border-[#D4C9BC] hover:border-[#B8A895]'
        }`}
        style={{
          borderBottom: `1px solid ${error ? 'rgba(180, 83, 9, 0.4)' : isOpen ? '#1E293B' : '#D4C9BC'}`,
          boxShadow: isOpen ? '0 0 0 3px rgba(30, 41, 59, 0.08)' : 'none',
          transition: 'border-color 200ms ease-out, box-shadow 200ms ease-out',
        }}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        id={id}
      >
        <span className={`text-lg md:text-xl lg:text-2xl font-serif ${value ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`} style={{ opacity: value ? 1 : 1 }}>
          {value || placeholder}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-[#64748B] transition-transform duration-200 ease-out flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          style={{ opacity: 1 }}
          aria-hidden="true"
        />
      </button>
      {error && (
        <p className="text-[8px] text-[#B45309] font-black uppercase tracking-[0.15em]" role="alert" style={{ opacity: 1, marginTop: '0.25rem' }}>
          {error}
        </p>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            id={id ? `${id}-listbox` : undefined}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={getReducedMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] })}
            className="absolute top-full left-0 right-0 z-[100] bg-[#F9F8F4] border border-[#D4C9BC] max-h-[200px] overflow-hidden flex flex-col rounded-sm"
            style={{ marginTop: '0.375rem' }}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {searchable && onSearchChange && (
              <div className="border-b border-[#D4C9BC] flex items-center bg-[#F9F8F4] flex-shrink-0" style={{ padding: '0.5rem', gap: '0.5rem' }}>
                <Search size={12} className="text-[#64748B]" aria-hidden="true" style={{ opacity: 1 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  value={searchValue}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      searchInputRef.current?.blur();
                      setFocusedIndex(0);
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      onClose();
                      buttonRef.current?.focus();
                    }
                  }}
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none w-full text-[9px] font-bold focus:ring-0 text-[#1E293B] placeholder:text-[#94A3B8]"
                  aria-label="Search options"
                />
              </div>
            )}
            <div
              ref={listRef}
              className="overflow-y-auto flex-1 dropdown-scroll max-h-[200px]"
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              role="group"
            >
              {filteredOptions.length === 0 ? (
                <div className="text-xs md:text-sm font-serif text-[#64748B] italic" style={{ opacity: 1, padding: '0.5rem 1rem' }}>
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt, index) => (
                  <div
                    key={opt}
                    role="option"
                    aria-selected={value === opt}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt);
                      onClose();
                      buttonRef.current?.focus();
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    onMouseLeave={() => setFocusedIndex(-1)}
                    className="text-xs md:text-sm font-serif cursor-pointer border-b border-[#D4C9BC]/30 focus:outline-none transition-colors duration-150"
                    style={{ padding: '0.625rem 1rem' }}
                    style={{
                      backgroundColor: index === focusedIndex ? '#1E293B' : value === opt ? '#F5F3F1' : 'transparent',
                      color: index === focusedIndex ? '#FFFFFF' : '#1E293B',
                      outline: index === focusedIndex ? '2px solid #1E293B' : 'none',
                      outlineOffset: '0px',
                      opacity: 1,
                      lineHeight: 1.5,
                      transition: 'background-color 150ms ease-out, color 150ms ease-out',
                    }}
                  >
                    {opt}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DateSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  error?: string;
  'aria-label'?: string;
  id?: string;
}

export const DateSelect: React.FC<DateSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  isOpen, 
  onToggle, 
  onClose,
  error,
  'aria-label': ariaLabel,
  id,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        onToggle();
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      buttonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = focusedIndex < options.length - 1 ? focusedIndex + 1 : 0;
      setFocusedIndex(nextIndex);
      scrollToIndex(nextIndex);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : options.length - 1;
      setFocusedIndex(prevIndex);
      scrollToIndex(prevIndex);
    }

    if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < options.length) {
      e.preventDefault();
      onChange(options[focusedIndex]);
      onClose();
      buttonRef.current?.focus();
    }
  };

  const scrollToIndex = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.children;
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="relative date-select-container">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className={`w-full bg-[#F8F7F3] border-b flex items-center justify-between cursor-pointer group transition-all duration-200 ease-out focus:outline-none rounded-t-sm ${
          error ? 'border-[#B45309]/40' : 'border-[#D4C9BC] hover:border-[#B8A895]'
        }`}
        style={{
          borderBottom: `1px solid ${error ? 'rgba(180, 83, 9, 0.4)' : isOpen ? '#1E293B' : '#D4C9BC'}`,
          boxShadow: isOpen ? '0 0 0 3px rgba(30, 41, 59, 0.08)' : 'none',
          transition: 'border-color 200ms ease-out, box-shadow 200ms ease-out',
        }}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        id={id}
      >
        <span className={`text-xs md:text-sm lg:text-base font-serif ${value ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`} style={{ opacity: 1 }}>
          {value || placeholder}
        </span>
        <ChevronDown 
          size={12} 
          className={`text-[#64748B] transition-transform duration-200 ease-out flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
          style={{ opacity: 1 }}
          aria-hidden="true"
        />
      </button>
      {error && (
        <p className="text-[8px] text-[#B45309] font-black uppercase tracking-[0.15em]" role="alert" style={{ opacity: 1, marginTop: '0.25rem' }}>
          {error}
        </p>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            id={id ? `${id}-listbox` : undefined}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={getReducedMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] })}
            className="absolute top-full left-0 right-0 z-[100] bg-[#F9F8F4] border border-[#D4C9BC] mt-1.5 max-h-[180px] overflow-hidden flex flex-col rounded-sm"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="overflow-y-auto flex-1 dropdown-scroll max-h-[180px] py-2 px-2">
              {options.map((opt, index) => (
                <div
                  key={opt}
                  role="option"
                  aria-selected={value === opt}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    onClose();
                    buttonRef.current?.focus();
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onMouseLeave={() => setFocusedIndex(-1)}
                  className="px-4 py-2.5 text-xs md:text-sm font-serif cursor-pointer border-b border-[#D4C9BC]/30 focus:outline-none transition-colors duration-150"
                  style={{
                    backgroundColor: index === focusedIndex ? '#1E293B' : value === opt ? '#F5F3F1' : 'transparent',
                    color: index === focusedIndex ? '#FFFFFF' : '#1E293B',
                    outline: index === focusedIndex ? '2px solid #1E293B' : 'none',
                    outlineOffset: '0px',
                    borderRadius: '2px',
                    opacity: 1,
                    lineHeight: 1.5,
                    transition: 'background-color 150ms ease-out, color 150ms ease-out',
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
