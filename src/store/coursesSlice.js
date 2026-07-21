import { createSlice } from '@reduxjs/toolkit'
import { courses as seedCourses } from '../data/courses.js'

export const STORAGE_KEY = 'agentgrowth-courses'

function loadCourses() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    // corrupted/absent storage — fall back to seed data
  }
  return seedCourses
}

const list = loadCourses()

// completed: { [courseId]: { [lessonId]: true } }, seeded from the course data
const initialCompleted = {}
for (const course of list) {
  initialCompleted[course.id] = {}
  for (const lesson of course.lessons) {
    if (lesson.completed) initialCompleted[course.id][lesson.id] = true
  }
}

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    list,
    completed: initialCompleted,
  },
  reducers: {
    toggleLessonComplete(state, action) {
      const { courseId, lessonId } = action.payload
      const done = state.completed[courseId] ?? (state.completed[courseId] = {})
      if (done[lessonId]) delete done[lessonId]
      else done[lessonId] = true
    },
    addCourse(state, action) {
      const { id, title, category, description, updatedAt } = action.payload
      state.list.push({
        id,
        updatedAt,
        title,
        category,
        description,
        rating: 0,
        ratingCount: '0',
        meta: 'New',
        cta: 'Start Learning',
        isCustom: true,
        lessons: [],
      })
    },
    addLesson(state, action) {
      const { courseId, lesson, updatedAt } = action.payload
      const course = state.list.find((c) => c.id === courseId)
      if (course) {
        course.lessons.push(lesson)
        course.updatedAt = updatedAt
      }
    },
    updateLesson(state, action) {
      const { courseId, lessonId, lesson } = action.payload
      const course = state.list.find((c) => c.id === courseId)
      if (!course) return
      const index = course.lessons.findIndex((l) => l.id === lessonId)
      if (index === -1) return
      // Replace so type changes (e.g. legacy video → rich text) don't leave
      // stale fields behind. The id is preserved to keep links stable.
      course.lessons[index] = { ...lesson, id: lessonId }
      course.updatedAt = new Date().toISOString()
    },
    updateCourse(state, action) {
      const { courseId, title, category, description } = action.payload
      const course = state.list.find((c) => c.id === courseId)
      if (course) {
        course.title = title
        course.category = category
        course.description = description
        course.updatedAt = new Date().toISOString()
      }
    },
    reorderLessons(state, action) {
      const { courseId, from, to } = action.payload
      const course = state.list.find((c) => c.id === courseId)
      if (!course) return
      const { lessons } = course
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= lessons.length ||
        to >= lessons.length
      )
        return
      const [moved] = lessons.splice(from, 1)
      lessons.splice(to, 0, moved)
      course.updatedAt = new Date().toISOString()
    },
    deleteLesson(state, action) {
      const { courseId, lessonId } = action.payload
      const course = state.list.find((c) => c.id === courseId)
      if (!course) return
      course.lessons = course.lessons.filter((l) => l.id !== lessonId)
      course.updatedAt = new Date().toISOString()
      const done = state.completed[courseId]
      if (done) delete done[lessonId]
    },
    deleteCourse(state, action) {
      const courseId = action.payload
      state.list = state.list.filter((c) => c.id !== courseId)
      delete state.completed[courseId]
    },
  },
})

export const {
  toggleLessonComplete,
  addCourse,
  addLesson,
  updateLesson,
  updateCourse,
  reorderLessons,
  deleteLesson,
  deleteCourse,
} = coursesSlice.actions

export const selectCourses = (state) => state.courses.list

export const selectCourseById = (state, courseId) =>
  state.courses.list.find((c) => c.id === courseId)

export const selectCompletedForCourse = (state, courseId) =>
  state.courses.completed[courseId] ?? {}

export const selectCourseProgress = (state, course) => {
  const done = selectCompletedForCourse(state, course.id)
  return Math.round(
    (Object.keys(done).length / Math.max(course.lessons.length, 1)) * 100,
  )
}

export default coursesSlice.reducer
