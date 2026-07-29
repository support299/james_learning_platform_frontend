import { createApi } from '@reduxjs/toolkit/query/react'
import { authBaseQuery } from './authApi.js'

// GHL returns camelCase already; this trims it to what the picker shows.
// The name halves fill each other in either direction, because the student
// form autofills First/Last Name from whichever the GHL user carries.
function fromApiGhlUser(u) {
  const [first, ...rest] = (u.name || '').trim().split(/\s+/)
  return {
    id: u.id,
    name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' '),
    firstName: u.firstName || first || '',
    lastName: u.lastName || rest.join(' '),
    email: u.email || '',
    phone: u.phone || '',
    role: u.roles?.role || '',
  }
}

export const ghlApi = createApi({
  reducerPath: 'ghlApi',
  baseQuery: authBaseQuery,
  endpoints: (builder) => ({
    // Staff-only, and proxied through our backend — the GHL token never
    // reaches the browser. An empty query lists the sub-account's users.
    searchGhlUsers: builder.query({
      query: (query = '') =>
        query
          ? `ghl/users/search/?query=${encodeURIComponent(query)}`
          : 'ghl/users/search/',
      transformResponse: (res) => (res.users ?? []).map(fromApiGhlUser),
      // Typing back and forth over the same few letters shouldn't re-hit GHL.
      keepUnusedDataFor: 120,
    }),
  }),
})

export const { useSearchGhlUsersQuery } = ghlApi
