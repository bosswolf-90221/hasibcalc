// Scroll-triggered reveal (optionally staggered), built on framer-motion.
// Usage in Astro:  <Reveal client:idle selector="li"> ...static HTML... </Reveal>
//
// Rules this component keeps:
// - The server renders the content in its final, visible state (SEO, no-JS, thumbnails).
// - Only content that starts BELOW the fold is hidden, and only after hydration, so nothing flashes.
// - prefers-reduced-motion: no animation at all.
import { useEffect, useRef, type ReactNode } from 'react';
import { animate, inView, stagger, useReducedMotion } from 'framer-motion';

type Props = {
  children?: ReactNode;
  /** CSS selector of the items to stagger inside this block; omit to reveal the block as one piece. */
  selector?: string;
  className?: string;
};

export default function Reveal({ children, selector, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it alone
    const items = selector ? Array.from(el.querySelectorAll<HTMLElement>(selector)) : [el];
    if (!items.length) return;
    items.forEach((i) => {
      i.style.opacity = '0';
      i.style.transform = 'translateY(12px)';
    });
    return inView(
      el,
      () => {
        animate(items, { opacity: 1, transform: 'translateY(0px)' }, { duration: 0.35, ease: [0.2, 0.7, 0.2, 1], delay: selector ? stagger(0.06) : 0 });
      },
      { amount: 0.15 },
    );
  }, [reduce, selector]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
