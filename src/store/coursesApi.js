import { createApi } from '@reduxjs/toolkit/query/react'
import { authBaseQuery } from './authApi.js'

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

// The completions endpoint returns a flat [{course, lesson, completed_at}].
// Reshape into { [courseId]: { [lessonId]: true } } for O(1) lookups.
function fromApiCompletions(rows) {
  const map = {}
  for (const row of rows) {
    ;(map[row.course] ??= {})[row.lesson] = true
  }
  return map
}

function fromApiVideoProgress(p) {
  return {
    provider: p.provider,
    externalId: p.external_id,
    durationSeconds: p.duration_seconds,
    maxWatchedSeconds: p.max_watched_seconds,
    focusedTimeSeconds: p.focused_time_seconds,
    updatedAt: p.updated_at,
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
  baseQuery: authBaseQuery,
  tagTypes: ['Course', 'Lesson', 'Completion', 'VideoProgress'],
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
    // --- Per-user lesson completions -----------------------------------
    getMyCompletions: builder.query({
      query: () => 'me/completions/',
      transformResponse: (res) => fromApiCompletions(res.results ?? res),
      providesTags: [{ type: 'Completion', id: 'LIST' }],
    }),
    setLessonComplete: builder.mutation({
      query: ({ courseId, lessonId, completed }) => ({
        url: `courses/${courseId}/lessons/${lessonId}/complete/`,
        method: completed ? 'POST' : 'DELETE',
      }),
      // Patch the cache up front so the checkmark and progress bars move on
      // click; both verbs are idempotent server-side, so a failure just rolls
      // the patch back rather than needing a refetch.
      async onQueryStarted(
        { courseId, lessonId, completed },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          coursesApi.util.updateQueryData(
            'getMyCompletions',
            undefined,
            (draft) => {
              if (completed) (draft[courseId] ??= {})[lessonId] = true
              else delete draft[courseId]?.[lessonId]
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
    // --- Per-embed video watch progress (a lesson can embed >1 video) --
    getVideoProgress: builder.query({
      query: ({ courseId, lessonId }) =>
        `courses/${courseId}/lessons/${lessonId}/video-progress/`,
      // Callers pass courseId/lessonId as both route-param strings (e.g.
      // LessonPage, straight from useParams) and numeric ids (e.g.
      // VideoProgressTracker, from course.id/lesson.id). Without this, RTK
      // Query's default arg serialization treats "12" and 12 as different
      // cache entries, so VideoProgressTracker's heartbeat patches would land
      // in a cache entry LessonPage never reads from, leaving its "Mark as
      // Complete" gate stuck at stale data until a full refetch.
      serializeQueryArgs: ({ queryArgs: { courseId, lessonId } }) =>
        `${courseId}:${lessonId}`,
      transformResponse: (res) => res.map(fromApiVideoProgress),
      providesTags: (result, error, { lessonId }) => [
        { type: 'VideoProgress', id: lessonId },
      ],
    }),
    reportVideoProgress: builder.mutation({
      query: ({
        courseId,
        lessonId,
        provider,
        externalId,
        currentTime,
        focusedDeltaSeconds,
        durationSeconds,
      }) => ({
        url: `courses/${courseId}/lessons/${lessonId}/video-progress/`,
        method: 'POST',
        body: {
          provider,
          external_id: externalId,
          current_time: currentTime,
          focused_delta_seconds: focusedDeltaSeconds,
          duration_seconds: durationSeconds,
        },
      }),
      transformResponse: fromApiVideoProgress,
      // Patch the one row that changed rather than invalidating, since
      // heartbeats fire every ~10s and a refetch per embed would be chatty.
      async onQueryStarted(
        { courseId, lessonId, provider, externalId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            coursesApi.util.updateQueryData(
              'getVideoProgress',
              { courseId, lessonId },
              (draft) => {
                const i = draft.findIndex(
                  (p) => p.provider === provider && p.externalId === externalId,
                )
                if (i >= 0) draft[i] = data
                else draft.push(data)
              },
            ),
          )
        } catch {
          // Heartbeat failures aren't user-visible; the next tick retries.
        }
      },
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
  useGetMyCompletionsQuery,
  useSetLessonCompleteMutation,
  useGetVideoProgressQuery,
  useReportVideoProgressMutation,
} = coursesApi
