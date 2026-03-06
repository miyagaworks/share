'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PartnerEvents } from '../utils/analytics';

export default function FloatingCta() {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // ヒーローが見えなくなったら表示
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(heroSection);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8E6E1] bg-white/90 backdrop-blur-md"
          style={{ boxShadow: '0 -2px 10px rgba(27,42,74,0.08)' }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-2 py-3 sm:px-4">
            <p className="hidden text-sm text-[#5A6577] sm:block lg:text-base">
              ※ 営業電話は一切いたしません
            </p>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <motion.a
                href="#cta"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('partner-preference', { detail: '資料をダウンロードしたい' }));
                  document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
                  PartnerEvents.ctaClick('floating', 'download');
                }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-[#B8860B] px-6 py-2.5 text-sm font-bold text-white shadow-md lg:text-base transition-colors hover:bg-[#A0750A] sm:flex-none"
              >
                無料で資料をダウンロード
              </motion.a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
