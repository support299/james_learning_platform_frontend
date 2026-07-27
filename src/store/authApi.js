import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from '../config'

// Attaches the JWT access token (when present) to every request.
export const authBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.access
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

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
