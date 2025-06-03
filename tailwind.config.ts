import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Archivo', 'Roboto', 'sans-serif'],
        headline: ['Archivo', 'Roboto', 'sans-serif'],
        code: ['monospace'],
      },
      backgroundColor: {
        'page-background': 'hsl(var(--page-background))', // Light gray page background
      },
      colors: {
        background: 'hsl(var(--background))', // White for main app container & cards
        foreground: 'hsl(var(--foreground))', // Dark gray for text
        card: {
          DEFAULT: 'hsl(var(--card))', // White
          foreground: 'hsl(var(--card-foreground))', // Dark gray
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))', // White
          foreground: 'hsl(var(--popover-foreground))', // Dark gray
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))', // Donezo Green
          foreground: 'hsl(var(--primary-foreground))', // White
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))', // Lighter gray for secondary elements/backgrounds
          foreground: 'hsl(var(--secondary-foreground))', // Darker gray
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))', // Slightly lighter green
          foreground: 'hsl(var(--accent-foreground))', // White
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))', // Softer borders
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))', // Green for focus rings
        chart: {
          '1': 'hsl(var(--chart-1))', // Primary Green
          '2': 'hsl(var(--chart-2))', // Lighter Green
          '3': 'hsl(var(--chart-3))', // Tealish Green
          '4': 'hsl(var(--chart-4))', // Soft Blue
          '5': 'hsl(var(--chart-5))', // Soft Orange/Yellow
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))', // White
          foreground: 'hsl(var(--sidebar-foreground))', // Dark Gray
          primary: 'hsl(var(--sidebar-primary))', // Donezo Green
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))', // White
          accent: 'hsl(var(--sidebar-accent))', // Very light green for hover/active
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))', // Darker green for text on light green
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)', // 0.75rem (Donezo-like)
        md: 'calc(var(--radius) - 0.25rem)', // 0.5rem
        sm: 'calc(var(--radius) - 0.375rem)', // 0.375rem
        xl: 'calc(var(--radius) + 0.25rem)', // 1rem
        '2xl': 'calc(var(--radius) + 0.5rem)', // 1.25rem (for main container)
      },
      boxShadow: {
        DEFAULT: '0 4px 12px 0 rgba(0, 0, 0, 0.07)',
        md: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
        lg: '0 10px 20px -5px rgba(0, 0, 0, 0.08)',
        xl: '0 12px 24px -8px rgba(0, 0, 0, 0.09)', // Main container shadow
        'card': '0 4px 12px 0 rgba(0, 0, 0, 0.05)', // Softer card shadow
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
