import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppDialog from '../AppDialog.vue'

const stubs = { teleport: true }

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(AppDialog, {
    attachTo: document.body,
    props: { open: true, title: 'Judul dialog', description: 'Keterangan', ...props },
    slots: {
      default: '<input id="a" /><button id="b" type="button">B</button>',
      footer: '<button id="c" type="button">Simpan</button>',
    },
    global: { stubs },
  })
}

describe('AppDialog', () => {
  it('TC-UI-F3-25: memiliki role dialog, aria-modal, dan label judul serta deskripsi', async () => {
    const wrapper = mountDialog()
    await nextTick()
    const dialog = wrapper.find('[role="dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    const titleId = dialog.attributes('aria-labelledby')!
    expect(wrapper.find(`#${CSS.escape(titleId)}`).text()).toBe('Judul dialog')
    expect(dialog.attributes('aria-describedby')).toBeTruthy()
    expect(document.body.classList.contains('nk-modal-open')).toBe(true)
    wrapper.unmount()
    expect(document.body.classList.contains('nk-modal-open')).toBe(false)
  })

  it('TC-UI-F3-26: fokus awal ke kontrol pertama, Tab dan Shift+Tab terkurung di dalam dialog', async () => {
    const wrapper = mountDialog()
    await nextTick()
    await nextTick()
    expect(document.activeElement?.id).toBe('a')

    const panel = wrapper.find('[role="dialog"]')
    ;(document.getElementById('c') as HTMLElement).focus()
    await panel.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement?.getAttribute('data-dialog-close')).not.toBeNull()

    await panel.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement?.id).toBe('c')
    wrapper.unmount()
  })

  it('TC-UI-F3-27: Escape, tombol tutup, dan klik latar meminta penutupan', async () => {
    const wrapper = mountDialog()
    await nextTick()

    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    await wrapper.find('button[aria-label="Tutup"]').trigger('click')
    await wrapper.find('.nk-modal').trigger('mousedown')

    expect(wrapper.emitted('close')).toHaveLength(3)
    wrapper.unmount()
  })

  it('TC-UI-F3-28: saat busy, penutupan diblokir', async () => {
    const wrapper = mountDialog({ busy: true })
    await nextTick()

    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    await wrapper.find('.nk-modal').trigger('mousedown')

    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.find('button[aria-label="Tutup"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('TC-UI-F3-29: fokus kembali ke pemicu setelah dialog ditutup', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const wrapper = mountDialog()
    await nextTick()
    await nextTick()

    await wrapper.setProps({ open: false })
    await nextTick()

    expect(document.activeElement).toBe(trigger)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
    trigger.remove()
  })
})
