import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        vora: {
          cream: "#F4EBDD",
          paper: "#FFF9EF",
          paper2: "#FDF1E2",
          ink: "#2E2923",
          muted: "#746B5E",
          subtle: "#9A8D7A",
          olive: "#7F8A55",
          oliveDark: "#59633A",
          blush: "#E9BCA7",
          line: "#E3D6C3",
          danger: "#9B4A3B"
        }
      },
      boxShadow: {
        card: "0 18px 60px rgba(46, 41, 35, 0.10)"
      },
      borderRadius: {
        vora: "28px"
      }
    }
  },
  plugins: []
};

export default config;
