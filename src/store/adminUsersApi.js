import { createApi } from '@reduxjs/toolkit/query/react'
import { authBaseQuery } from './authApi.js'
import { studentsApi } from './studentsApi.js'

function fromApiAdminUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    isActive: u.is_active,
    isSuperuser: u.is_superuser,
    dateJoined: u.date_joined,
    lastLogin: u.last_login,
  }
}

// Promoting/demoting moves an account between the Students and Admin lists.
async function refreshStudents(arg, { dispatch, queryFulfilled }) {
  try {
    await queryFulfilled
    dispatch(studentsApi.util.invalidateTags([{ type: 'Student', id: 'LIST' }]))
  } catch {
    // Request failed; nothing moved between lists.
  }
}

function toApiAdminUser(d) {
  const body = {}
  if (d.username !== undefined) body.username = d.username
  if (d.email !== undefined) body.email = d.email
  if (d.firstName !== undefined) body.first_name = d.firstName
  if (d.lastName !== undefined) body.last_name = d.lastName
  if (d.isActive !== undefined) body.is_active = d.isActive
  if (d.isSuperuser !== undefined) body.is_superuser = d.isSuperuser
  if (d.password) body.password = d.password
  return body
}

export const adminUsersApi = createApi({
  reducerPath: 'adminUsersApi',
  baseQuery: authBaseQuery,
  tagTypes: ['AdminUser'],
  endpoints: (builder) => ({
    getAdminUsers: builder.query({
      query: (search = '') =>
        search
          ? `auth/admins/?search=${encodeURIComponent(search)}`
          : 'auth/admins/',
      transformResponse: (res) => (res.results ?? res).map(fromApiAdminUser),
      providesTags: [{ type: 'AdminUser', id: 'LIST' }],
    }),
    createAdminUser: builder.mutation({
      query: (user) => ({
        url: 'auth/admins/',
        method: 'POST',
        body: toApiAdminUser(user),
      }),
      transformResponse: fromApiAdminUser,
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }],
    }),
    updateAdminUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `auth/admins/${id}/`,
        method: 'PATCH',
        body: toApiAdminUser(patch),
      }),
      transformResponse: fromApiAdminUser,
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }],
    }),
    deleteAdminUser: builder.mutation({
      query: (id) => ({ url: `auth/admins/${id}/`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }],
    }),
    promoteToStaff: builder.mutation({
      query: (userId) => ({
        url: 'auth/admins/promote/',
        method: 'POST',
        body: { user_id: userId },
      }),
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }],
      onQueryStarted: refreshStudents,
    }),
    demoteFromStaff: builder.mutation({
      query: (id) => ({ url: `auth/admins/${id}/demote/`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }],
      onQueryStarted: refreshStudents,
    }),
  }),
})

export const {
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  usePromoteToStaffMutation,
  useDemoteFromStaffMutation,
} = adminUsersApi
