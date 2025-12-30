/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        neon: {
          blue: '#4af0ff',
          purple: '#c084fc'
        },
        midnight: {
          900: '#0b132b',
          800: '#1c2541'
        }
      },
      boxShadow: {
        glow: '0 0 25px rgba(74, 240, 255, 0.35), 0 0 45px rgba(192, 132, 252, 0.25)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    }
  },
  plugins: []
};
