import { Variants, Transition } from 'framer-motion';

// Check for reduced motion preference - safe for SSR
const getPrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: (() => {
      const prefersReduced = getPrefersReducedMotion();
      return prefersReduced 
        ? { duration: 0 }
        : { staggerChildren: 0.1, delayChildren: 0.1, duration: 0.8 };
    })()
  },
  exit: { opacity: 0, transition: { duration: getPrefersReducedMotion() ? 0 : 0.4 } }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, ...(getPrefersReducedMotion() ? {} : { y: 15 }) },
  visible: { 
    opacity: 1, 
    ...(getPrefersReducedMotion() ? {} : { y: 0 }),
    transition: { duration: getPrefersReducedMotion() ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

// Reduced motion transition helper
export const getReducedMotionTransition = (normalTransition: Transition): Transition => {
  const prefersReduced = getPrefersReducedMotion();
  if (prefersReduced) {
    return { duration: 0 };
  }
  return normalTransition;
};
