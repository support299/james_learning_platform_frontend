import { createSlice } from '@reduxjs/toolkit'

export const AUTH_KEY = 'agentgrowth-auth'

function loadAuth() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_KEY))
    if (parsed && parsed.access) return parsed
  } catch {
    // corrupted/absent storage — start logged out
  }
  return { user: null, access: null, refresh: null }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadAuth(),
  reducers: {
    setCredentials(state, action) {
      const { user, access, refresh } = action.payload
      if (user !== undefined) state.user = user
      if (access !== undefined) state.access = access
      if (refresh !== undefined) state.refresh = refresh
    },
    setUser(state, action) {
      state.user = action.payload
    },
    logout(state) {
      state.user = null
      state.access = null
      state.refresh = null
    },
  },
})

export const { setCredentials, setUser, logout } = authSlice.actions

export const selectIsAuthenticated = (state) => Boolean(state.auth.access)
export const selectCurrentUser = (state) => state.auth.user
export const selectIsStaff = (state) => Boolean(state.auth.user?.is_staff)
// Sessions stored before /me returned is_staff have no flag to judge by; the
// admin gate waits for a fresh /me rather than bouncing the user out.
export const selectStaffKnown = (state) =>
  state.auth.user?.is_staff !== undefined

export default authSlice.reducer
