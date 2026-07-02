/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Marca
        sidebar: '#0B1120',
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#DBEAFE',
          50: '#EFF6FF',
        },
        surface: '#F7F8FA',
        // Estados (semánticos)
        estado: {
          pendiente: '#F59E0B',
          proceso: '#2563EB',
          finalizado: '#16A34A',
          demorado: '#EF4444',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        soft: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.04)',
        card: '0 1px 3px rgba(15,23,42,0.05), 0 1px 2px -1px rgba(15,23,42,0.03)',
        elevated: '0 10px 30px -10px rgba(15,23,42,0.15), 0 4px 12px -4px rgba(15,23,42,0.08)',
        glow: '0 0 0 1px rgba(37,99,235,0.1), 0 8px 24px -8px rgba(37,99,235,0.25)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        pulse_ring: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(37, 99, 235, 0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        pulse_ring: 'pulse_ring 2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
