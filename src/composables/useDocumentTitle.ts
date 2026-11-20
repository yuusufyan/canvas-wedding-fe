import { onMounted } from 'vue'

const SITE_NAME = 'Niskala Daisy'

// Judul tab per halaman agar perpindahan rute terbaca pembaca layar.
export function useDocumentTitle(title: string): void {
  onMounted(() => {
    document.title = `${title} | ${SITE_NAME}`
  })
}
