import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSignupStore } from '../signup'

describe('useSignupStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
  })

  it('TC-UI-F4-09: menyimpan email hanya di memori dan tidak menyentuh storage', () => {
    const store = useSignupStore()
    expect(store.pendingEmail).toBeNull()

    store.remember('hilda@contoh.test')

    expect(store.pendingEmail).toBe('hilda@contoh.test')
    expect(sessionStorage.length).toBe(0)
    expect(JSON.stringify({ ...localStorage })).not.toContain('hilda')
    expect(window.location.href).not.toContain('hilda')

    store.forget()
    expect(store.pendingEmail).toBeNull()
  })

  it('TC-UI-F4-10: store baru (halaman dimuat ulang) tidak mengingat email', () => {
    useSignupStore().remember('hilda@contoh.test')

    setActivePinia(createPinia())

    expect(useSignupStore().pendingEmail).toBeNull()
  })
})
