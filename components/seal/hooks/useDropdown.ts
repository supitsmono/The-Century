import { useState, useEffect, useMemo } from 'react';
import { COUNTRIES, CITIES_BY_COUNTRY } from '../data/constants';

export interface UseDropdownReturn {
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
  setCountrySearch: (value: string) => void;
  setCitySearch: (value: string) => void;
  setShowCountryMenu: (show: boolean) => void;
  setShowCityMenu: (show: boolean) => void;
  setShowDayMenu: (show: boolean) => void;
  setShowMonthMenu: (show: boolean) => void;
  setShowYearMenu: (show: boolean) => void;
  closeAllDropdowns: () => void;
}

export const useDropdown = (selectedCountry: string): UseDropdownReturn => {
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);

  // Get cities for selected country from static list
  const availableCities = useMemo(() => {
    if (!selectedCountry) return [];
    return CITIES_BY_COUNTRY[selectedCountry] || [];
  }, [selectedCountry]);

  const filteredCountries = useMemo(() => 
    COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch]
  );

  const filteredCities = useMemo(() => 
    availableCities.filter(city => city.toLowerCase().includes(citySearch.toLowerCase())),
    [availableCities, citySearch]
  );

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.date-select-container')) {
        setShowDayMenu(false);
        setShowMonthMenu(false);
        setShowYearMenu(false);
        setShowCountryMenu(false);
        setShowCityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeAllDropdowns = () => {
    setShowDayMenu(false);
    setShowMonthMenu(false);
    setShowYearMenu(false);
    setShowCountryMenu(false);
    setShowCityMenu(false);
  };

  return {
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
    setCountrySearch,
    setCitySearch,
    setShowCountryMenu,
    setShowCityMenu,
    setShowDayMenu,
    setShowMonthMenu,
    setShowYearMenu,
    closeAllDropdowns,
  };
};

