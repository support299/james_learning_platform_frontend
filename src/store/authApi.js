import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from '../config'
import { logout } from './authSlice.js'

// Attaches the JWT access token (when present) to every request.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.access
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

// A 401 means the access token is missing/expired. Log out so RequireAuth
// (which watches auth.access) redirects to /login, instead of leaving each
// page to detect and handle an expired session on its own.
export const authBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    api.dispatch(logout())
  }
  return result
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: authBaseQuery,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query({
      query: () => 'auth/me/',
    }),
  }),
})

export const { useLoginMutation, useLazyGetMeQuery } = authApi
