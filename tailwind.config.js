/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // Brighter blue accent for SaaS feel
          dark: '#1e40af',
          light: '#60a5fa',
        },
        slate: {
          950: '#0B1220', // Deepest background
          900: '#111A2E', // Card background
          800: '#1E293B',
        },
        text: {
          primary: '#E6EDF7',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
