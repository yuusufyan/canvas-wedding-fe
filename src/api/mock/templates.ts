import type {
  InvitationElement,
  InvitationPage,
  TemplateAccess,
  TextFont,
} from '@/types/invitation-document'
import type { PublicTemplateSummary, TemplateDemo } from '@/types/template'

// Data contoh (fiktif) untuk pengembangan sebelum endpoint publik backend tersedia.
interface Theme {
  slug: string
  name: string
  access: TemplateAccess
  background: string
  ink: string
  accent: string
  nameFont: TextFont
  panel: string
  panelInk: string
}

const EVENT_DATE = '2026-12-12T08:00:00+07:00'

const THEMES: Theme[] = [
  {
    slug: 'rustic-hijau',
    name: 'Rustic Hijau',
    access: 'Gratis',
    background: '#2F3A30',
    ink: '#F4EDE0',
    accent: '#E9D8B4',
    nameFont: 'script',
    panel: '#F4EDE0',
    panelInk: '#2E2A25',
  },
  {
    slug: 'elegan-putih',
    name: 'Elegan Putih',
    access: 'Premium',
    background: '#FFFDF8',
    ink: '#2E2A25',
    accent: '#8A7550',
    nameFont: 'serif',
    panel: '#F4EDE0',
    panelInk: '#2E2A25',
  },
  {
    slug: 'floral-blush',
    name: 'Floral Blush',
    access: 'Premium',
    background: '#F6E3E1',
    ink: '#8F3F48',
    accent: '#8F3F48',
    nameFont: 'script',
    panel: '#FFFDF8',
    panelInk: '#2E2A25',
  },
  {
    slug: 'garden-sage',
    name: 'Garden Sage',
    access: 'Gratis',
    background: '#DCE5D3',
    ink: '#3F5A45',
    accent: '#3F5A45',
    nameFont: 'script',
    panel: '#FFFDF8',
    panelInk: '#2E2A25',
  },
  {
    slug: 'minimalis-modern',
    name: 'Minimalis Modern',
    access: 'Gratis',
    background: '#FFFFFF',
    ink: '#2E2A25',
    accent: '#2E2A25',
    nameFont: 'serif',
    panel: '#F4EDE0',
    panelInk: '#2E2A25',
  },
  {
    slug: 'midnight-gold',
    name: 'Midnight Gold',
    access: 'Premium',
    background: '#1B1E33',
    ink: '#E9D8B4',
    accent: '#E9D8B4',
    nameFont: 'serif',
    panel: '#F4EDE0',
    panelInk: '#2E2A25',
  },
  {
    slug: 'batik-klasik',
    name: 'Batik Klasik',
    access: 'Premium',
    background: '#6B4A2B',
    ink: '#F4EDE0',
    accent: '#E9D8B4',
    nameFont: 'serif',
    panel: '#F4EDE0',
    panelInk: '#2E2A25',
  },
  {
    slug: 'ocean-dusk',
    name: 'Ocean Dusk',
    access: 'Gratis',
    background: '#DCE6EE',
    ink: '#3F5568',
    accent: '#3F5568',
    nameFont: 'serif',
    panel: '#FFFDF8',
    panelInk: '#2E2A25',
  },
]

function text(
  id: string,
  value: string,
  box: [number, number, number, number],
  style: {
    font: TextFont
    size: number
    color: string
    weight?: number
    spacing?: number
    upper?: boolean
  },
): InvitationElement {
  const [x, y, width, height] = box
  return {
    id,
    type: 'text',
    text: value,
    x,
    y,
    width,
    height,
    font: style.font,
    size: style.size,
    color: style.color,
    align: 'center',
    weight: style.weight,
    letter_spacing: style.spacing,
    uppercase: style.upper,
  }
}

function coverPage(theme: Theme, withButton: boolean): InvitationPage {
  const elements: InvitationElement[] = [
    text('eyebrow', 'The wedding of', [30, 190, 300, 16], {
      font: 'sans',
      size: 9,
      color: theme.ink,
      spacing: 0.3,
      upper: true,
    }),
    text('names', 'Hilbert &\nHilda', [20, 215, 320, 150], {
      font: theme.nameFont,
      size: theme.nameFont === 'script' ? 52 : 42,
      color: theme.nameFont === 'script' ? theme.accent : theme.ink,
    }),
    {
      id: 'rule',
      type: 'shape',
      shape: 'line',
      fill: theme.accent,
      x: 150,
      y: 385,
      width: 60,
      height: 1,
    },
    text('date', withButton ? 'Sabtu, 12 Desember 2026' : '12 . 12 . 2026', [30, 400, 300, 18], {
      font: 'sans',
      size: withButton ? 10.5 : 9.5,
      color: theme.ink,
      spacing: withButton ? 0 : 0.25,
    }),
  ]
  if (withButton) {
    elements.push({
      id: 'open',
      type: 'button',
      label: 'Buka undangan',
      fill: theme.accent,
      color: theme.background,
      x: 115,
      y: 440,
      width: 130,
      height: 30,
    })
  }
  return { id: 'cover', title: 'Cover', background: theme.background, elements }
}

function eventPage(theme: Theme): InvitationPage {
  return {
    id: 'acara',
    title: 'Acara & Countdown',
    background: theme.background,
    elements: [
      text('title', 'Rangkaian Acara', [20, 70, 320, 70], {
        font: 'script',
        size: 40,
        color: theme.accent,
      }),
      {
        id: 'cd',
        type: 'countdown',
        target: EVENT_DATE,
        color: theme.ink,
        x: 28,
        y: 160,
        width: 304,
        height: 56,
      },
      {
        id: 'arch',
        type: 'shape',
        shape: 'arch',
        fill: theme.panel,
        x: 36,
        y: 250,
        width: 288,
        height: 340,
      },
      text('akad', 'Akad Nikah', [60, 300, 240, 40], {
        font: 'serif',
        size: 26,
        color: theme.panelInk,
      }),
      text('when', 'Sabtu, 12 Desember 2026\n08.00 - 10.00 WIB', [60, 350, 240, 44], {
        font: 'sans',
        size: 10.5,
        color: theme.panelInk,
      }),
      text('where', 'Masjid Al-Ikhlas\nBandung', [60, 410, 240, 40], {
        font: 'sans',
        size: 11,
        color: theme.panelInk,
        weight: 500,
      }),
    ],
  }
}

function plainPage(theme: Theme, id: string, title: string, body: string): InvitationPage {
  return {
    id,
    title,
    background: theme.background,
    elements: [
      text(`${id}-title`, title, [20, 200, 320, 60], {
        font: 'script',
        size: 38,
        color: theme.accent,
      }),
      text(`${id}-body`, body, [50, 280, 260, 100], { font: 'sans', size: 11, color: theme.ink }),
    ],
  }
}

function demoPages(theme: Theme): InvitationPage[] {
  return [
    coverPage(theme, true),
    plainPage(
      theme,
      'ayat',
      'Ayat',
      'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan untukmu.',
    ),
    plainPage(
      theme,
      'mempelai',
      'Mempelai',
      'Hilbert Pratama\nPutra pertama Bapak Contoh & Ibu Contoh\n\nHilda Lestari\nPutri kedua Bapak Contoh & Ibu Contoh',
    ),
    eventPage(theme),
    plainPage(theme, 'galeri', 'Galeri', 'Momen-momen kecil yang membawa kami sampai di sini.'),
    plainPage(
      theme,
      'love-story',
      'Love Story',
      'Berawal dari satu pesan singkat di bulan Juni, berlanjut menjadi cerita panjang.',
    ),
    plainPage(
      theme,
      'rsvp',
      'RSVP & Ucapan',
      'Mohon konfirmasi kehadiran dan tinggalkan doa terbaik untuk kami.',
    ),
    plainPage(
      theme,
      'amplop',
      'Amplop Digital',
      'Doa restu adalah hadiah terbaik. Bila berkenan berbagi kasih, tersedia amplop digital.',
    ),
    plainPage(theme, 'penutup', 'Penutup', 'Terima kasih atas doa dan kehadiran Anda.'),
  ]
}

export const MOCK_THEME_SLUGS = THEMES.map((theme) => theme.slug)

// Cover tanpa tombol untuk thumbnail; tema dipilih lewat slug (default: tema pertama).
export function mockCover(slug: string): InvitationPage {
  const theme = THEMES.find((item) => item.slug === slug) ?? THEMES[0]!
  return coverPage(theme, false)
}

export function mockThemeInfo(slug: string): { name: string; access: TemplateAccess } | null {
  const theme = THEMES.find((item) => item.slug === slug)
  return theme ? { name: theme.name, access: theme.access } : null
}

export function mockTemplateSummaries(limit: number): PublicTemplateSummary[] {
  return THEMES.slice(0, Math.min(limit, 4)).map((theme) => ({
    slug: theme.slug,
    name: theme.name,
    access: theme.access,
    cover: coverPage(theme, false),
  }))
}

export function mockTemplateDemo(slug: string): TemplateDemo | null {
  const theme = THEMES.find((item) => item.slug === slug)
  if (!theme) {
    return null
  }
  return {
    slug: theme.slug,
    name: theme.name,
    couple_label: 'Hilbert & Hilda',
    access: theme.access,
    description:
      '9 halaman dengan countdown, galeri, RSVP, dan amplop digital. Semua teks, warna, dan foto bisa kamu ubah.',
    duration_seconds: 45,
    animation_label: 'Naik · 0,8 dtk',
    has_music: true,
    has_rsvp: true,
    document: { schema_version: 1, pages: demoPages(theme) },
  }
}
