/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 24px 80px rgba(0, 0, 0, 0.42)',
        glow: '0 0 0 1px rgba(255,255,255,0.12), 0 0 48px rgba(180, 210, 255, 0.12)'
      },
      fontFamily: {
        display: ['"Segoe UI Variable Display"', '"Segoe UI"', 'sans-serif'],
        body: ['"Segoe UI Variable Text"', '"Segoe UI"', 'sans-serif']
      },
      colors: {
        panel: {
          950: '#05070b',
          900: '#090d14',
          850: '#0f141d',
          800: '#171d27'
        }
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -10px, 0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.78' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        floaty: 'floaty 9s ease-in-out infinite',
        pulseSoft: 'pulseSoft 3.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
