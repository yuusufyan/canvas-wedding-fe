/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Aktifkan data contoh untuk endpoint yang belum ada di backend (hanya mode dev). */
  readonly VITE_USE_MOCK_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
