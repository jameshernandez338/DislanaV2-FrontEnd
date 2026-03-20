/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      maxWidth: {
        '6xl': '72rem',
        '7xl': '80rem'
      }
    },
  },
  plugins: [],
}
