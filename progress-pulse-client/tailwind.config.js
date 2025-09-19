/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}",
    "./assets/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        field:"#E1E3E6", // input background (soft gray)
        fieldBorder:"#C7CDD6",
        fieldMuted:  "#667085",
        bg: '#FDFBFA',
        card: '#F3F3F3',
        text: '#2C2C2C',
        muted: '#888888',
        primary: '#007BFF',
        onPrimary: "#FFFFFF",
        secondary: '#FF6B35',
        border: '#DDDDDD',
        success: '#1DB954',
        error: '#FF4D4D',
      },
    },
  },
  plugins: [],
}