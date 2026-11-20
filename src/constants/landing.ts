import type { NkIconName } from '@/constants/nk-icons'
import type { InvitationPage } from '@/types/invitation-document'

// Salinan pemasaran landing. Angka statistik dan harga bersifat contoh sampai ada sumber dari backend.
export const DEMO_SLUG_DEFAULT = 'rustic-hijau'

export const LANDING_NAV = [
  { id: 'cara-kerja', label: 'Cara kerja', wideOnly: false },
  { id: 'template', label: 'Template', wideOnly: false },
  { id: 'harga', label: 'Harga', wideOnly: false },
  { id: 'faq', label: 'FAQ', wideOnly: true },
] as const

export const LANDING_STATS = [
  { value: '2.400+', label: 'undangan terkirim' },
  { value: '120+', label: 'template siap pakai' },
  { value: '4,8/5', label: 'rating dari pasangan' },
  { value: '5 menit', label: 'rata-rata waktu membuat' },
]

export const LANDING_STEPS = [
  {
    num: '01',
    title: 'Pilih template',
    text: 'Mulai dari 120+ template yang sudah tertata rapi. Cocok untuk adat, modern, atau yang sederhana.',
  },
  {
    num: '02',
    title: 'Edit seperti di Canva',
    text: 'Seret elemen, ganti font dan warna, tambah foto dan musik. Semua langsung terlihat di layar.',
  },
  {
    num: '03',
    title: 'Bagikan lewat satu link',
    text: 'Kirim lewat WhatsApp, lalu pantau RSVP dan ucapan tamu secara real-time dari dashboard.',
  },
]

export const LANDING_FEATURES: { icon: NkIconName; title: string; text: string }[] = [
  {
    icon: 'mouse-pointer',
    title: 'Seret & lepas',
    text: 'Pindahkan, ubah ukuran, dan putar elemen secara bebas.',
  },
  {
    icon: 'type',
    title: 'Font & warna bebas',
    text: 'Puluhan font undangan dan palet warna sesuai tema.',
  },
  {
    icon: 'users',
    title: 'RSVP & ucapan',
    text: 'Tamu konfirmasi kehadiran langsung dari undangan.',
  },
  {
    icon: 'music',
    title: 'Musik & galeri',
    text: 'Tambah lagu latar dan galeri foto tanpa batas.',
  },
]

export const LANDING_EDITOR_LAYERS = [
  'Rangkaian Acara',
  'Countdown',
  'Kartu Akad Nikah',
  'Tombol Lokasi',
]

export const LANDING_PLANS = {
  free: {
    name: 'Gratis',
    price: 'Rp0',
    description: 'Cukup untuk mencoba dan undangan sederhana.',
    features: [
      '1 undangan aktif',
      '5 template gratis',
      'Link undangan & RSVP dasar',
      'Watermark Niskala Daisy',
    ],
  },
  premium: {
    name: 'Premium',
    price: 'Rp99rb',
    unit: '/bulan',
    description: 'Untuk undangan yang benar-benar personal.',
    features: [
      'Hingga 10 undangan aktif',
      'Semua 120+ template',
      'Musik latar & galeri tanpa batas',
      'Tanpa watermark',
      'Link kustom nama-kalian',
    ],
  },
}

export const LANDING_FAQ = [
  {
    id: 'gratis',
    question: 'Apakah benar-benar gratis?',
    answer:
      'Ya. Paket Gratis bisa dipakai selamanya untuk 1 undangan dengan 5 template gratis. Kamu baru perlu Premium kalau butuh lebih banyak template atau tanpa watermark.',
  },
  {
    id: 'desain',
    question: 'Apakah saya perlu bisa desain?',
    answer:
      'Tidak. Semua template sudah tertata rapi; kamu tinggal mengganti teks, foto, dan warna sesuai selera.',
  },
  {
    id: 'tamu',
    question: 'Bagaimana tamu membuka undangan?',
    answer:
      'Tamu membuka link undangan dari WhatsApp di peramban ponsel mereka, tanpa perlu memasang aplikasi.',
  },
  {
    id: 'ubah',
    question: 'Bisa mengubah undangan setelah dibagikan?',
    answer:
      'Bisa. Perubahan langsung tampil di link yang sama, jadi tamu selalu melihat versi terbaru.',
  },
]

export const LANDING_FOOTER_LINKS = [
  { id: 'template', label: 'Template' },
  { id: 'harga', label: 'Harga' },
  { id: 'faq', label: 'FAQ' },
]

// Pratinjau ponsel di hero (konten pemasaran statis, bukan data template).
export const HERO_PREVIEW_PAGE: InvitationPage = {
  id: 'hero-cover',
  title: 'Cover',
  background: '#2F3A30',
  elements: [
    {
      id: 'eyebrow',
      type: 'text',
      text: 'The wedding of',
      x: 30,
      y: 215,
      width: 300,
      height: 16,
      font: 'sans',
      size: 9,
      color: '#E9D8B4',
      align: 'center',
      letter_spacing: 0.3,
      uppercase: true,
    },
    {
      id: 'names',
      type: 'text',
      text: 'Hilbert &\nHilda',
      x: 20,
      y: 240,
      width: 320,
      height: 150,
      font: 'script',
      size: 56,
      color: '#F4EDE0',
      align: 'center',
    },
    {
      id: 'rule',
      type: 'shape',
      shape: 'line',
      fill: '#E9D8B4',
      x: 150,
      y: 405,
      width: 60,
      height: 1,
    },
    {
      id: 'date',
      type: 'text',
      text: 'Sabtu, 12 Desember 2026',
      x: 30,
      y: 420,
      width: 300,
      height: 18,
      font: 'sans',
      size: 10.5,
      color: '#F4EDE0',
      align: 'center',
    },
    {
      id: 'open',
      type: 'button',
      label: 'Buka undangan',
      fill: '#E9D8B4',
      color: '#2F3A30',
      x: 110,
      y: 455,
      width: 140,
      height: 32,
    },
  ],
}
