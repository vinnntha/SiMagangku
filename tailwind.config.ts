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
        // Landing Page Theme Colors
        "surface-container-low": "#f2f4f6",
        "on-secondary-fixed": "#001f25",
        "primary-fixed": "#b3ebff",
        "primary-fixed-dim": "#4cd6fb",
        "primary-container": "#00b4d8",
        "on-surface-variant": "#3d494d",
        "on-surface": "#191c1e",
        "secondary-fixed-dim": "#58d6f1",
        "surface-container-highest": "#e0e3e5",
        "surface-variant": "#e0e3e5",
        "error-container": "#ffdad6",
        "tertiary": "#5157a6",
        "on-tertiary-fixed-variant": "#393e8c",
        "on-tertiary-fixed": "#070a61",
        "tertiary-fixed-dim": "#bfc2ff",
        "secondary-container": "#69e5ff",
        "outline": "#6d797e",
        "surface-dim": "#d8dadc",
        "secondary-fixed": "#a7edff",
        "surface-bright": "#f7f9fb",
        "surface": "#f7f9fb",
        "inverse-primary": "#4cd6fb",
        "surface-container-high": "#e6e8ea",
        "secondary": "#006878",
        "outline-variant": "#bcc9ce",
        "on-tertiary-container": "#2d3280",
        "on-tertiary": "#ffffff",
        "on-secondary-container": "#006575",
        "on-secondary": "#ffffff",
        "on-error": "#ffffff",
        "on-secondary-fixed-variant": "#004e5b",
        "on-primary-container": "#00414f",
        "error": "#ba1a1a",
        "inverse-surface": "#2d3133",
        "surface-container": "#eceef0",
        "on-primary-fixed": "#001f27",
        "tertiary-fixed": "#e0e0ff",
        "on-primary": "#ffffff",
        "inverse-on-surface": "#eff1f3",
        "tertiary-container": "#989ef3",
        "primary": "#00677d",
        "on-error-container": "#93000a",
        "background": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed-variant": "#004e5f",
        "surface-tint": "#00677d",
        "on-background": "#191c1e",

        // Student Login/Register Brand Colors
        brand: {
          cyan: "#00b4d8",
          "cyan-hover": "#0096c7",
          "cyan-dark": "#0077b6",
          "cyan-light": "#e0f7fa",
        },
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px",
      },
      spacing: {
        "margin-mobile": "16px",
        "gutter": "24px",
        "margin-desktop": "40px",
        "base": "8px",
        "container-max": "1280px",
      },
      fontFamily: {
        "display-lg": ["var(--font-be-vietnam)"],
        "title-md": ["var(--font-be-vietnam)"],
        "body-md": ["var(--font-be-vietnam)"],
        "headline-lg-mobile": ["var(--font-be-vietnam)"],
        "headline-lg": ["var(--font-be-vietnam)"],
        "label-sm": ["var(--font-be-vietnam)"],
      },
      fontSize: {
        "display-lg": [
          "48px",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
        "title-md": [
          "20px",
          {
            lineHeight: "1.5",
            fontWeight: "600",
          },
        ],
        "body-md": [
          "16px",
          {
            lineHeight: "1.6",
            fontWeight: "400",
          },
        ],
        "headline-lg-mobile": [
          "24px",
          {
            lineHeight: "1.3",
            fontWeight: "600",
          },
        ],
        "headline-lg": [
          "32px",
          {
            lineHeight: "1.3",
            fontWeight: "600",
          },
        ],
        "label-sm": [
          "13px",
          {
            lineHeight: "1.4",
            letterSpacing: "0.01em",
            fontWeight: "500",
          },
        ],
      },
    },
  },
  plugins: [],
};
export default config;
