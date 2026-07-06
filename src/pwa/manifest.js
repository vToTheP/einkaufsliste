// Einzige Quelle der Wahrheit für das PWA-Manifest. Als Funktion, damit die
// Base (GitHub-Pages-Projektpfad) an start_url/scope durchgereicht werden kann
// und das Manifest testbar bleibt (src/pwa/manifest.test.js).
export function createManifest(base = '/') {
  return {
    name: 'Einkaufsliste',
    short_name: 'Einkauf',
    description: 'Einfache Einkaufsliste als installierbare PWA',
    lang: 'de',
    theme_color: '#16a34a',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: base,
    scope: base,
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
