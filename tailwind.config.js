/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gym: {
          accent: '#16a34a',
          surface: '#0f172a',
          muted: '#94a3b8',
        },
      },
    },
  },
  plugins: [],
};
