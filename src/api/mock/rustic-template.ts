import type { InvitationElement, InvitationPage, TextFont } from '@/types/invitation-document'

// Palet dan isi acuan template Rustic Hijau (8 bagian: Cover, Ayat, Mempelai,
// Rangkaian Acara, Galeri, Konfirmasi Kehadiran, Wedding Gift, Penutup).
const EVENT_DATE = '2026-12-12T08:00:00+07:00'

const PALETTE = {
  coverBg: '#1F2420',
  coverFrame: '#2A322B',
  rusticDark: '#2F3A30',
  creamBg: '#F7F2EA',
  ivoryBg: '#FFFDF8',
  goldLight: '#E9D8B4',
  goldBrown: '#8A6A42',
  accentBrown: '#7D5C34',
  accentBrownSoft: '#96774E',
  inkDark: '#2E2A25',
  inkMuted: '#6F6B64',
  inkLight: '#F4EDE0',
  inkSoftLight: '#D8CFC2',
  fieldBg: '#F3EFE8',
  fieldBorder: '#DFD6C7',
  frameGroom: '#3B2F28',
  frameBride: '#465446',
  frameBorder: '#C7B69B',
} as const

type Box = [number, number, number, number]

interface TextStyle {
  font: TextFont
  size: number
  color: string
  align?: 'left' | 'center' | 'right'
  weight?: number
  italic?: boolean
  lineHeight?: number
  spacing?: number
  upper?: boolean
}

function text(id: string, value: string, box: Box, style: TextStyle): InvitationElement {
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
    align: style.align ?? 'center',
    weight: style.weight,
    italic: style.italic,
    line_height: style.lineHeight,
    letter_spacing: style.spacing,
    uppercase: style.upper,
  }
}

function rect(
  id: string,
  box: Box,
  fill: string,
  options?: { radius?: number; border?: string },
): InvitationElement {
  const [x, y, width, height] = box
  return {
    id,
    type: 'shape',
    shape: 'rect',
    fill,
    x,
    y,
    width,
    height,
    radius: options?.radius,
    border: options?.border,
  }
}

function arch(id: string, box: Box, fill: string, border?: string): InvitationElement {
  const [x, y, width, height] = box
  return { id, type: 'shape', shape: 'arch', fill, border, x, y, width, height }
}

function line(id: string, box: Box, fill: string): InvitationElement {
  const [x, y, width, height] = box
  return { id, type: 'shape', shape: 'line', fill, x, y, width, height }
}

export function rusticCoverPage(withButton: boolean): InvitationPage {
  const elements: InvitationElement[] = [
    arch('cover-backdrop', [24, 34, 312, 572], PALETTE.coverFrame, PALETTE.goldBrown),
    text('eyebrow', 'The Wedding Of', [30, 210, 300, 16], {
      font: 'sans',
      size: 9.5,
      color: PALETTE.goldLight,
      spacing: 0.28,
      upper: true,
    }),
    text('names', 'Hilbert & Hilda', [16, 238, 328, 66], {
      font: 'script',
      size: 46,
      color: PALETTE.inkLight,
    }),
    line('rule', [150, 316, 60, 1], PALETTE.goldLight),
    text('date', 'Sabtu, 12 Desember 2026', [30, 330, 300, 22], {
      font: 'serif',
      size: 13.5,
      color: PALETTE.goldLight,
      italic: true,
    }),
    text('guest-label', 'Kepada Yth. Bapak/Ibu/Saudara/i', [30, 384, 300, 16], {
      font: 'sans',
      size: 9.5,
      color: PALETTE.inkSoftLight,
    }),
    text('guest-name', 'Nama Tamu', [30, 406, 300, 22], {
      font: 'sans',
      size: 13,
      color: PALETTE.ivoryBg,
      weight: 600,
    }),
  ]
  if (withButton) {
    elements.push({
      id: 'open',
      type: 'button',
      label: 'Buka Undangan',
      fill: PALETTE.ivoryBg,
      color: PALETTE.inkDark,
      x: 105,
      y: 454,
      width: 150,
      height: 34,
    })
  }
  return { id: 'cover', title: 'Cover', background: PALETTE.coverBg, elements }
}

function ayatPage(): InvitationPage {
  return {
    id: 'ayat',
    title: 'Ayat',
    background: PALETTE.creamBg,
    elements: [
      line('orn-left', [124, 210, 42, 1], PALETTE.goldBrown),
      text('orn-mark', '✦', [168, 200, 24, 20], {
        font: 'serif',
        size: 14,
        color: PALETTE.goldBrown,
      }),
      line('orn-right', [194, 210, 42, 1], PALETTE.goldBrown),
      text(
        'ayat-quote',
        '"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya."',
        [38, 240, 284, 148],
        {
          font: 'serif',
          size: 15.5,
          color: PALETTE.inkDark,
          italic: true,
          lineHeight: 1.65,
        },
      ),
      text('ayat-ref', 'QS. Ar-Rum : 21', [40, 404, 280, 20], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.goldBrown,
        spacing: 0.1,
      }),
    ],
  }
}

function mempelaiPage(): InvitationPage {
  return {
    id: 'mempelai',
    title: 'Mempelai',
    background: PALETTE.ivoryBg,
    elements: [
      text('mempelai-title', 'Mempelai', [20, 24, 320, 44], {
        font: 'script',
        size: 36,
        color: PALETTE.goldBrown,
      }),
      arch('groom-photo', [132, 76, 96, 114], PALETTE.frameGroom, PALETTE.frameBorder),
      text('groom-initial', 'H', [132, 116, 96, 40], {
        font: 'serif',
        size: 32,
        color: PALETTE.goldLight,
      }),
      text('groom-nick', 'Hilbert', [30, 198, 300, 26], {
        font: 'serif',
        size: 20,
        color: PALETTE.inkDark,
        weight: 600,
      }),
      text('groom-full', 'Hilbert Pratama, S.Kom.', [30, 224, 300, 18], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.inkDark,
        weight: 600,
      }),
      text(
        'groom-parents',
        'Putra pertama dari\nBapak Hendra Pratama & Ibu Sari Wulandari',
        [30, 244, 300, 34],
        {
          font: 'sans',
          size: 9.2,
          color: PALETTE.inkMuted,
          lineHeight: 1.45,
        },
      ),
      text('amp', '&', [140, 288, 80, 36], {
        font: 'script',
        size: 30,
        color: PALETTE.goldBrown,
      }),
      arch('bride-photo', [132, 332, 96, 114], PALETTE.frameBride, PALETTE.frameBorder),
      text('bride-initial', 'H', [132, 372, 96, 40], {
        font: 'serif',
        size: 32,
        color: PALETTE.goldLight,
      }),
      text('bride-nick', 'Hilda', [30, 454, 300, 26], {
        font: 'serif',
        size: 20,
        color: PALETTE.inkDark,
        weight: 600,
      }),
      text('bride-full', 'Hilda Rahmadani, S.Psi.', [30, 480, 300, 18], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.inkDark,
        weight: 600,
      }),
      text(
        'bride-parents',
        'Putri kedua dari\nBapak Ahmad Fauzi & Ibu Rina Marlina',
        [30, 500, 300, 34],
        {
          font: 'sans',
          size: 9.2,
          color: PALETTE.inkMuted,
          lineHeight: 1.45,
        },
      ),
    ],
  }
}

function eventCard(
  prefix: string,
  top: number,
  title: string,
  time: string,
  venue: string,
  address: string,
): InvitationElement[] {
  return [
    arch(`${prefix}-card`, [36, top, 288, 224], PALETTE.ivoryBg),
    text(`${prefix}-title`, title, [56, top + 34, 248, 28], {
      font: 'serif',
      size: 21,
      color: PALETTE.inkDark,
      weight: 600,
    }),
    text(`${prefix}-date`, `Sabtu, 12 Desember 2026\n${time}`, [56, top + 66, 248, 34], {
      font: 'sans',
      size: 9.5,
      color: PALETTE.inkMuted,
      lineHeight: 1.45,
    }),
    line(`${prefix}-sep`, [148, top + 106, 64, 1], PALETTE.fieldBorder),
    text(`${prefix}-venue`, venue, [56, top + 116, 248, 18], {
      font: 'sans',
      size: 10.5,
      color: PALETTE.inkDark,
      weight: 600,
    }),
    text(`${prefix}-addr`, address, [56, top + 136, 248, 18], {
      font: 'sans',
      size: 9.2,
      color: PALETTE.inkMuted,
    }),
    {
      id: `${prefix}-map`,
      type: 'button',
      label: 'Lihat Lokasi',
      fill: PALETTE.accentBrown,
      color: PALETTE.ivoryBg,
      x: 122,
      y: top + 168,
      width: 116,
      height: 28,
    },
  ]
}

function acaraPage(): InvitationPage {
  return {
    id: 'acara',
    title: 'Acara & Countdown',
    background: PALETTE.rusticDark,
    elements: [
      text('acara-title', 'Rangkaian Acara', [20, 20, 320, 42], {
        font: 'script',
        size: 34,
        color: PALETTE.goldLight,
      }),
      {
        id: 'cd',
        type: 'countdown',
        target: EVENT_DATE,
        color: PALETTE.inkLight,
        x: 34,
        y: 72,
        width: 292,
        height: 48,
      },
      ...eventCard(
        'akad',
        136,
        'Akad Nikah',
        '08.00 – 10.00 WIB',
        'Masjid Al-Ikhlas',
        'Jl. Melati No. 12, Bandung',
      ),
      ...eventCard(
        'resepsi',
        380,
        'Resepsi',
        '11.00 – 14.00 WIB',
        'Gedung Sabuga',
        'Jl. Tamansari No. 73, Bandung',
      ),
    ],
  }
}

function galeriPage(): InvitationPage {
  return {
    id: 'galeri',
    title: 'Galeri',
    background: PALETTE.creamBg,
    elements: [
      text('galeri-title', 'Galeri', [20, 34, 320, 46], {
        font: 'script',
        size: 38,
        color: PALETTE.goldBrown,
      }),
      rect('foto-1', [24, 102, 150, 224], '#D6CEC1', { radius: 10, border: PALETTE.fieldBorder }),
      text('foto-1-label', 'Prewedding I', [32, 204, 134, 20], {
        font: 'serif',
        size: 13,
        color: PALETTE.inkMuted,
        italic: true,
      }),
      rect('foto-2', [186, 102, 150, 152], '#C8D0C4', { radius: 10, border: PALETTE.fieldBorder }),
      text('foto-2-label', 'Taman', [194, 168, 134, 20], {
        font: 'serif',
        size: 13,
        color: PALETTE.inkMuted,
        italic: true,
      }),
      rect('foto-3', [24, 338, 150, 152], '#E4D8D2', { radius: 10, border: PALETTE.fieldBorder }),
      text('foto-3-label', 'Cincin', [32, 404, 134, 20], {
        font: 'serif',
        size: 13,
        color: PALETTE.inkMuted,
        italic: true,
      }),
      rect('foto-4', [186, 266, 150, 224], '#D9D0C5', { radius: 10, border: PALETTE.fieldBorder }),
      text('foto-4-label', 'Momen', [194, 368, 134, 20], {
        font: 'serif',
        size: 13,
        color: PALETTE.inkMuted,
        italic: true,
      }),
      text('galeri-caption', 'Momen-momen berharga menuju hari bahagia kami.', [32, 520, 296, 34], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.inkMuted,
        lineHeight: 1.45,
      }),
    ],
  }
}

function rsvpPage(): InvitationPage {
  return {
    id: 'rsvp',
    title: 'Konfirmasi Kehadiran',
    background: PALETTE.ivoryBg,
    elements: [
      text('rsvp-title', 'Konfirmasi Kehadiran', [24, 48, 312, 34], {
        font: 'serif',
        size: 24,
        color: PALETTE.inkDark,
        weight: 600,
      }),
      rect('field-name', [24, 106, 312, 38], PALETTE.fieldBg, {
        radius: 6,
        border: PALETTE.fieldBorder,
      }),
      text('field-name-ph', 'Nama Anda', [36, 118, 288, 18], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.inkMuted,
        align: 'left',
      }),
      rect('field-attend', [24, 156, 312, 38], PALETTE.fieldBg, {
        radius: 6,
        border: PALETTE.fieldBorder,
      }),
      text('field-attend-ph', 'Pilih kehadiran ▾', [36, 168, 288, 18], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.inkMuted,
        align: 'left',
      }),
      rect('field-wish', [24, 206, 312, 92], PALETTE.fieldBg, {
        radius: 6,
        border: PALETTE.fieldBorder,
      }),
      text('field-wish-ph', 'Tulis ucapan & doa...', [36, 220, 288, 20], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.inkMuted,
        align: 'left',
      }),
      {
        id: 'rsvp-submit',
        type: 'button',
        label: 'Kirim Ucapan',
        fill: PALETTE.accentBrown,
        color: PALETTE.ivoryBg,
        x: 24,
        y: 314,
        width: 312,
        height: 38,
        radius: 6,
      },
      line('rsvp-sep', [24, 376, 312, 1], PALETTE.fieldBorder),
      text('wish-author', 'Dimas · Hadir', [24, 394, 312, 18], {
        font: 'sans',
        size: 10.5,
        color: PALETTE.inkDark,
        weight: 600,
        align: 'left',
      }),
      text(
        'wish-body',
        'Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah!',
        [24, 416, 312, 40],
        {
          font: 'sans',
          size: 10,
          color: PALETTE.inkMuted,
          align: 'left',
          lineHeight: 1.5,
        },
      ),
    ],
  }
}

function weddingGiftPage(): InvitationPage {
  return {
    id: 'wedding-gift',
    title: 'Wedding Gift',
    background: PALETTE.creamBg,
    elements: [
      text('gift-title', 'Wedding Gift', [20, 118, 320, 48], {
        font: 'script',
        size: 38,
        color: PALETTE.goldBrown,
      }),
      text(
        'gift-intro',
        'Doa restu Anda merupakan karunia terindah. Bila ingin memberi tanda kasih, dapat melalui:',
        [32, 178, 296, 46],
        {
          font: 'sans',
          size: 10.5,
          color: PALETTE.inkMuted,
          lineHeight: 1.5,
        },
      ),
      rect('gift-card', [24, 248, 312, 134], PALETTE.accentBrown, { radius: 12 }),
      text('gift-bank', 'Bank BCA', [44, 268, 220, 16], {
        font: 'sans',
        size: 9.5,
        color: PALETTE.goldLight,
        align: 'left',
        spacing: 0.14,
        upper: true,
      }),
      text('gift-num', '1234 5678 90', [44, 296, 260, 30], {
        font: 'serif',
        size: 22,
        color: PALETTE.ivoryBg,
        align: 'left',
        weight: 600,
      }),
      text('gift-owner', 'a.n. Hilbert Pratama', [44, 342, 176, 18], {
        font: 'sans',
        size: 10,
        color: PALETTE.goldLight,
        align: 'left',
      }),
      {
        id: 'gift-copy',
        type: 'button',
        label: 'Salin',
        fill: PALETTE.accentBrownSoft,
        color: PALETTE.ivoryBg,
        x: 248,
        y: 336,
        width: 68,
        height: 26,
      },
    ],
  }
}

function penutupPage(): InvitationPage {
  return {
    id: 'penutup',
    title: 'Penutup',
    background: PALETTE.rusticDark,
    elements: [
      text(
        'closing-body',
        'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
        [36, 232, 288, 72],
        {
          font: 'sans',
          size: 11.5,
          color: PALETTE.inkLight,
          lineHeight: 1.6,
        },
      ),
      text('closing-names', 'Hilbert & Hilda', [20, 326, 320, 62], {
        font: 'script',
        size: 44,
        color: PALETTE.goldLight,
      }),
    ],
  }
}

export function rusticDemoPages(): InvitationPage[] {
  return [
    rusticCoverPage(true),
    ayatPage(),
    mempelaiPage(),
    acaraPage(),
    galeriPage(),
    rsvpPage(),
    weddingGiftPage(),
    penutupPage(),
  ]
}
