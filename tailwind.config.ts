import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pixel: {
          bg: "#0a0f2c",
          ocean: "#0d1b4b",
          land: "#1a3a5c",
          visited: "#00b4d8",
          cyan: "#00e5ff",
          yellow: "#ffd60a",
          green: "#39ff14",
          magenta: "#ff00ff",
          orange: "#ff8c00",
          red: "#ff4d6d",
          purple: "#bf5af2",
          dark: "#060b1a",
          card: "#0d1635",
          border: "#1e3a5f",
          // UI blues
          blue: "#0277bd",
          "blue-light": "#0288d1",
          "blue-dark": "#01579b",
          "blue-deep": "#014080",
          "blue-border": "#29b6f6",
          // Text shades
          "text-bright": "#e8f4fb",
          "text-mid": "#c8e6f8",
          "text-soft": "#93c5d8",
          "text-muted": "#7ec8e3",
          "text-faint": "#5b8fa8",
          "text-dim": "#4a8ab5",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
      },
      boxShadow: {
        "pixel-cyan": "0 0 10px #00e5ff, 0 0 30px #00e5ff40",
        "pixel-yellow": "0 0 10px #ffd60a, 0 0 30px #ffd60a40",
        "pixel-green": "0 0 10px #39ff14, 0 0 30px #39ff1440",
        "pixel-magenta": "0 0 10px #ff00ff, 0 0 30px #ff00ff40",
        "pixel-inset": "inset 0 0 20px rgba(0,229,255,0.05)",
        "pixel-card":
          "3px 3px 0 #01579b, inset 1px 1px 0 rgba(255,255,255,0.15), inset -1px -1px 0 rgba(0,0,0,0.25)",
        "pixel-sm": "2px 2px 0 #014080",
        "pixel-md": "3px 3px 0 #014080",
        "pixel-nav": "0 -3px 0 #01579b, inset 0 1px 0 rgba(255,255,255,0.15)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glow: {
          from: { boxShadow: "0 0 5px #00e5ff, 0 0 10px #00e5ff40" },
          to: { boxShadow: "0 0 20px #00e5ff, 0 0 40px #00e5ff60" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
