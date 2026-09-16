import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ImageLessonEditorPage from '../../pages/ImageLessonEditorPage.jsx'

const mockUseParams = vi.fn()
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../components/SiteHeader.jsx', () => ({
  default: () => <div data-testid="site-header" />,
}))

const mockGetCourse = vi.fn()
const mockGetLesson = vi.fn()
const updateLessonTrigger = vi.fn()
const replaceImageTrigger = vi.fn()

const mockUpdateLessonState = { isLoading: false }
const mockReplaceImageState = { isLoading: false }

vi.mock('../../store/coursesApi.js', () => ({
  useGetCourseQuery: (...args) => mockGetCourse(...args),
  useGetLessonQuery: (...args) => mockGetLesson(...args),
  useUpdateLessonMutation: () => [updateLessonTrigger, mockUpdateLessonState],
  useReplaceImageLessonImageMutation: () => [replaceImageTrigger, mockReplaceImageState],
}))

const COURSE = {
  id: 'course1',
  title: 'Course One',
  lessons: [
    { id: 'slide-1', title: 'Slide 1', type: 'image' },
    { id: 'slide-2', title: 'Slide 2', type: 'image' },
    { id: 'quiz-1', title: 'Final Quiz', type: 'quiz' },
  ],
}

function baseLesson(overrides = {}) {
  return {
    id: 'slide-1',
    title: 'Slide 1',
    overview: '',
    type: 'image',
    image: 'https://example.com/slide-1.png',
    hotspots: [],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ImageLessonEditorPage />
    </MemoryRouter>,
  )
}

function unwrapResolve(trigger, value) {
  trigger.mockReturnValue({ unwrap: () => Promise.resolve(value) })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateLessonState.isLoading = false
  mockReplaceImageState.isLoading = false
  mockUseParams.mockReturnValue({ courseId: 'course1', lessonId: 'slide-1' })
  mockGetCourse.mockReturnValue({ data: COURSE, isLoading: false, isError: false })
  mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
  window.confirm = vi.fn(() => true)
})

test('renders the lesson title and image', () => {
  renderPage()
  expect(screen.getByDisplayValue('Slide 1')).toBeInTheDocument()
  expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/slide-1.png')
})

test('target picker excludes the current lesson but includes every other type', async () => {
  const user = userEvent.setup()
  renderPage()

  const canvas = document.querySelector('.cursor-crosshair')
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100,
  })

  await user.pointer([
    { keys: '[MouseLeft>]', target: canvas, coords: { clientX: 10, clientY: 10 } },
    { target: canvas, coords: { clientX: 60, clientY: 40 } },
    { keys: '[/MouseLeft]', target: canvas, coords: { clientX: 60, clientY: 40 } },
  ])

  const select = screen.getByText('Choose a destination…').closest('select')
  const optionLabels = [...select.options].map((o) => o.textContent)
  expect(optionLabels).toEqual(
    expect.arrayContaining(['Slide 2', 'Final Quiz']),
  )
  expect(optionLabels).not.toContain('Slide 1')
})

test('save sends title/overview/hotspots via updateLesson', async () => {
  const user = userEvent.setup()
  unwrapResolve(updateLessonTrigger, baseLesson())
  renderPage()

  const titleInput = screen.getByDisplayValue('Slide 1')
  await user.clear(titleInput)
  await user.type(titleInput, 'Renamed Slide')

  const saveButton = screen.getByRole('button', { name: 'Save changes' })
  await user.click(saveButton)

  expect(updateLessonTrigger).toHaveBeenCalledWith(
    expect.objectContaining({
      courseId: 'course1',
      lessonId: 'slide-1',
      lesson: expect.objectContaining({ title: 'Renamed Slide', type: 'image' }),
    }),
  )
})
