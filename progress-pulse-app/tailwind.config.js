/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}",
     "./assets/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
       colors: {
        darkBg: '#1E1E1E',         // רקע כהה
        primaryText: '#F4F4F4',    // טקסט ראשי
        highlight: '#FFD100',      // צבע עיקרי מודגש
        action: '#FF5733',         // כפתורי פעולה מודגשים
        secondaryBg: '#333533',    // רקע משני
        border: '#000000',         // גבולות והפרדות
        secondaryText: '#AAAAAA',  // טקסט משני / אייקונים
        lightGray: '#CCCCCC',      // אפור בהיר נוסף
      },
    },
  },
  plugins: [],
}