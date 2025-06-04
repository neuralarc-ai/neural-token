
import { useState, useEffect, useCallback } from 'react';

// This hook is no longer the primary data source for the main app data.
// It's kept here as it's used for PIN authentication state.
// If PIN auth were to move to Supabase Auth, this hook might be entirely removable
// or repurposed for other client-side non-critical preferences.

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        // Ensure initialValue structure is respected if keys are missing in parsedItem
        return { ...initialValue, ...parsedItem };
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        try {
          if (event.newValue) {
            const parsedNewValue = JSON.parse(event.newValue);
            setStoredValue({ ...initialValue, ...parsedNewValue });
          } else {
            // If item is removed from localStorage, reset to initialValue
            setStoredValue(initialValue); 
          }
        } catch (error) {
          console.error(`Error handling storage change for key "${key}":`, error);
          setStoredValue(initialValue);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
