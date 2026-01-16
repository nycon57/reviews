import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			// Semantic colors (reference CSS variables with oklch values)
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			success: {
  				DEFAULT: 'var(--success)',
  				foreground: 'var(--success-foreground)'
  			},
  			warning: {
  				DEFAULT: 'var(--warning)',
  				foreground: 'var(--warning-foreground)'
  			},
  			info: {
  				DEFAULT: 'var(--info)',
  				foreground: 'var(--info-foreground)'
  			},
  			chart: {
  				'1': 'var(--chart-1)',
  				'2': 'var(--chart-2)',
  				'3': 'var(--chart-3)',
  				'4': 'var(--chart-4)',
  				'5': 'var(--chart-5)'
  			},
  			sidebar: {
  				DEFAULT: 'var(--sidebar-background)',
  				foreground: 'var(--sidebar-foreground)',
  				primary: 'var(--sidebar-primary)',
  				'primary-foreground': 'var(--sidebar-primary-foreground)',
  				accent: 'var(--sidebar-accent)',
  				'accent-foreground': 'var(--sidebar-accent-foreground)',
  				border: 'var(--sidebar-border)',
  				ring: 'var(--sidebar-ring)'
  			},
  			// Color palette scales for direct access
  			'ash-grey': {
  				'50': 'var(--color-ash-grey-50)',
  				'100': 'var(--color-ash-grey-100)',
  				'200': 'var(--color-ash-grey-200)',
  				'300': 'var(--color-ash-grey-300)',
  				'400': 'var(--color-ash-grey-400)',
  				'500': 'var(--color-ash-grey-500)',
  				'600': 'var(--color-ash-grey-600)',
  				'700': 'var(--color-ash-grey-700)',
  				'800': 'var(--color-ash-grey-800)',
  				'900': 'var(--color-ash-grey-900)',
  				'950': 'var(--color-ash-grey-950)'
  			},
  			'muted-teal': {
  				'50': 'var(--color-muted-teal-50)',
  				'100': 'var(--color-muted-teal-100)',
  				'200': 'var(--color-muted-teal-200)',
  				'300': 'var(--color-muted-teal-300)',
  				'400': 'var(--color-muted-teal-400)',
  				'500': 'var(--color-muted-teal-500)',
  				'600': 'var(--color-muted-teal-600)',
  				'700': 'var(--color-muted-teal-700)',
  				'800': 'var(--color-muted-teal-800)',
  				'900': 'var(--color-muted-teal-900)',
  				'950': 'var(--color-muted-teal-950)'
  			},
  			'deep-teal': {
  				'50': 'var(--color-deep-teal-50)',
  				'100': 'var(--color-deep-teal-100)',
  				'200': 'var(--color-deep-teal-200)',
  				'300': 'var(--color-deep-teal-300)',
  				'400': 'var(--color-deep-teal-400)',
  				'500': 'var(--color-deep-teal-500)',
  				'600': 'var(--color-deep-teal-600)',
  				'700': 'var(--color-deep-teal-700)',
  				'800': 'var(--color-deep-teal-800)',
  				'900': 'var(--color-deep-teal-900)',
  				'950': 'var(--color-deep-teal-950)'
  			},
  			'slate-grey': {
  				'50': 'var(--color-dark-slate-grey-50)',
  				'100': 'var(--color-dark-slate-grey-100)',
  				'200': 'var(--color-dark-slate-grey-200)',
  				'300': 'var(--color-dark-slate-grey-300)',
  				'400': 'var(--color-dark-slate-grey-400)',
  				'500': 'var(--color-dark-slate-grey-500)',
  				'600': 'var(--color-dark-slate-grey-600)',
  				'700': 'var(--color-dark-slate-grey-700)',
  				'800': 'var(--color-dark-slate-grey-800)',
  				'900': 'var(--color-dark-slate-grey-900)',
  				'950': 'var(--color-dark-slate-grey-950)'
  			},
  			'charcoal': {
  				'50': 'var(--color-charcoal-blue-50)',
  				'100': 'var(--color-charcoal-blue-100)',
  				'200': 'var(--color-charcoal-blue-200)',
  				'300': 'var(--color-charcoal-blue-300)',
  				'400': 'var(--color-charcoal-blue-400)',
  				'500': 'var(--color-charcoal-blue-500)',
  				'600': 'var(--color-charcoal-blue-600)',
  				'700': 'var(--color-charcoal-blue-700)',
  				'800': 'var(--color-charcoal-blue-800)',
  				'900': 'var(--color-charcoal-blue-900)',
  				'950': 'var(--color-charcoal-blue-950)'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontSize: {
  			// Display sizes (for hero sections, major headings)
  			'display-xl': [
  				'4.25rem', // 68px
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.02em',
  					fontWeight: '700'
  				}
  			],
  			'display-lg': [
  				'3.5rem', // 56px
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.02em',
  					fontWeight: '700'
  				}
  			],
  			'display-md': [
  				'3rem', // 48px
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.02em',
  					fontWeight: '700'
  				}
  			],
  			'display-sm': [
  				'2.5rem', // 40px
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.01em',
  					fontWeight: '700'
  				}
  			],
  			// Heading sizes
  			'heading-xl': [
  				'2.5rem', // 40px
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.01em',
  					fontWeight: '700'
  				}
  			],
  			'heading-lg': [
  				'1.75rem', // 28px
  				{
  					lineHeight: '1.3',
  					letterSpacing: '-0.01em',
  					fontWeight: '600'
  				}
  			],
  			'heading-md': [
  				'1.5rem', // 24px
  				{
  					lineHeight: '1.4',
  					fontWeight: '600'
  				}
  			],
  			'heading-sm': [
  				'1.25rem', // 20px
  				{
  					lineHeight: '1.4',
  					fontWeight: '600'
  				}
  			],
  			// Body sizes
  			'body-lg': [
  				'1.125rem', // 18px
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'body-md': [
  				'1rem', // 16px
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'body-sm': [
  				'0.875rem', // 14px
  				{
  					lineHeight: '1.5'
  				}
  			],
  			'caption': [
  				'0.75rem', // 12px
  				{
  					lineHeight: '1.5'
  				}
  			]
  		},
  		spacing: {
  			'4.5': '1.125rem',
  			'18': '4.5rem',
  			'22': '5.5rem',
  			'30': '7.5rem'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			},
  			'fade-out': {
  				from: {
  					opacity: '1'
  				},
  				to: {
  					opacity: '0'
  				}
  			},
  			'slide-in-from-top': {
  				from: {
  					transform: 'translateY(-100%)'
  				},
  				to: {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-from-bottom': {
  				from: {
  					transform: 'translateY(100%)'
  				},
  				to: {
  					transform: 'translateY(0)'
  				}
  			},
  			// Brand animations
  			'fade-in-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'scale-in': {
  				from: {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			'blob-float': {
  				'0%, 100%': {
  					transform: 'translate(0, 0)'
  				},
  				'25%': {
  					transform: 'translate(10px, -10px)'
  				},
  				'50%': {
  					transform: 'translate(-5px, 5px)'
  				},
  				'75%': {
  					transform: 'translate(5px, -5px)'
  				}
  			},
  			'shimmer': {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.2s ease-out',
  			'fade-out': 'fade-out 0.2s ease-out',
  			'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
  			'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
  			// Brand animations
  			'fade-in-up': 'fade-in-up 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			'blob-float': 'blob-float 8s ease-in-out infinite',
  			'shimmer': 'shimmer 2s linear infinite'
  		},
  		boxShadow: {
  			'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  			'elevation-2': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  			'elevation-3': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  			'elevation-4': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  			// Brand shadows (updated for new teal-grey palette)
  			'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  			'card-hover': '0 8px 16px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)',
  			'button-hover': '0 4px 12px -2px oklch(44.27% 0.035 206.76 / 0.25)',
  			'glow': '0 0 20px -5px oklch(44.27% 0.035 206.76 / 0.4)'
  		},
  		transitionDuration: {
  			'150': '150ms',
  			'200': '200ms'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
