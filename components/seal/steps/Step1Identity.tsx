import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { StepShell } from '../ui/StepShell';
import { InputGroup } from '../ui/InputGroup';
import { DateSelect } from '../ui/Dropdown';
import { getReducedMotionTransition } from '../data/variants';
import { MONTHS, DAYS, getYears } from '../data/constants';

interface Step1IdentityProps {
  formData: {
    name: string;
    country: string;
    town: string;
  };
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  countrySearch: string;
  citySearch: string;
  showCountryMenu: boolean;
  showCityMenu: boolean;
  showDayMenu: boolean;
  showMonthMenu: boolean;
  showYearMenu: boolean;
  filteredCountries: string[];
  filteredCities: string[];
  availableCities: string[];
  onFormDataChange: (data: Partial<{ name: string; country: string; town: string }>) => void;
  onDobDayChange: (day: string) => void;
  onDobMonthChange: (month: string) => void;
  onDobYearChange: (year: string) => void;
  onCountrySearchChange: (value: string) => void;
  onCitySearchChange: (value: string) => void;
  onShowCountryMenu: (show: boolean) => void;
  onShowCityMenu: (show: boolean) => void;
  onShowDayMenu: (show: boolean) => void;
  onShowMonthMenu: (show: boolean) => void;
  onShowYearMenu: (show: boolean) => void;
  onNext: () => void;
  errors?: {
    name?: string;
    country?: string;
    town?: string;
    dob?: string;
  };
}

export const Step1Identity: React.FC<Step1IdentityProps> = ({
  formData,
  dobDay,
  dobMonth,
  dobYear,
  countrySearch,
  citySearch,
  showCountryMenu,
  showCityMenu,
  showDayMenu,
  showMonthMenu,
  showYearMenu,
  filteredCountries,
  filteredCities,
  availableCities,
  onFormDataChange,
  onDobDayChange,
  onDobMonthChange,
  onDobYearChange,
  onCountrySearchChange,
  onCitySearchChange,
  onShowCountryMenu,
  onShowCityMenu,
  onShowDayMenu,
  onShowMonthMenu,
  onShowYearMenu,
  onNext,
  errors = {},
}) => {
  const years = getYears();
  
  // Local state for keyboard navigation and manual city input
  const [countryFocusedIndex, setCountryFocusedIndex] = useState(-1);
  const [cityFocusedIndex, setCityFocusedIndex] = useState(-1);
  const [manualCityInput, setManualCityInput] = useState('');
  
  // Refs
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const countryListRef = useRef<HTMLDivElement>(null);
  const cityListRef = useRef<HTMLDivElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const cityButtonRef = useRef<HTMLButtonElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);
  const citySearchInputRef = useRef<HTMLInputElement>(null);
  const manualCityInputRef = useRef<HTMLInputElement>(null);

  // Reset focused indices when dropdowns close
  useEffect(() => {
    if (!showCountryMenu) setCountryFocusedIndex(-1);
    if (!showCityMenu) {
      setCityFocusedIndex(-1);
      setManualCityInput('');
    }
  }, [showCountryMenu, showCityMenu]);

  // Prevent background scrolling when any dropdown is open
  useEffect(() => {
    const hasOpenDropdown = showCountryMenu || showCityMenu;
    
    if (hasOpenDropdown) {
      // Find the scrollable container (StepShell content area)
      const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
      
      const handleWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement;
        // Allow scrolling within dropdown listbox
        const isInDropdownList = target.closest('[role="listbox"]');
        // Block scrolling on background content
        if (!isInDropdownList && scrollContainer?.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        const isInDropdownList = target.closest('[role="listbox"]');
        if (!isInDropdownList && scrollContainer?.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Use passive: false to allow preventDefault
      document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      
      return () => {
        document.removeEventListener('wheel', handleWheel, { capture: true });
        document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      };
    }
  }, [showCountryMenu, showCityMenu]);

  // Reset focus when search changes
  useEffect(() => {
    setCountryFocusedIndex(-1);
  }, [countrySearch]);

  useEffect(() => {
    setCityFocusedIndex(-1);
  }, [citySearch]);

  // Validate form to determine if Next button should be enabled
  const isFormValid = 
    formData.name?.trim() &&
    formData.country &&
    formData.town?.trim() &&
    dobDay &&
    dobMonth &&
    dobYear;

  const handleNext = () => {
    if (isFormValid) {
      onNext();
    }
  };

  // Keyboard navigation helpers
  const scrollToIndex = (listRef: React.RefObject<HTMLDivElement>, index: number) => {
    if (listRef.current) {
      const items = listRef.current.children;
      if (items[index]) {
        (items[index] as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  // Country dropdown handlers
  const handleCountrySelect = (country: string) => {
    onFormDataChange({ country, town: '' });
    onCountrySearchChange('');
    onShowCountryMenu(false);
    countryButtonRef.current?.focus();
  };

  const handleCountryKeyDown = (e: React.KeyboardEvent) => {
    if (!showCountryMenu) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        onShowCountryMenu(true);
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onShowCountryMenu(false);
      countryButtonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (countrySearchInputRef.current) {
        countrySearchInputRef.current.blur();
      }
      const nextIndex = countryFocusedIndex < filteredCountries.length - 1 ? countryFocusedIndex + 1 : 0;
      setCountryFocusedIndex(nextIndex);
      scrollToIndex(countryListRef, nextIndex);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (countrySearchInputRef.current) {
        countrySearchInputRef.current.blur();
      }
      const prevIndex = countryFocusedIndex > 0 ? countryFocusedIndex - 1 : filteredCountries.length - 1;
      setCountryFocusedIndex(prevIndex);
      scrollToIndex(countryListRef, prevIndex);
    }

    if (e.key === 'Enter' && countryFocusedIndex >= 0 && countryFocusedIndex < filteredCountries.length) {
      e.preventDefault();
      handleCountrySelect(filteredCountries[countryFocusedIndex]);
    }
  };

  // City dropdown handlers
  const saveManualCity = () => {
    const value = manualCityInput.trim();
    if (value) {
      onFormDataChange({ town: value });
      onShowCityMenu(false);
      onCitySearchChange('');
      setManualCityInput('');
      cityButtonRef.current?.focus();
    }
  };

  const handleCitySelect = (city: string) => {
    onFormDataChange({ town: city });
    onCitySearchChange('');
    onShowCityMenu(false);
    cityButtonRef.current?.focus();
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    // If focus is in manual input, handle separately
    if (document.activeElement === manualCityInputRef.current) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveManualCity();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onShowCityMenu(false);
      }
      return;
    }

    if (!formData.country) return;

    if (!showCityMenu) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        onShowCityMenu(true);
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onShowCityMenu(false);
      cityButtonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (citySearchInputRef.current) {
        citySearchInputRef.current.blur();
      }
      const nextIndex = cityFocusedIndex < filteredCities.length - 1 ? cityFocusedIndex + 1 : 0;
      setCityFocusedIndex(nextIndex);
      scrollToIndex(cityListRef, nextIndex);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (citySearchInputRef.current) {
        citySearchInputRef.current.blur();
      }
      const prevIndex = cityFocusedIndex > 0 ? cityFocusedIndex - 1 : filteredCities.length - 1;
      setCityFocusedIndex(prevIndex);
      scrollToIndex(cityListRef, prevIndex);
    }

    if (e.key === 'Enter' && cityFocusedIndex >= 0 && cityFocusedIndex < filteredCities.length) {
      e.preventDefault();
      handleCitySelect(filteredCities[cityFocusedIndex]);
    }
  };

  // Inline styles for hover/focus states
  const getDropdownItemStyle = (isFocused: boolean, isSelected: boolean) => ({
    backgroundColor: isFocused ? '#1E293B' : (isSelected ? '#f5f2ed' : 'transparent'),
    color: isFocused ? '#FFFFFF' : '#1E293B',
    outline: isFocused ? '2px solid #1E293B' : 'none',
    outlineOffset: '0px',
    borderRadius: '2px',
    opacity: 1,
    lineHeight: 1.5,
    transition: 'background-color 150ms ease-out, color 150ms ease-out',
  } as React.CSSProperties);

  return (
    <StepShell
      stepNumber={1}
      totalSteps={6}
      title={
        <>
          Tell us <span className="italic font-light">who you are.</span>
        </>
      }
      microcopy="Enter your personal information to establish your presence in the archive."
      onNext={handleNext}
      onBack={undefined}
      canGoNext={true}
      canGoBack={false}
      nextLabel="Add Photos"
      nextDisabled={!isFormValid}
      backDisabled={true}
    >
      <div role="form" aria-label="Personal information" style={{ gap: '2.5rem', display: 'flex', flexDirection: 'column' }}>
        {/* Full Name Input */}
        <InputGroup
          id="name-input"
          label="Full Name"
          value={formData.name}
          onChange={(v) => onFormDataChange({ name: v })}
          placeholder="Your Name"
          error={errors.name}
          required
          aria-label="Full Name"
        />
        
        {/* Country and City Grid */}
        <div className="grid md:grid-cols-2 relative" style={{ gap: '1.5rem' }}>
          {/* Country Dropdown */}
          <div className={`space-y-2.5 relative ${showCountryMenu ? 'z-10' : 'z-0'}`} ref={countryRef}>
            <label
              htmlFor="country-dropdown"
              className={`text-[9px] uppercase tracking-[0.30em] font-black block transition-colors duration-200 ${
                errors.country 
                  ? 'text-[#B45309]' 
                  : formData.country 
                    ? 'text-[#475569]' 
                    : 'text-[#94A3B8]'
              }`}
              style={{ opacity: 1 }}
            >
              Country
              <span className="text-[#B45309] ml-1" aria-label="required">*</span>
            </label>
            <button
              ref={countryButtonRef}
              type="button"
              id="country-dropdown"
              onClick={() => onShowCountryMenu(!showCountryMenu)}
              onKeyDown={handleCountryKeyDown}
              className={`w-full bg-[#F8F7F3] border-b flex items-center justify-between transition-all duration-200 ease-out text-left rounded-t-sm cursor-pointer group focus:outline-none ${
                errors.country ? 'border-[#B45309]/40' : 'border-[#D4C9BC] hover:border-[#B8A895]'
              }`}
              style={{
                borderBottom: `1px solid ${errors.country ? '#B45309' : showCountryMenu ? '#B8A895' : '#D4C9BC'}`,
                boxShadow: showCountryMenu ? '0 0 0 3px rgba(184, 168, 149, 0.06)' : 'none',
              }}
              role="combobox"
              aria-expanded={showCountryMenu}
              aria-haspopup="listbox"
              aria-controls="country-listbox"
              aria-required="true"
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? 'country-error' : undefined}
              aria-label="Select country"
            >
              <span className={`text-lg md:text-xl lg:text-2xl font-serif ${formData.country ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`} style={{ opacity: 1 }}>
                {formData.country || 'Select Country'}
              </span>
              <ChevronDown 
                size={14} 
                className={`text-[#64748B] transition-transform duration-200 ease-out flex-shrink-0 ${showCountryMenu ? 'rotate-180' : ''}`}
                style={{ marginLeft: '0.5rem', opacity: 1 }}
                aria-hidden="true"
              />
            </button>
            {errors.country && (
              <motion.p
                id="country-error"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={getReducedMotionTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
                className="text-[8px] text-[#B45309] font-black uppercase tracking-[0.15em]"
                style={{ marginTop: '0.375rem', lineHeight: 1.5 }}
                role="alert"
                aria-live="polite"
              >
                {errors.country}
              </motion.p>
            )}
            <AnimatePresence>
              {showCountryMenu && (
                <motion.div
                  role="listbox"
                  id="country-listbox"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={getReducedMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] })}
                  className="absolute top-full left-0 right-0 z-[100] bg-[#F9F8F4] border border-[#D4C9BC] max-h-[200px] overflow-hidden flex flex-col rounded-sm"
                  style={{
                    marginTop: '0.375rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search Header */}
                  <div 
                    className="border-b border-[#D4C9BC] flex items-center bg-[#F9F8F4] flex-shrink-0"
                    style={{ padding: '0.5rem', gap: '0.5rem' }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Search size={12} className="text-[#64748B] flex-shrink-0" aria-hidden="true" style={{ opacity: 1 }} />
                    <input
                      ref={countrySearchInputRef}
                      type="text"
                      name="country-search-no-autofill"
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      value={countrySearch}
                      onChange={(e) => {
                        onCountrySearchChange(e.target.value);
                        setCountryFocusedIndex(-1);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          onShowCountryMenu(false);
                          countryButtonRef.current?.focus();
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          countrySearchInputRef.current?.blur();
                          setCountryFocusedIndex(0);
                          scrollToIndex(countryListRef, 0);
                        }
                      }}
                      placeholder="Search..."
                      className="bg-transparent border-none outline-none w-full text-[9px] font-bold focus:ring-0 text-[#1E293B] placeholder:text-[#94A3B8]"
                      aria-label="Search countries"
                      data-1p-ignore
                      data-lpignore="true"
                    />
                  </div>
                  {/* Options List */}
                  <div
                    ref={countryListRef}
                    className="overflow-y-auto flex-1 dropdown-scroll max-h-[160px]"
                    style={{ paddingTop: '0.375rem', paddingBottom: '0.375rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
                    role="group"
                    onKeyDown={handleCountryKeyDown}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {filteredCountries.length === 0 ? (
                      <div className="text-xs text-[#64748B] font-serif italic text-center" style={{ opacity: 1, lineHeight: 1.5, padding: '0.75rem' }}>
                        No countries found
                      </div>
                    ) : (
                      filteredCountries.map((country, index) => (
                        <div
                          key={country}
                          role="option"
                          aria-selected={formData.country === country}
                          tabIndex={-1}
                          onClick={() => {
                            handleCountrySelect(country);
                            if (errors.country) {
                              // Clear error when country is selected
                              const updatedErrors = { ...errors };
                              delete updatedErrors.country;
                            }
                          }}
                          onMouseEnter={() => setCountryFocusedIndex(index)}
                          className={`text-base md:text-lg lg:text-xl font-serif cursor-pointer transition-colors duration-150 rounded-sm ${
                            formData.country === country
                              ? 'bg-[#f5f2ed] text-[#1E293B] font-semibold'
                              : countryFocusedIndex === index
                                ? 'bg-[#F8F7F3] text-[#1E293B]'
                                : 'text-[#475569] hover:bg-[#F8F7F3]'
                          }`}
                          style={{
                            padding: '0.5rem 0.75rem',
                            lineHeight: 1.5,
                            opacity: 1,
                          }}
                        >
                          {country}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* City Dropdown */}
          <div className={`space-y-2.5 relative ${showCityMenu ? 'z-10' : 'z-0'}`} ref={cityRef}>
            <label
              htmlFor="city-dropdown"
              className={`text-[9px] uppercase tracking-[0.30em] font-black block transition-colors duration-200 ${
                errors.town 
                  ? 'text-[#B45309]' 
                  : formData.country 
                    ? 'text-[#475569]' 
                    : 'text-[#94A3B8]'
              }`}
              style={{ opacity: errors.town || formData.country ? 1 : 1 }}
            >
              City
              <span className="text-[#B45309] ml-1" aria-label="required">*</span>
            </label>
            <button
              ref={cityButtonRef}
              type="button"
              id="city-dropdown"
              onClick={() => formData.country && onShowCityMenu(!showCityMenu)}
              onKeyDown={handleCityKeyDown}
              disabled={!formData.country}
              className={`w-full bg-[#F8F7F3] border-b flex items-center justify-between transition-all duration-200 ease-out text-left rounded-t-sm ${
                formData.country 
                  ? 'cursor-pointer group focus:outline-none' 
                  : 'cursor-not-allowed opacity-50'
              } ${errors.town ? 'border-[#B45309]/40' : formData.country ? 'border-[#D4C9BC] hover:border-[#B8A895]' : 'border-[#D4C9BC]'}`}
              style={{
                borderBottom: `1px solid ${errors.town ? '#B45309' : showCityMenu ? '#B8A895' : '#D4C9BC'}`,
                boxShadow: showCityMenu ? '0 0 0 3px rgba(184, 168, 149, 0.06)' : 'none',
              }}
              role="combobox"
              aria-expanded={showCityMenu}
              aria-haspopup="listbox"
              aria-controls="city-listbox"
              aria-required="true"
              aria-disabled={!formData.country}
              aria-invalid={!!errors.town}
              aria-describedby={errors.town ? 'city-error' : undefined}
              aria-label="Select city"
            >
              <span className={`text-lg md:text-xl lg:text-2xl font-serif ${formData.town ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`} style={{ opacity: 1 }}>
                {formData.town || (formData.country ? (availableCities.length > 0 ? 'Select City' : 'Type city name') : 'Select country first')}
              </span>
              <ChevronDown 
                size={14} 
                className={`text-[#64748B] transition-transform duration-200 ease-out flex-shrink-0 ${showCityMenu ? 'rotate-180' : ''}`}
                style={{ marginLeft: '0.5rem' }}
                style={{ opacity: 1 }}
                aria-hidden="true"
              />
            </button>
            {errors.town && (
              <motion.p
                id="city-error"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={getReducedMotionTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
                className="text-[8px] text-[#B45309] font-black uppercase tracking-[0.15em]"
                style={{ marginTop: '0.375rem', lineHeight: 1.5 }}
                role="alert"
                aria-live="polite"
              >
                {errors.town}
              </motion.p>
            )}
            <AnimatePresence>
              {showCityMenu && formData.country && (
                <motion.div
                  role="listbox"
                  id="city-listbox"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={getReducedMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] })}
                  className="absolute top-full left-0 right-0 z-[100] bg-[#F9F8F4] border border-[#D4C9BC] max-h-[200px] overflow-hidden flex flex-col rounded-sm"
                  style={{
                    marginTop: '0.375rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search Header */}
                  <div 
                    className="border-b border-[#D4C9BC] flex items-center bg-[#F9F8F4] flex-shrink-0"
                    style={{ padding: '0.5rem', gap: '0.5rem' }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Search size={12} className="text-[#64748B] flex-shrink-0" aria-hidden="true" style={{ opacity: 1 }} />
                    <input
                      ref={citySearchInputRef}
                      type="text"
                      name="city-search-no-autofill"
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      value={citySearch}
                      onChange={(e) => {
                        onCitySearchChange(e.target.value);
                        setCityFocusedIndex(-1);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          onShowCityMenu(false);
                          cityButtonRef.current?.focus();
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          citySearchInputRef.current?.blur();
                          setCityFocusedIndex(0);
                          scrollToIndex(cityListRef, 0);
                        }
                      }}
                      placeholder="Search..."
                      className="bg-transparent border-none outline-none w-full text-[9px] font-bold focus:ring-0 text-[#1E293B] placeholder:text-[#94A3B8]"
                      aria-label="Search cities"
                      data-1p-ignore
                      data-lpignore="true"
                    />
                  </div>
                  {/* Options List */}
                  <div
                    ref={cityListRef}
                    className="overflow-y-auto flex-1 dropdown-scroll max-h-[160px]"
                    style={{ paddingTop: '0.375rem', paddingBottom: '0.375rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
                    role="group"
                    onKeyDown={handleCityKeyDown}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {filteredCities.length === 0 ? (
                      <div className="text-xs text-[#64748B] font-serif italic text-center" style={{ opacity: 1, lineHeight: 1.5, padding: '0.75rem' }}>
                        {availableCities.length > 0 ? 'No cities found' : 'No known cities for this country'}
                      </div>
                    ) : (
                      filteredCities.map((city, index) => (
                        <div
                          key={city}
                          role="option"
                          aria-selected={formData.town === city}
                          tabIndex={-1}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCitySelect(city);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCitySelect(city);
                          }}
                          onMouseEnter={() => setCityFocusedIndex(index)}
                          onMouseLeave={() => setCityFocusedIndex(-1)}
                          className="text-xs md:text-sm font-serif cursor-pointer border-b last:border-0 focus:outline-none transition-colors duration-150 select-none"
                          style={{ borderColor: 'rgba(212, 201, 188, 0.3)', padding: '0.5rem 0.75rem' }}
                          style={getDropdownItemStyle(cityFocusedIndex === index, formData.town === city)}
                        >
                          {city}
                        </div>
                      ))
                    )}
                  </div>
                  {/* Manual Input Footer */}
                  <div 
                    className="border-t border-[#D4C9BC] bg-[#F9F8F4] flex-shrink-0"
                    style={{ padding: '0.625rem' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                      <div className="text-[9px] uppercase tracking-[0.30em] font-black text-[#64748B]" style={{ opacity: 1, paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                        Or type manually
                      </div>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <div className="flex-1">
                          <input
                            ref={manualCityInputRef}
                            type="text"
                            name="manual-city-no-autofill"
                            value={manualCityInput}
                            onChange={(e) => setManualCityInput(e.target.value)}
                            onBlur={(e) => {
                              // Only save if focus is moving outside the dropdown
                              setTimeout(() => {
                                if (!cityRef.current?.contains(document.activeElement)) {
                                  saveManualCity();
                                }
                              }, 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveManualCity();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                onShowCityMenu(false);
                                cityButtonRef.current?.focus();
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Type city name..."
                            className="w-full bg-[#F8F7F3] border border-[#D4C9BC] rounded-sm text-xs md:text-sm font-serif text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E293B] transition-colors duration-200"
                            style={{ padding: '0.5rem 0.75rem' }}
                            style={{
                              boxShadow: '0 0 0 3px rgba(30, 41, 59, 0.08)',
                              lineHeight: 1.5,
                            }}
                            aria-label="Type city name manually"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-1p-ignore
                            data-lpignore="true"
                          />
                        </div>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saveManualCity();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saveManualCity();
                          }}
                          disabled={!manualCityInput.trim()}
                          className={`text-[9px] uppercase tracking-[0.20em] font-black rounded-sm transition-all duration-200 ${
                            manualCityInput.trim()
                              ? 'text-white bg-[#1E293B] hover:opacity-92 cursor-pointer'
                              : 'bg-[#E8E0D6] text-[#94A3B8] cursor-not-allowed opacity-60'
                          }`}
                          style={{ padding: '0.5rem 0.75rem', lineHeight: 1.5 }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Birth Date */}
        <div style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          <fieldset style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column', border: 'none', padding: 0, margin: 0 }}>
            <legend className={`text-[9px] uppercase tracking-[0.30em] font-black block mb-3 ${
              errors.dob ? 'text-[#B45309]' : 'text-[#475569]'
            }`}
            style={{ opacity: 1, lineHeight: 1.5, marginBottom: '0.75rem' }}
            >
              Birth Date
              <span className="text-[#B45309] ml-1" aria-label="required">*</span>
            </legend>
            {errors.dob && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={getReducedMotionTransition({ duration: 0.2 })}
                className="text-[8px] text-[#B45309] font-black uppercase tracking-[0.15em]"
                style={{ marginTop: '0.25rem', opacity: 1, lineHeight: 1.5 }}
                role="alert"
                aria-live="polite"
              >
                {errors.dob}
              </motion.p>
            )}
            <div className="grid grid-cols-3 relative" style={{ gap: '1.5rem' }}>
              <div className={showDayMenu ? 'relative z-10' : 'relative z-0'}>
                <DateSelect
                  value={dobDay}
                  onChange={onDobDayChange}
                  options={DAYS}
                  placeholder="Day"
                  isOpen={showDayMenu}
                  onToggle={() => {
                    onShowDayMenu(!showDayMenu);
                    onShowMonthMenu(false);
                    onShowYearMenu(false);
                  }}
                  onClose={() => onShowDayMenu(false)}
                  error={errors.dob && !dobDay ? errors.dob : undefined}
                  aria-label="Birth day"
                  id="dob-day-select"
                />
              </div>
              <div className={showMonthMenu ? 'relative z-10' : 'relative z-0'}>
                <DateSelect
                  value={dobMonth}
                  onChange={onDobMonthChange}
                  options={MONTHS}
                  placeholder="Month"
                  isOpen={showMonthMenu}
                  onToggle={() => {
                    onShowMonthMenu(!showMonthMenu);
                    onShowDayMenu(false);
                    onShowYearMenu(false);
                  }}
                  onClose={() => onShowMonthMenu(false)}
                  error={errors.dob && !dobMonth ? errors.dob : undefined}
                  aria-label="Birth month"
                  id="dob-month-select"
                />
              </div>
              <div className={showYearMenu ? 'relative z-10' : 'relative z-0'}>
                <DateSelect
                  value={dobYear}
                  onChange={onDobYearChange}
                  options={years}
                  placeholder="Year"
                  isOpen={showYearMenu}
                  onToggle={() => {
                    onShowYearMenu(!showYearMenu);
                    onShowDayMenu(false);
                    onShowMonthMenu(false);
                  }}
                  onClose={() => onShowYearMenu(false)}
                  error={errors.dob && !dobYear ? errors.dob : undefined}
                  aria-label="Birth year"
                  id="dob-year-select"
                />
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </StepShell>
  );
};
