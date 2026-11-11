'use client';

import { useState, useEffect } from 'react';

export interface DeviceContext {
  isStandalone: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isTouchDevice: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export function useDeviceContext(): DeviceContext {
  const [deviceContext, setDeviceContext] = useState<DeviceContext>({
    isStandalone: false,
    isMobile: false,
    isTablet: false,
    isTouchDevice: false,
    platform: 'unknown',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkContext = () => {
      // 1. Detecção de PWA Instalado (Standalone)
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      const isStandalone = isStandaloneMedia || isIosStandalone;

      // 2. Detecção de Viewport
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;

      // 3. Detecção de Touch
      const isTouchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;

      // 4. Detecção de Plataforma
      const ua = navigator.userAgent.toLowerCase();
      let platform: DeviceContext['platform'] = 'unknown';
      if (/iphone|ipad|ipod/.test(ua)) {
        platform = 'ios';
      } else if (/android/.test(ua)) {
        platform = 'android';
      } else if (width >= 1024) {
        platform = 'desktop';
      }

      setDeviceContext({
        isStandalone,
        isMobile,
        isTablet,
        isTouchDevice,
        platform,
      });
    };

    checkContext();

    window.addEventListener('resize', checkContext);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    try {
      mediaQuery.addEventListener('change', checkContext);
    } catch {
      // Fallback para navegadores legados
    }

    return () => {
      window.removeEventListener('resize', checkContext);
      try {
        mediaQuery.removeEventListener('change', checkContext);
      } catch {
        // noop
      }
    };
  }, []);

  return deviceContext;
}

