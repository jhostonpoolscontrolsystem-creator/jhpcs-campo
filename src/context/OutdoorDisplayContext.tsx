'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { triggerHaptic } from '@/lib/ui/haptics';

interface OutdoorDisplayContextType {
  isOutdoorMode: boolean;
  toggleOutdoorMode: () => void;
  setOutdoorMode: (enabled: boolean) => void;
}

const OutdoorDisplayContext = createContext<OutdoorDisplayContextType>({
  isOutdoorMode: false,
  toggleOutdoorMode: () => {},
  setOutdoorMode: () => {},
});

const STORAGE_KEY = 'jhpcs_outdoor_high_contrast';

export function OutdoorDisplayProvider({ children }: { children: React.ReactNode }) {
  const [isOutdoorMode, setIsOutdoorModeState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') {
        setIsOutdoorModeState(true);
        document.documentElement.classList.add('outdoor-high-contrast');
      }
    } catch {
      // Ignora falhas de localStorage em sandboxes
    }
  }, []);

  const setOutdoorMode = (enabled: boolean) => {
    setIsOutdoorModeState(enabled);
    triggerHaptic(enabled ? 'heavy' : 'medium');
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // noop
    }

    if (enabled) {
      document.documentElement.classList.add('outdoor-high-contrast');
    } else {
      document.documentElement.classList.remove('outdoor-high-contrast');
    }
  };

  const toggleOutdoorMode = () => {
    setOutdoorMode(!isOutdoorMode);
  };

  return (
    <OutdoorDisplayContext.Provider value={{ isOutdoorMode, toggleOutdoorMode, setOutdoorMode }}>
      {children}
    </OutdoorDisplayContext.Provider>
  );
}

export function useOutdoorDisplay() {
  return useContext(OutdoorDisplayContext);
}

