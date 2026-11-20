// Satu-satunya tempat yang membaca import.meta.env. Pemuat mock dibentuk di sini dengan
// kondisi DEV di dalam ekspresi yang sama agar bundler membuang impor dinamis
// src/api/mock dari bundle produksi.
export const loadMockApi: (() => Promise<typeof import('./api/mock')>) | null =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === 'true'
    ? () => import('./api/mock')
    : null
