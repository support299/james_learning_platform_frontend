import { describe, test, expect } from 'vitest'
import reducer, {
  setCredentials,
  setUser,
  logout,
  selectIsSuperadmin,
  selectSuperadminKnown,
} from '../../store/authSlice.js'

const wrap = (auth) => ({ auth })
const empty = { user: null, access: null, refresh: null }

describe('superadmin state', () => {
  test('unknown until a login payload or /me says otherwise', () => {
    expect(selectSuperadminKnown(wrap(empty))).toBe(false)
    expect(selectIsSuperadmin(wrap(empty))).toBe(false)
  })

  test('login payload sets it', () => {
    const state = reducer(empty, setCredentials({ access: 'a', is_superadmin: true }))
    expect(selectIsSuperadmin(wrap(state))).toBe(true)
    expect(selectSuperadminKnown(wrap(state))).toBe(true)
  })

  test('/me refresh sets and can clear it', () => {
    let state = reducer(empty, setUser({ id: 1, is_superuser: true }))
    expect(selectIsSuperadmin(wrap(state))).toBe(true)
    state = reducer(state, setUser({ id: 1, is_superuser: false }))
    expect(selectIsSuperadmin(wrap(state))).toBe(false)
  })

  test('logout clears it', () => {
    const state = reducer(
      { ...empty, isSuperadmin: true },
      logout(),
    )
    expect(selectIsSuperadmin(wrap(state))).toBe(false)
  })
})
