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
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        teal: {
          50: '#e0fff8',
          100: '#b3ffeb',
          200: '#80ffd9',
          300: '#4dffc7',
          400: '#1affb5',
          500: '#00e6a1',
          600: '#00b37d',
          700: '#008059',
          800: '#004d36',
          900: '#001a12',
          accent: '#00c096',
        },
        surface: {
          bg: '#14171a',
          card: '#1c2025',
          border: '#2a2e35',
          input: '#1a1d21',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

