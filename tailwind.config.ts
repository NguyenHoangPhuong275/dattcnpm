import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};

export default config;
