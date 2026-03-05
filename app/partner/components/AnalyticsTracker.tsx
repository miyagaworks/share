'use client';

import { useEffect, useRef } from 'react';
import { PartnerEvents } from '../utils/analytics';

const SECTION_IDS = [
  'hero',
  'problem',
  'affinity',
  'industry',
  'solution',
  'business-model',
  'differentiator',
  'easy-start',
  'social-proof',
  'offer',
  'scarcity',
  'cta',
  'postscript',
];

export default function AnalyticsTracker() {
  const firedDepths = useRef(new Set<number>());
  const firedSections = useRef(new Set<string>());

  useEffect(() => {
    // partner_lp_view
    PartnerEvents.lpView();

    // スクロール深度計測（25/50/75/100%）
    function handleScroll() {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const pct = Math.round((window.scrollY / scrollHeight) * 100);

      for (const threshold of [25, 50, 75, 100]) {
        if (pct >= threshold && !firedDepths.current.has(threshold)) {
          firedDepths.current.add(threshold);
          PartnerEvents.scrollDepth(threshold);
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // セクションビュー計測
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !firedSections.current.has(entry.target.id)
          ) {
            firedSections.current.add(entry.target.id);
            PartnerEvents.sectionView(entry.target.id);
          }
        });
      },
      { threshold: 0.3 },
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return null;
}
