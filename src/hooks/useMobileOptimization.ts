import { useState, useEffect } from 'react';

export function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(false);
  const [touchMode, setTouchMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setTouchMode('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, touchMode };
}
