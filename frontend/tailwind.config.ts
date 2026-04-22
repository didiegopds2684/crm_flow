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
        ink: "#13212f",
        ember: "#d36d3f",
        sand: "#f3ebdd",
        mist: "#dfe6ec",
        pine: "#1f4d47"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(19, 33, 47, 0.16)"
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(circle at top left, rgba(211, 109, 63, 0.28), transparent 30%), radial-gradient(circle at top right, rgba(31, 77, 71, 0.16), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.94), rgba(243,235,221,0.94))"
      }
    }
  },
  plugins: []
};

export default config;

