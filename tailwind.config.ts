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
        bg: "var(--bg)",
        bg2: "var(--bg-2)",
        fg: "var(--fg)",
        "fg-dim": "var(--fg-dim)",
        "fg-muted": "var(--fg-muted)",
        accent: "var(--accent)",
        "accent-warm": "var(--accent-warm)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Pretendard Variable",
          "Pretendard",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
