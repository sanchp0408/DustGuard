/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D9E75",
        danger: "#E24B4A",
        warning: "#EF9F27",
        info: "#378ADD",
        dark: "#1a1a2e"
      }
    },
  },
  plugins: [],
}
