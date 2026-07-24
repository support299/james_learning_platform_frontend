import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Point at the Django API. Override with VITE_API_URL in a .env file if needed.
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

// --- Adapters: the API speaks snake_case; the frontend uses camelCase. ---

function fromApiLessonSummary(l) {
  return {
    id: l.id,
    title: l.title,
    type: l.type,
    order: l.order,
    duration: l.duration,
    questionCount: l.question_count,
  }
}

function fromApiLesson(l) {
  return {
    id: l.id,
    title: l.title,
    type: l.type,
    order: l.order,
    duration: l.duration,
    overview: l.overview,
    completed: l.completed,
    html: l.html,
    body: l.body,
    objectives: l.objectives,
    proTip: l.pro_tip,
    questionCount: l.question_count,
    meta: l.meta,
    questions: l.questions ?? [],
  }
}

function fromApiCourse(c) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    isCustom: c.is_custom,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    lessonCount: c.lesson_count,
    lessons: (c.lessons ?? []).map(fromApiLessonSummary),
  }
}

// Strip camelCase-only keys and rename the ones the API expects.
function toApiLesson(d) {
  const body = { title: d.title, type: d.type }
  if (d.duration !== undefined) body.duration = d.duration
  if (d.overview !== undefined) body.overview = d.overview
  if (d.html !== undefined) body.html = d.html
  if (d.questions !== undefined) body.questions = d.questions
  if (d.meta !== undefined) body.meta = d.meta
  return body
}

export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ['Course', 'Lesson'],
  endpoints: (builder) => ({
    // --- Courses -------------------------------------------------------
    getCourses: builder.query({
      query: () => 'courses/',
      transformResponse: (res) => (res.results ?? res).map(fromApiCourse),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Course', id: c.id })),
              { type: 'Course', id: 'LIST' },
            ]
          : [{ type: 'Course', id: 'LIST' }],
    }),
    getCourse: builder.query({
      query: (id) => `courses/${id}/`,
      transformResponse: fromApiCourse,
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),
    createCourse: builder.mutation({
      query: ({ title, description }) => ({
        url: 'courses/',
        method: 'POST',
        body: { title, description },
      }),
      transformResponse: fromApiCourse,
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),
    updateCourse: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `courses/${id}/`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: fromApiCourse,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Course', id },
        { type: 'Course', id: 'LIST' },
      ],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({ url: `courses/${id}/`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Course', id },
        { type: 'Course', id: 'LIST' },
      ],
    }),
    reorderLessons: builder.mutation({
      query: ({ courseId, lessonIds }) => ({
        url: `courses/${courseId}/reorder/`,
        method: 'POST',
        body: { lessons: lessonIds },
      }),
      transformResponse: fromApiCourse,
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Course', id: courseId },
      ],
    }),
    // --- Lessons (nested under a course) -------------------------------
    getLesson: builder.query({
      query: ({ courseId, lessonId }) =>
        `courses/${courseId}/lessons/${lessonId}/`,
      transformResponse: fromApiLesson,
      providesTags: (result, error, { lessonId }) => [
        { type: 'Lesson', id: lessonId },
      ],
    }),
    createLesson: builder.mutation({
      query: ({ courseId, lesson }) => ({
        url: `courses/${courseId}/lessons/`,
        method: 'POST',
        body: toApiLesson(lesson),
      }),
      transformResponse: fromApiLesson,
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Course', id: courseId },
        { type: 'Course', id: 'LIST' },
      ],
    }),
    updateLesson: builder.mutation({
      query: ({ courseId, lessonId, lesson }) => ({
        url: `courses/${courseId}/lessons/${lessonId}/`,
        method: 'PATCH',
        body: toApiLesson(lesson),
      }),
      transformResponse: fromApiLesson,
      invalidatesTags: (result, error, { courseId, lessonId }) => [
        { type: 'Course', id: courseId },
        { type: 'Lesson', id: lessonId },
      ],
    }),
    deleteLesson: builder.mutation({
      query: ({ courseId, lessonId }) => ({
        url: `courses/${courseId}/lessons/${lessonId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Course', id: courseId },
        { type: 'Course', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useReorderLessonsMutation,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
} = coursesApi
