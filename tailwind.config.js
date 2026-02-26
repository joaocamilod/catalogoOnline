export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0ecff",
          100: "#e0d8ff",
          200: "#c4b5ff",
          300: "#a98fff",
          400: "#9b7eff",
          500: "#7845FF",
          600: "#6C4CFF",
          700: "#5a3dd6",
          800: "#4830aa",
          900: "#2d1e6b",
        },
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        slideInRight: "slideInRight 0.3s ease-out",
        slideUp: "slideUp 0.3s ease-out",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translate(-50%, 16px)" },
          to: { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
    },
  },
  plugins: [],
};
