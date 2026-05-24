/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gray: {
          750: '#2d3748',
          850: '#1a202c',
          950: '#0d1117',
        },
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  safelist: [
    { pattern: /^(bg|text|border)-(indigo|purple|emerald|red|yellow|blue|orange|cyan|pink|gray|green)-(400|500|600)/ },
    { pattern: /^(bg|text|border)-(indigo|purple|emerald|red|yellow|blue|orange|cyan|pink|gray|green)-(400|500|600)\/(10|20|30)/ },
  ],
}
