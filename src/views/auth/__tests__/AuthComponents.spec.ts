import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AuthAlert from '../AuthAlert.vue'
import AuthField from '../AuthField.vue'
import PasswordStrength from '../PasswordStrength.vue'

describe('AuthField', () => {
  it('TC-UI-F4-50: label terhubung ke input dan galat terhubung lewat aria-describedby dan live region', async () => {
    const wrapper = mount(AuthField, {
      props: { label: 'Email', id: 'f-email', modelValue: '', error: 'Format email tidak valid.' },
    })
    const input = wrapper.find('input')

    expect(wrapper.find('label').attributes('for')).toBe('f-email')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('f-email-error')
    expect(wrapper.find('#f-email-error').text()).toContain('Format email tidak valid.')
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)

    await wrapper.setProps({ error: '' })
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('TC-UI-F4-51: tombol tampilkan/sembunyikan hanya untuk kolom revealable dan mengganti tipe input', async () => {
    const plain = mount(AuthField, { props: { label: 'Nama', modelValue: '' } })
    expect(plain.find('button').exists()).toBe(false)
    expect(plain.find('input').attributes('spellcheck')).toBe('false')

    const wrapper = mount(AuthField, {
      props: { label: 'Kata sandi', type: 'password', revealable: true, modelValue: 'rahasia' },
    })
    expect(wrapper.find('input').attributes('type')).toBe('password')
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('text')
    expect(wrapper.find('button').attributes('aria-label')).toBe('Sembunyikan kata sandi')
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('TC-UI-F4-52: v-model dua arah dan focus() diekspos', async () => {
    const wrapper = mount(AuthField, {
      attachTo: document.body,
      props: {
        label: 'Email',
        modelValue: '',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    })

    await wrapper.find('input').setValue('a@contoh.test')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('a@contoh.test')
    wrapper.vm.focus()
    expect(document.activeElement).toBe(wrapper.find('input').element)
    wrapper.unmount()
  })
})

describe('AuthAlert', () => {
  it('TC-UI-F4-53: danger memakai role alert, nada lain role status', () => {
    expect(
      mount(AuthAlert, { props: { tone: 'danger' }, slots: { default: 'x' } }).attributes('role'),
    ).toBe('alert')
    for (const tone of ['warning', 'info', 'success'] as const) {
      const wrapper = mount(AuthAlert, { props: { tone }, slots: { default: 'x' } })
      expect(wrapper.attributes('role')).toBe('status')
      expect(wrapper.classes()).toContain(`nk-alert--${tone}`)
    }
  })
})

describe('PasswordStrength', () => {
  it('TC-UI-F4-54: tersembunyi saat kosong, empat segmen saat diisi, teks untuk pembaca layar', () => {
    expect(
      mount(PasswordStrength, { props: { value: '' } })
        .find('.nk-strength')
        .exists(),
    ).toBe(false)

    const wrapper = mount(PasswordStrength, { props: { value: 'Abcdefgh1' } })
    expect(wrapper.findAll('.nk-strength__bar')).toHaveLength(4)
    expect(wrapper.findAll('.is-on.is-strong')).toHaveLength(3)
    expect(wrapper.find('.nk-strength__bars').attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toContain('Kekuatan kata sandi: Kuat')
  })
})

describe('AuthLayout', () => {
  it('TC-UI-F4-55: punya landmark main, tautan lompat, dua logo ke beranda, dan panel brand', async () => {
    const stub = { template: '<div />' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'landing', component: stub }],
    })
    await router.push('/')
    document.body.classList.add('blank-page')
    const wrapper = mount(AuthLayout, {
      global: { plugins: [router] },
      slots: { default: '<p class="isi">form</p>' },
    })

    expect(wrapper.find('main#konten-utama .isi').text()).toBe('form')
    expect(wrapper.find('a.nk-skip').attributes('href')).toBe('#konten-utama')
    expect(wrapper.findAll('a.nk-logo')).toHaveLength(2)
    expect(wrapper.find('.nk-auth__brand').text()).toContain(
      'Undangan yang terasa seperti kalian berdua.',
    )
    expect(wrapper.find('.nk-auth__phone').attributes('aria-hidden')).toBe('true')
    expect(document.body.classList.contains('blank-page')).toBe(false)
  })
})
