import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ConfirmTypeDialog from '../ConfirmTypeDialog.vue'

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(ConfirmTypeDialog, {
    attachTo: document.body,
    props: {
      open: true,
      title: 'Hapus “Floral Blush” permanen?',
      description: 'Tidak bisa dibatalkan.',
      expected: 'Floral Blush',
      confirmLabel: 'Hapus permanen',
      ...props,
    },
    global: { stubs: { teleport: true } },
  })
}

describe('ConfirmTypeDialog', () => {
  it('TC-UI-F3-36: tombol aktif hanya saat nama diketik persis', async () => {
    const wrapper = mountDialog()
    await nextTick()
    const submit = wrapper.find('button[type="submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.find('input').setValue('floral blush')
    expect(submit.attributes('disabled')).toBeDefined()
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')

    await wrapper.find('input').setValue('Floral Blush')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    wrapper.unmount()
  })

  it('TC-UI-F3-37: aturan bisnis (blocked) dan busy mencegah konfirmasi', async () => {
    const blocked = mountDialog({ blocked: true })
    await nextTick()
    await blocked.find('input').setValue('Floral Blush')
    expect(blocked.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    await blocked.find('form').trigger('submit')
    expect(blocked.emitted('confirm')).toBeUndefined()
    blocked.unmount()

    const busy = mountDialog({ busy: true })
    await nextTick()
    expect(busy.find('button[type="submit"]').text()).toContain('Menghapus')
    busy.unmount()
  })

  it('TC-UI-F3-38: menampilkan galat, mengosongkan isian saat dibuka ulang, dan Batal menutup', async () => {
    const wrapper = mountDialog({ error: 'Template ini dipakai undangan.' })
    await nextTick()
    expect(wrapper.find('[role="alert"]').text()).toContain('dipakai undangan')

    await wrapper.find('input').setValue('Floral Blush')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await nextTick()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Batal')!
      .trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
