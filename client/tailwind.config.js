/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "rgba(var(--border), <alpha-value>)",
        background: "rgba(var(--background), <alpha-value>)",
        foreground: "rgba(var(--foreground), <alpha-value>)",
        card: "rgba(var(--card), <alpha-value>)",
        "card-foreground": "rgba(var(--card-foreground), <alpha-value>)",
        primary: {
          DEFAULT: "rgba(var(--primary), <alpha-value>)",
          foreground: "rgba(var(--primary-foreground), <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgba(var(--secondary), <alpha-value>)",
          foreground: "rgba(var(--secondary-foreground), <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgba(var(--muted), <alpha-value>)",
          foreground: "rgba(var(--muted-foreground), <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgba(var(--accent), <alpha-value>)",
          foreground: "rgba(var(--accent-foreground), <alpha-value>)",
        },
        success: {
          DEFAULT: "rgba(var(--success), <alpha-value>)",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "rgba(var(--warning), <alpha-value>)",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        premium: "0 4px 30px rgba(0, 0, 0, 0.03)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }
    },
  },
  plugins: [],
}
