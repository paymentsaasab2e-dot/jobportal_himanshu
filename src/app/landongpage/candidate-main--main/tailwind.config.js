/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'orange-primary': '#FF6B35',
        'orange-secondary': '#FF8A3D',
        'blue-primary': '#2563EB',
        'blue-secondary': '#38BDF8',
        'bg-base': '#FAFBFC',
        'surface': '#FFFFFF',
        'text-primary': '#0F172A',
        'text-muted': '#64748B',
        'border-subtle': 'rgba(15,23,42,0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-cal)', 'Cal Sans', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-orange-blue': 'linear-gradient(135deg, #FF6B35, #2563EB)',
        'gradient-blue-orange': 'linear-gradient(135deg, #2563EB, #FF6B35)',
        'gradient-orange': 'linear-gradient(135deg, #FF6B35, #FF8A3D)',
        'gradient-blue': 'linear-gradient(135deg, #2563EB, #38BDF8)',
        'mesh-gradient': 'radial-gradient(ellipse at 20% 50%, rgba(255,107,53,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.07) 0%, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'orbit': 'orbit 20s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'slide-up': 'slideUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(140px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(140px) rotate(-360deg)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,107,53,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255,107,53,0.6)' },
        },
      },
      boxShadow: {
        'premium': '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.04)',
        'card': '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)',
        'orange-glow': '0 4px 24px rgba(255,107,53,0.25)',
        'blue-glow': '0 4px 24px rgba(37,99,235,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.8)',
        'glass': '0 8px 32px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
