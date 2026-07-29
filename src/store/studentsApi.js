import { createApi } from '@reduxjs/toolkit/query/react'
import { authBaseQuery } from './authApi.js'

// --- Adapters: the API speaks snake_case; the frontend uses camelCase. ---

function fromApiStudent(s) {
  return {
    id: s.id,
    username: s.username,
    email: s.email,
    firstName: s.first_name,
    lastName: s.last_name,
    isActive: s.is_active,
    dateJoined: s.date_joined,
    lastLogin: s.last_login,
    // The linked GoHighLevel user, or null when the student isn't linked.
    ghlUser: s.ghl_user
      ? {
          id: s.ghl_user.ghl_id,
          name: s.ghl_user.name,
          email: s.ghl_user.email,
          role: s.ghl_user.role,
        }
      : null,
  }
}

function fromApiEnrollment(e) {
  return {
    courseId: e.course,
    title: e.title,
    assignedAt: e.assigned_at,
    assignedBy: e.assigned_by,
  }
}

// Only send the keys the caller actually set, so a PATCH of one field
// doesn't blank the rest.
function toApiStudent(d) {
  const body = {}
  if (d.username !== undefined) body.username = d.username
  if (d.email !== undefined) body.email = d.email
  if (d.firstName !== undefined) body.first_name = d.firstName
  if (d.lastName !== undefined) body.last_name = d.lastName
  if (d.isActive !== undefined) body.is_active = d.isActive
  if (d.password) body.password = d.password
  // '' is meaningful here — it unlinks the GHL user — so send it through.
  if (d.ghlUserId !== undefined) body.ghl_user_id = d.ghlUserId
  return body
}

export const studentsApi = createApi({
  reducerPath: 'studentsApi',
  baseQuery: authBaseQuery,
  tagTypes: ['Student', 'Assignment'],
  endpoints: (builder) => ({
    getStudents: builder.query({
      query: (search = '') =>
        search ? `auth/students/?search=${encodeURIComponent(search)}` : 'auth/students/',
      transformResponse: (res) => (res.results ?? res).map(fromApiStudent),
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'Student', id: s.id })),
              { type: 'Student', id: 'LIST' },
            ]
          : [{ type: 'Student', id: 'LIST' }],
    }),
    getStudent: builder.query({
      query: (id) => `auth/students/${id}/`,
      transformResponse: fromApiStudent,
      providesTags: (result, error, id) => [{ type: 'Student', id }],
    }),
    // --- Course assignments --------------------------------------------
    getStudentCourses: builder.query({
      query: (id) => `auth/students/${id}/courses/`,
      transformResponse: (res) => res.map(fromApiEnrollment),
      providesTags: (result, error, id) => [{ type: 'Assignment', id }],
    }),
    // The payload is the full desired set: anything left out is unassigned.
    setStudentCourses: builder.mutation({
      query: ({ id, courseIds }) => ({
        url: `auth/students/${id}/courses/`,
        method: 'PUT',
        body: { courses: courseIds },
      }),
      transformResponse: (res) => res.map(fromApiEnrollment),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Assignment', id },
      ],
    }),
    createStudent: builder.mutation({
      query: (student) => ({
        url: 'auth/students/',
        method: 'POST',
        body: toApiStudent(student),
      }),
      transformResponse: fromApiStudent,
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `auth/students/${id}/`,
        method: 'PATCH',
        body: toApiStudent(patch),
      }),
      transformResponse: fromApiStudent,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Student', id },
        { type: 'Student', id: 'LIST' },
      ],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({ url: `auth/students/${id}/`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Student', id },
        { type: 'Student', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useGetStudentCoursesQuery,
  useSetStudentCoursesMutation,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi
