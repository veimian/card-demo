/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        blue: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98', // Low saturation primary
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
        },
        indigo: {
          50: '#F0F4F8', // Shared light shades for harmony
          500: '#5A67D8', // Keeping some vibrancy for accents if needed, or mute it too
          600: '#4C51BF',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
