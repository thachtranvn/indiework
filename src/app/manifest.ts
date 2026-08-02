import type { MetadataRoute } from 'next';

/**
 * Web app manifest (served at /manifest.webmanifest) — what makes IndieWork
 * installable and lets it launch without browser chrome.
 *
 * `start_url` points at /app rather than /: the landing page just bounces a
 * signed-in visitor onwards, and an installed app should open on the work, not
 * on a marketing page.
 *
 * The PNGs in public/icons/ are rasterised from src/app/icon.svg at 192, 512
 * (rounded) and 512 square (maskable — Android applies its own mask, so rounded
 * corners there would leave dark notches).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IndieWork',
    short_name: 'IndieWork',
    description: 'Plan, build and ship — project management for solo developers.',
    id: '/app',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    // Matches --bg-app (light); <html> is hard-coded to data-theme="light".
    background_color: '#f9fafc',
    theme_color: '#f9fafc',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
