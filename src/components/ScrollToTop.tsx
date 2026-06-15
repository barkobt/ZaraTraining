import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { scrollToTop } from '../hooks/useLenis';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Lenis aktifse onun üzerinden anlık başa dön; değilse native scroll.
    scrollToTop();
  }, [pathname]);

  return null;
}
