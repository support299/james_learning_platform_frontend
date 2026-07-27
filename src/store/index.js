import { configureStore } from '@reduxjs/toolkit'
import filtersReducer from './filtersSlice.js'
import authReducer, { AUTH_KEY } from './authSlice.js'
import { coursesApi } from './coursesApi.js'
import { authApi } from './authApi.js'

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    auth: authReducer,
    [coursesApi.reducerPath]: coursesApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(coursesApi.middleware, authApi.middleware),
})

let lastAuth = store.getState().auth
store.subscribe(() => {
  const state = store.getState()
  if (state.auth !== lastAuth) {
    lastAuth = state.auth
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(state.auth))
    } catch {
      // ignore — auth will simply not persist across reloads
    }
  }
})
