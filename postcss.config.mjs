import { fileURLToPath } from 'node:url';

const hoverOnlyWhenHoverable = fileURLToPath(
  new URL('./postcss-hover-media.mjs', import.meta.url),
);

const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    [hoverOnlyWhenHoverable]: {},
  },
};

export default config;
