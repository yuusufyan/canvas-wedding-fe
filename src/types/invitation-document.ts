// Draf kontrak dokumen undangan (TODO(BE): disamakan dengan skema yang disimpan backend).
// Koordinat dan ukuran memakai satuan logis pada halaman selebar PAGE_WIDTH dan setinggi PAGE_HEIGHT.
export const PAGE_WIDTH = 360
export const PAGE_HEIGHT = 640

export type TemplateAccess = 'Gratis' | 'Premium'

export type TextFont = 'script' | 'serif' | 'sans'

interface ElementBase {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

export interface TextElement extends ElementBase {
  type: 'text'
  text: string
  font: TextFont
  size: number
  color: string
  align: 'left' | 'center' | 'right'
  weight?: number
  italic?: boolean
  line_height?: number
  letter_spacing?: number
  uppercase?: boolean
}

export interface ShapeElement extends ElementBase {
  type: 'shape'
  shape: 'rect' | 'arch' | 'line'
  fill: string
  radius?: number
  border?: string
}

export interface CountdownElement extends ElementBase {
  type: 'countdown'
  target: string
  color: string
}

export interface ButtonElement extends ElementBase {
  type: 'button'
  label: string
  fill: string
  color: string
  radius?: number
}

export type InvitationElement = TextElement | ShapeElement | CountdownElement | ButtonElement

export interface InvitationPage {
  id: string
  title: string
  background: string
  elements: InvitationElement[]
}

export interface InvitationDocument {
  schema_version: 1
  pages: InvitationPage[]
}
