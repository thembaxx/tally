'use client';
import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(ScrollTrigger, useGSAP);
export function MotionPage({
  children,
  ready,
  revealKey,
}: {
  children: ReactNode;
  ready: boolean;
  revealKey?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const previousKey = useRef(revealKey);
  const still = useReducedMotion();
  useGSAP(
    () => {
      if (!ready) return;
      const filtered = previousKey.current !== revealKey;
      previousKey.current = revealKey;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const nodes = gsap.utils.toArray<HTMLElement>(
          filtered
            ? '.path-section'
            : '.page-heading, .welcome-grid > section, .learning-section, .home-bottom > section, .practice-hero, .practice-studio, .path-summary, .path-section, .profile-card, .stats-grid, .badges-section, .me-settings, .billi-note',
          root.current,
        );
        nodes.forEach((node, i) => {
          gsap.fromTo(
            node,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.68,
              delay: node.getBoundingClientRect().top < innerHeight ? Math.min(i * 0.075, 0.3) : 0,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: node, start: 'top 96%', once: true },
            },
          );
        });
        const visual = root.current?.querySelector('.hero-visual');
        if (visual) {
          gsap.fromTo(
            visual,
            { yPercent: -2, scale: 0.97 },
            {
              yPercent: 5,
              scale: 1.025,
              ease: 'none',
              scrollTrigger: {
                trigger: '.hero-card',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
              },
            },
          );
        }
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [ready, revealKey], revertOnUpdate: true },
  );
  return (
    <motion.div
      ref={root}
      className="motion-page"
      initial={still ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: still ? 0 : 0.18 }}
    >
      {children}
    </motion.div>
  );
}
