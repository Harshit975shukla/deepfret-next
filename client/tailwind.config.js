/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          light: '#FAF6EE',
          DEFAULT: '#F1E9D6',
          dark: '#E2D5B8',
          border: '#D4C3A3'
        },
        guitar: {
          amber: '#E07A28',
          rosewood: '#2E1E12',
          fretboard: '#1A1815',
          gold: '#D4A359',
          string: '#C0C0C0'
        },
        studio: {
          900: '#0F1115',
          800: '#161920',
          700: '#212631',
          600: '#2F3645'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
