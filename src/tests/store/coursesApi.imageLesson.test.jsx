import { describe, test, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../../store/authSlice.js'
import { coursesApi } from '../../store/coursesApi.js'

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [coursesApi.reducerPath]: coursesApi.reducer },
    middleware: (getDefault) => getDefault().concat(coursesApi.middleware),
  })
}

function jsonResponse(body, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
}

function requestFrom(callIndex) {
  return global.fetch.mock.calls[callIndex][0]
}
async function readJsonBody(callIndex) {
  return requestFrom(callIndex).clone().json()
}

let store

beforeEach(() => {
  store = makeStore()
  global.fetch = vi.fn()
})

describe('fromApiLesson image/hotspots (via getLesson)', () => {
  test('maps image url and hotspot targets through unchanged', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({
        id: 'slide-1', title: 'Slide 1', type: 'image', order: 0, duration: '', overview: '',
        completed: false, html: '', body: [], objectives: [], pro_tip: '', question_count: 0,
        meta: '', questions: [], slides: [],
        image: 'https://x/slide-1.png',
        hotspots: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, target: 'slide-2' }],
        import_status: 'idle', import_error: '',
      }),
    )
    const result = await store.dispatch(
      coursesApi.endpoints.getLesson.initiate({ courseId: 'c1', lessonId: 'slide-1' }),
    )
    expect(result.data.image).toBe('https://x/slide-1.png')
    expect(result.data.hotspots).toEqual([{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, target: 'slide-2' }])
  })

  test('defaults hotspots to [] when absent', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({
        id: 'l1', title: 'T', type: 'text', order: 0, duration: '', overview: '',
        completed: false, html: '', body: [], objectives: [], pro_tip: '', question_count: 0,
        meta: '', questions: [],
      }),
    )
    const result = await store.dispatch(
      coursesApi.endpoints.getLesson.initiate({ courseId: 'c1', lessonId: 'l1' }),
    )
    expect(result.data.hotspots).toEqual([])
  })
})

describe('fromApiCourse import status', () => {
  test('maps course-level import_status/import_error', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({
        id: 'c1', title: 'C1', description: '', is_custom: true,
        lesson_count: 0, lessons: [], created_at: '', updated_at: '',
        import_status: 'pending', import_error: '',
      }),
    )
    const result = await store.dispatch(coursesApi.endpoints.getCourse.initiate('c1'))
    expect(result.data.importStatus).toBe('pending')
  })
})

describe('fromApiLessonSummary hotspot_count', () => {
  test('maps hotspot_count to hotspotCount', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({
        id: 'c1', title: 'C1', description: '', is_custom: true,
        lesson_count: 1, created_at: '', updated_at: '',
        lessons: [{ id: 'slide-1', title: 'Slide 1', type: 'image', order: 0, duration: '', question_count: 0, hotspot_count: 2 }],
      }),
    )
    const result = await store.dispatch(coursesApi.endpoints.getCourse.initiate('c1'))
    expect(result.data.lessons[0].hotspotCount).toBe(2)
  })
})

describe('toApiLesson hotspots passthrough (via updateLesson)', () => {
  test('sends hotspots verbatim for an image lesson', async () => {
    global.fetch.mockReturnValue(jsonResponse({ id: 'slide-1', title: 'T', type: 'image', questions: [] }))
    await store.dispatch(
      coursesApi.endpoints.updateLesson.initiate({
        courseId: 'c1',
        lessonId: 'slide-1',
        lesson: {
          title: 'T', type: 'image', overview: '',
          hotspots: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, target: 'slide-2' }],
        },
      }),
    )
    const sentBody = await readJsonBody(0)
    expect(sentBody.hotspots).toEqual([{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, target: 'slide-2' }])
  })

  test('omits hotspots entirely when undefined', async () => {
    global.fetch.mockReturnValue(jsonResponse({ id: 'l1', title: 'T', type: 'text', questions: [] }))
    await store.dispatch(
      coursesApi.endpoints.updateLesson.initiate({
        courseId: 'c1', lessonId: 'l1', lesson: { title: 'T', type: 'text' },
      }),
    )
    const sentBody = await readJsonBody(0)
    expect('hotspots' in sentBody).toBe(false)
  })
})

describe('course pptx import mutation', () => {
  test('importCoursePptx posts mode + file as multipart', async () => {
    global.fetch.mockReturnValue(jsonResponse({ import_status: 'pending' }, 202))
    const file = new File(['x'], 'deck.pptx')
    await store.dispatch(
      coursesApi.endpoints.importCoursePptx.initiate({ courseId: 'c1', mode: 'lesson', file }),
    )
    const req = requestFrom(0)
    expect(req.url).toContain('courses/c1/import-pptx/')
    expect(req.method).toBe('POST')
    const form = await req.formData()
    expect(form.get('mode')).toBe('lesson')
    expect(form.get('file')).toBeTruthy()
  })
})

describe('image lesson image replace mutation', () => {
  test('replaceImageLessonImage patches the lesson image endpoint', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({
        id: 'slide-1', title: 'T', type: 'image', order: 0, duration: '', overview: '',
        completed: false, html: '', body: [], objectives: [], pro_tip: '', question_count: 0,
        meta: '', questions: [], slides: [], image: 'https://x/new.png', hotspots: [],
        import_status: 'idle', import_error: '',
      }),
    )
    const file = new File(['x'], 'new.png', { type: 'image/png' })
    const result = await store.dispatch(
      coursesApi.endpoints.replaceImageLessonImage.initiate({ courseId: 'c1', lessonId: 'slide-1', file }),
    )
    const req = requestFrom(0)
    expect(req.url).toContain('courses/c1/lessons/slide-1/image/')
    expect(req.method).toBe('PATCH')
    expect(result.data.image).toBe('https://x/new.png')
  })
})
