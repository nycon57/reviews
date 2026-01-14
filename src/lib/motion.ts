import { type Variants } from "framer-motion";

// Animation configuration
export const animationConfig = {
  duration: 0.3,
  easing: "easeOut" as const,
  staggerDelay: 0.1,
};

// Fade in animation (opacity 0 → 1)
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: animationConfig.duration,
      ease: animationConfig.easing,
    },
  },
};

// Fade in up animation (opacity + y: 20 → 0)
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.duration,
      ease: animationConfig.easing,
    },
  },
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: animationConfig.duration,
      ease: animationConfig.easing,
    },
  },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: animationConfig.duration,
      ease: animationConfig.easing,
    },
  },
};

// Stagger container for children animations
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: animationConfig.staggerDelay,
    },
  },
};

// Scale on hover animation
export const scaleOnHover = {
  scale: 1.02,
  transition: {
    duration: animationConfig.duration,
    ease: animationConfig.easing,
  },
};

// Tap animation
export const tapAnimation = {
  scale: 0.98,
};
