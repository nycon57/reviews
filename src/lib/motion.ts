import { type Variants, type Transition } from "framer-motion";

// Animation configuration
export const animationConfig = {
  duration: 0.3,
  durationSlow: 0.5,
  durationFast: 0.15,
  easing: "easeOut" as const,
  easingSpring: [0.43, 0.13, 0.23, 0.96] as const,
  staggerDelay: 0.1,
  staggerDelayFast: 0.05,
};

// Reusable transition presets
export const transitions = {
  default: {
    duration: animationConfig.duration,
    ease: animationConfig.easing,
  } as Transition,
  fast: {
    duration: animationConfig.durationFast,
    ease: animationConfig.easing,
  } as Transition,
  slow: {
    duration: animationConfig.durationSlow,
    ease: animationConfig.easing,
  } as Transition,
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  } as Transition,
  bounce: {
    type: "spring",
    stiffness: 400,
    damping: 10,
  } as Transition,
};

// Fade in animation (opacity 0 → 1)
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.default,
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
    transition: transitions.default,
  },
};

// Fade in down animation
export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
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
    transition: transitions.default,
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
    transition: transitions.default,
  },
};

// Scale in animation
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
};

// Scale out animation (for exits)
export const scaleOut: Variants = {
  hidden: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

// Zoom in animation (larger scale)
export const zoomIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
};

// Rotate in animation
export const rotateIn: Variants = {
  hidden: {
    opacity: 0,
    rotate: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: transitions.spring,
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

// Faster stagger container
export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: animationConfig.staggerDelayFast,
    },
  },
};

// Stagger container with delay before starting
export const staggerContainerDelayed: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: animationConfig.staggerDelay,
    },
  },
};

// Page transition variants
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Slide page transition (horizontal)
export const slidePageTransition: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: transitions.fast,
  },
};

// Scale on hover animation
export const scaleOnHover = {
  scale: 1.02,
  transition: transitions.fast,
};

// Lift on hover (with shadow effect)
export const liftOnHover = {
  y: -4,
  transition: transitions.fast,
};

// Tap animation
export const tapAnimation = {
  scale: 0.98,
};

// Button hover animation
export const buttonHover = {
  scale: 1.02,
  transition: transitions.fast,
};

// Button tap animation
export const buttonTap = {
  scale: 0.95,
};

// Icon hover animation
export const iconHover = {
  scale: 1.1,
  rotate: 5,
  transition: transitions.fast,
};

// Pulse animation (for attention)
export const pulseAnimation: Variants = {
  initial: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

// Shake animation (for errors)
export const shakeAnimation: Variants = {
  initial: {
    x: 0,
  },
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

// Bounce animation
export const bounceAnimation: Variants = {
  initial: {
    y: 0,
  },
  bounce: {
    y: [0, -10, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatDelay: 1.5,
    },
  },
};

// Spinner animation
export const spinAnimation: Variants = {
  initial: {
    rotate: 0,
  },
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Loading dots animation
export const loadingDotsContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const loadingDot: Variants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Skeleton shimmer animation
export const shimmerAnimation: Variants = {
  initial: {
    backgroundPosition: "-200% 0",
  },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Viewport settings for scroll-triggered animations
// amount: "some" triggers when any part is visible, works reliably with client navigation
export const viewportOnce = { once: true, amount: "some" } as const;
export const viewportAlways = { once: false, margin: "-50px" };

// Helper function to create custom fade variants
export function createFadeVariant(
  direction: "up" | "down" | "left" | "right" = "up",
  distance: number = 20
): Variants {
  if (direction === "up") {
    return {
      hidden: { opacity: 0, y: distance },
      visible: { opacity: 1, y: 0, transition: transitions.default },
    };
  }
  if (direction === "down") {
    return {
      hidden: { opacity: 0, y: -distance },
      visible: { opacity: 1, y: 0, transition: transitions.default },
    };
  }
  if (direction === "left") {
    return {
      hidden: { opacity: 0, x: distance },
      visible: { opacity: 1, x: 0, transition: transitions.default },
    };
  }
  return {
    hidden: { opacity: 0, x: -distance },
    visible: { opacity: 1, x: 0, transition: transitions.default },
  };
}

// Helper function to create stagger container with custom delay
export function createStaggerContainer(delay: number = 0.1): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  };
}

// ===========================================
// Brand Animation Presets
// ===========================================

// Card hover with lift effect (for feature cards, pricing cards)
export const cardHover = {
  y: -4,
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.04)',
  transition: { duration: 0.2, ease: [0.43, 0.13, 0.23, 0.96] as const },
};

// Card tap animation
export const cardTap = {
  y: 0,
  scale: 0.99,
  transition: { duration: 0.1, ease: [0.43, 0.13, 0.23, 0.96] as const },
};

// Organic blob floating animation (for decorative elements)
export const blobFloat: Variants = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: [0, 10, -5, 0],
    y: [0, -10, 5, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Blob float with rotation
export const blobFloatRotate: Variants = {
  initial: {
    x: 0,
    y: 0,
    rotate: 0,
  },
  animate: {
    x: [0, 15, -10, 0],
    y: [0, -15, 10, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 12,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Stagger children with initial delay (for hero sections)
export const staggerChildrenDelayed: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Brand button hover (with glow effect)
export const brandButtonHover = {
  y: -2,
  boxShadow: '0 4px 12px -2px rgba(0, 107, 255, 0.25)',
  transition: { duration: 0.15, ease: [0.43, 0.13, 0.23, 0.96] as const },
};

// Feature card icon hover
export const featureIconHover = {
  scale: 1.1,
  transition: { duration: 0.2, ease: [0.43, 0.13, 0.23, 0.96] as const },
};

// Smooth number counter animation config
export const counterTransition = {
  duration: 1.5,
  ease: [0.43, 0.13, 0.23, 0.96] as const,
};

// Navigation link underline animation
export const navLinkUnderline: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  hover: {
    scaleX: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// Accordion content animation
export const accordionContent: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: 'easeOut' },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
};

// Badge/pill enter animation
export const badgeEnter: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

// Toast notification animation
export const toastAnimation: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};
