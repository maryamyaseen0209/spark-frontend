/**
 * Centralized animation system using Framer Motion.
 * Defines standard animation presets for common use cases.
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

export const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export const slideDown = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.88 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const staggerContainer = {
  hidden: {},
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

export const buttonTap = { scale: 0.94 };

export const cardHover = {
  rest: { scale: 1, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
  hover: { scale: 1.02, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)' },
};

export const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: { backgroundPosition: '200% 0' },
};

export const pageTransition = {
  initial: { opacity: 0, y: 12, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' },
  transition: { duration: 0.38, ease: 'easeInOut' },
};

export const floatingOrb = {
  animate: {
    y: [0, -18, 0],
    x: [0, 10, 0],
    scale: [1, 1.04, 1],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const sidebarAnimation = {
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

export const reducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;