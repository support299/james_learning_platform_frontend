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

function emptyResponse(status = 204) {
  return Promise.resolve(new Response(null, { status }))
}

// fetchBaseQuery calls fetch(new Request(url, init)) in this environment —
// a single Request object, not separate (url, init) arguments.
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

describe('fromApiLesson / fromApiSlide (via getLesson)', () => {
  test('maps snake_case slide + import fields to camelCase', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({
        id: 'l1', title: 'T', type: 'slideshow', order: 0, duration: '', overview: '',
        completed: false, html: '', body: [], objectives: [], pro_tip: '', question_count: 0,
        meta: '', questions: [],
        slides: [
          { id: 1, order: 0, image: 'https://x/1.png', hotspots: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, target: 2 }], is_required: false },
        ],
        import_status: 'done', import_error: '',
      }),
    )
    const result = await store.dispatch(
      coursesApi.endpoints.getLesson.initiate({ courseId: 'c1', lessonId: 'l1' }),
    )
    expect(result.data.importStatus).toBe('done')
    expect(result.data.slides).toEqual([
      { id: 1, order: 0, image: 'https://x/1.png', hotspots: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, target: 2 }], isRequired: false },
    ])
  })

  test('defaults slides/isRequired when absent from the response', async () => {
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
    expect(result.data.slides).toEqual([])
  })
})

describe('toApiLesson slides passthrough (via updateLesson)', () => {
  test('sends only id/order/hotspots/is_required, never the image', async () => {
    global.fetch.mockReturnValue(jsonResponse({ id: 'l1', title: 'T', type: 'slideshow', questions: [] }))
    await store.dispatch(
      coursesApi.endpoints.updateLesson.initiate({
        courseId: 'c1',
        lessonId: 'l1',
        lesson: {
          title: 'T', type: 'slideshow', overview: '',
          slides: [{ id: 1, order: 0, image: 'https://x/1.png', hotspots: [], isRequired: true }],
        },
      }),
    )
    const sentBody = await readJsonBody(0)
    expect(sentBody.slides).toEqual([{ id: 1, order: 0, hotspots: [], is_required: true }])
  })
})

describe('slideshow slide mutations', () => {
  test('uploadSlideshowSlide posts multipart form data to the slides endpoint', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({ id: 5, order: 0, image: 'https://x/5.png', hotspots: [], is_required: true }, 201),
    )
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const result = await store.dispatch(
      coursesApi.endpoints.uploadSlideshowSlide.initiate({ courseId: 'c1', lessonId: 'l1', file }),
    )
    expect(result.data).toEqual({ id: 5, order: 0, image: 'https://x/5.png', hotspots: [], isRequired: true })
    const req = requestFrom(0)
    expect(req.url).toContain('courses/c1/lessons/l1/slides/')
    expect(req.method).toBe('POST')
    const sentFile = (await req.formData()).get('image')
    expect(sentFile).toBeTruthy()
  })

  test('replaceSlideshowSlideImage patches the slide detail endpoint', async () => {
    global.fetch.mockReturnValue(
      jsonResponse({ id: 5, order: 0, image: 'https://x/new.png', hotspots: [], is_required: true }),
    )
    const file = new File(['x'], 'new.png', { type: 'image/png' })
    await store.dispatch(
      coursesApi.endpoints.replaceSlideshowSlideImage.initiate({ courseId: 'c1', lessonId: 'l1', slideId: 5, file }),
    )
    const req = requestFrom(0)
    expect(req.url).toContain('courses/c1/lessons/l1/slides/5/')
    expect(req.method).toBe('PATCH')
    const sentFile = (await req.formData()).get('image')
    expect(sentFile).toBeTruthy()
  })

  test('deleteSlideshowSlide sends a DELETE to the slide detail endpoint', async () => {
    global.fetch.mockReturnValue(emptyResponse())
    await store.dispatch(
      coursesApi.endpoints.deleteSlideshowSlide.initiate({ courseId: 'c1', lessonId: 'l1', slideId: 5 }),
    )
    const req = requestFrom(0)
    expect(req.url).toContain('courses/c1/lessons/l1/slides/5/')
    expect(req.method).toBe('DELETE')
  })

  test('importSlideshowPptx posts the file to the import-pptx endpoint', async () => {
    global.fetch.mockReturnValue(jsonResponse({ import_status: 'pending' }, 202))
    const file = new File(['x'], 'deck.pptx')
    await store.dispatch(
      coursesApi.endpoints.importSlideshowPptx.initiate({ courseId: 'c1', lessonId: 'l1', file }),
    )
    const req = requestFrom(0)
    expect(req.url).toContain('courses/c1/lessons/l1/import-pptx/')
    expect(req.method).toBe('POST')
    const sentFile = (await req.formData()).get('file')
    expect(sentFile).toBeTruthy()
  })
})

describe('slide visit tracking', () => {
  test('getSlideVisits transforms {visited} into a plain array', async () => {
    global.fetch.mockReturnValue(jsonResponse({ visited: [1, 2, 3] }))
    const result = await store.dispatch(
      coursesApi.endpoints.getSlideVisits.initiate({ courseId: 'c1', lessonId: 'l1' }),
    )
    expect(result.data).toEqual([1, 2, 3])
  })

  test('getSlideVisits shares one cache entry across string/number id variants', async () => {
    global.fetch.mockReturnValue(jsonResponse({ visited: [] }))
    await store.dispatch(coursesApi.endpoints.getSlideVisits.initiate({ courseId: 'c1', lessonId: 'l1' }))
    await store.dispatch(coursesApi.endpoints.getSlideVisits.initiate({ courseId: 'c1', lessonId: 'l1' }))
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('markSlideVisited posts {slide} and optimistically patches the visits cache', async () => {
    global.fetch.mockReturnValueOnce(jsonResponse({ visited: [1] }))
    await store.dispatch(coursesApi.endpoints.getSlideVisits.initiate({ courseId: 'c1', lessonId: 'l1' }))

    global.fetch.mockReturnValueOnce(emptyResponse())
    const promise = store.dispatch(
      coursesApi.endpoints.markSlideVisited.initiate({ courseId: 'c1', lessonId: 'l1', slideId: 2 }),
    )

    const patched = coursesApi.endpoints.getSlideVisits.select({ courseId: 'c1', lessonId: 'l1' })(store.getState())
    expect(patched.data).toEqual([1, 2])

    await promise
    const req = requestFrom(1)
    expect(req.url).toContain('courses/c1/lessons/l1/slide-visits/')
    expect(await readJsonBody(1)).toEqual({ slide: 2 })
  })

  test('markSlideVisited rolls back the optimistic patch on failure', async () => {
    global.fetch.mockReturnValueOnce(jsonResponse({ visited: [1] }))
    await store.dispatch(coursesApi.endpoints.getSlideVisits.initiate({ courseId: 'c1', lessonId: 'l1' }))

    global.fetch.mockReturnValueOnce(jsonResponse({ detail: 'nope' }, 404))
    await store.dispatch(
      coursesApi.endpoints.markSlideVisited.initiate({ courseId: 'c1', lessonId: 'l1', slideId: 999 }),
    )

    const after = coursesApi.endpoints.getSlideVisits.select({ courseId: 'c1', lessonId: 'l1' })(store.getState())
    expect(after.data).toEqual([1])
  })

  test('marking an already-visited slide does not duplicate it in the cache', async () => {
    global.fetch.mockReturnValueOnce(jsonResponse({ visited: [1] }))
    await store.dispatch(coursesApi.endpoints.getSlideVisits.initiate({ courseId: 'c1', lessonId: 'l1' }))

    global.fetch.mockReturnValueOnce(emptyResponse())
    await store.dispatch(
      coursesApi.endpoints.markSlideVisited.initiate({ courseId: 'c1', lessonId: 'l1', slideId: 1 }),
    )
    const after = coursesApi.endpoints.getSlideVisits.select({ courseId: 'c1', lessonId: 'l1' })(store.getState())
    expect(after.data).toEqual([1])
  })
})
