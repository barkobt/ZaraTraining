import { useEffect } from "react";
import { useLocation } from "react-router";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Tek Lenis örneği modül seviyesinde tutulur — ScrollToTop gibi başka
// bileşenler de route değişiminde aynı örneği kullanıp anlık başa dönebilsin.
let lenisRef: Lenis | null = null;

/**
 * Sayfaya global smooth-scroll kurar (brandonbartram.dev hissi).
 * - lenis.on("scroll", ScrollTrigger.update): pinned/scrub trigger'lar
 *   her smooth karede güncel kalır, yoksa hesaplamalar geride kalır.
 * - gsap.ticker'a bağlanır: tek RAF döngüsü → jank yok, lagSmoothing(0)
 *   ile sekme arkaplandıktan sonra ani sıçrama olmaz.
 * - prefers-reduced-motion'da HİÇ başlatılmaz → tamamen native scroll.
 * - YALNIZ landing'de ("/") aktif: GSAP pinned yatay bölüm Lenis gerektirir.
 *   Veri-yoğun uygulama ekranlarında (Pusula/Shift) global smooth-scroll'un
 *   lerp ataleti girdiyi 1:1 izlemediğinden "kasma" gibi algılanıyordu; oralarda
 *   native scroll daha doğrudan/akıcı. Route değişince Lenis kurulur/yıkılır.
 */
export function useLenis() {
  const { pathname } = useLocation();
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || pathname !== "/") return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // İlk düzen oturduktan sonra trigger ölçülerini tazele (pin/end fonksiyonları).
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef = null;
    };
  }, [pathname]);
}

/** Route değişiminde başa dön — Lenis aktifse onun üzerinden (anlık), değilse native. */
export function scrollToTop() {
  if (lenisRef) lenisRef.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}
