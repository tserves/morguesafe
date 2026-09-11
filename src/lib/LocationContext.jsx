import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Global hospital location selector context.
 * Persists the selected location in localStorage so it survives page reloads.
 * Used by Dashboard, IntakeList, StorageManagement, and other pages to filter data.
 */
const LocationContext = createContext(null);

const STORAGE_KEY = 'morguesafe_selected_hospital';

export function LocationProvider({ children }) {
  const [selectedLocation, setSelectedLocationState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  const setSelectedLocation = useCallback((loc) => {
    setSelectedLocationState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, loc);
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    return { selectedLocation: 'all', setSelectedLocation: () => {} };
  }
  return ctx;
}