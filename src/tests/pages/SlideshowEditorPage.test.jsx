import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SlideshowEditorPage from '../../pages/SlideshowEditorPage.jsx'

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

const mockDispatch = vi.fn()
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}))

vi.mock('../../components/SiteHeader.jsx', () => ({
  default: () => <div data-testid="site-header" />,
}))

const invalidateTags = vi.fn((tags) => ({ type: 'invalidateTags', tags }))

const mockGetCourse = vi.fn()
const mockGetLesson = vi.fn()
const createLessonTrigger = vi.fn()
const updateLessonTrigger = vi.fn()
const uploadSlideTrigger = vi.fn()
const replaceImageTrigger = vi.fn()
const deleteSlideTrigger = vi.fn()
const importPptxTrigger = vi.fn()

const mockCreateLessonState = { isLoading: false }
const mockUpdateLessonState = { isLoading: false }
const mockUploadSlideState = { isLoading: false }
const mockReplaceImageState = { isLoading: false }
const mockImportPptxState = { isLoading: false }

vi.mock('../../store/coursesApi.js', () => ({
  coursesApi: { util: { invalidateTags: (...args) => invalidateTags(...args) } },
  useGetCourseQuery: (...args) => mockGetCourse(...args),
  useGetLessonQuery: (...args) => mockGetLesson(...args),
  useCreateLessonMutation: () => [createLessonTrigger, mockCreateLessonState],
  useUpdateLessonMutation: () => [updateLessonTrigger, mockUpdateLessonState],
  useUploadSlideshowSlideMutation: () => [uploadSlideTrigger, mockUploadSlideState],
  useReplaceSlideshowSlideImageMutation: () => [replaceImageTrigger, mockReplaceImageState],
  useDeleteSlideshowSlideMutation: () => [deleteSlideTrigger, {}],
  useImportSlideshowPptxMutation: () => [importPptxTrigger, mockImportPptxState],
}))

const COURSE = { id: 'course1', title: 'Course One' }

function slide(id, overrides = {}) {
  return { id, order: id, image: `https://example.com/${id}.png`, hotspots: [], isRequired: true, ...overrides }
}

function baseLesson(overrides = {}) {
  return {
    id: 'lesson1',
    title: 'My Slideshow',
    overview: '',
    type: 'slideshow',
    slides: [],
    importStatus: 'idle',
    importError: '',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SlideshowEditorPage />
    </MemoryRouter>,
  )
}

// "Slides (N)" is a heading split across a text node and a nested <span> —
// screen.getByText can't match text broken up by multiple elements.
function slidesHeading() {
  return screen.getByRole('heading', { level: 2 })
}

function unwrapResolve(trigger, value) {
  trigger.mockReturnValue({ unwrap: () => Promise.resolve(value) })
}
function unwrapReject(trigger, error) {
  trigger.mockReturnValue({ unwrap: () => Promise.reject(error) })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateLessonState.isLoading = false
  mockUpdateLessonState.isLoading = false
  mockUploadSlideState.isLoading = false
  mockReplaceImageState.isLoading = false
  mockImportPptxState.isLoading = false
  mockGetCourse.mockReturnValue({ data: COURSE, isLoading: false, isError: false })
  mockGetLesson.mockReturnValue({ data: undefined, isLoading: false, isError: false })
  window.confirm = vi.fn(() => true)
})

describe('SlideshowEditorPage loading/error states', () => {
  test('shows Loading while course query is in flight', () => {
    mockUseParams.mockReturnValue({ courseId: 'course1', lessonId: undefined })
    mockGetCourse.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  test('shows Course not found on course error', () => {
    mockUseParams.mockReturnValue({ courseId: 'course1', lessonId: undefined })
    mockGetCourse.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderPage()
    expect(screen.getByText('Course not found')).toBeInTheDocument()
  })

  test('shows Loading while lesson query is in flight', () => {
    mockUseParams.mockReturnValue({ courseId: 'course1', lessonId: 'lesson1' })
    mockGetLesson.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  test('shows Slideshow not found on lesson error', () => {
    mockUseParams.mockReturnValue({ courseId: 'course1', lessonId: 'lesson1' })
    mockGetLesson.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderPage()
    expect(screen.getByText('Slideshow not found')).toBeInTheDocument()
  })
})

describe('NewSlideshowForm', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ courseId: 'course1', lessonId: undefined })
  })

  test('Create button disabled until a title is entered', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByText('Create slideshow')).toBeDisabled()
    await user.type(screen.getByPlaceholderText('Slideshow title'), 'My Deck')
    expect(screen.getByText('Create slideshow')).toBeEnabled()
  })

  test('successful create navigates to the edit route', async () => {
    const user = userEvent.setup()
    unwrapResolve(createLessonTrigger, { id: 'new-lesson' })
    renderPage()
    await user.type(screen.getByPlaceholderText('Slideshow title'), 'My Deck')
    await user.click(screen.getByText('Create slideshow'))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/course/course1/slideshow/new-lesson/edit')
    })
    expect(createLessonTrigger).toHaveBeenCalledWith({
      courseId: 'course1',
      lesson: { title: 'My Deck', type: 'slideshow', overview: '' },
    })
  })

  test('failed create shows an error message', async () => {
    const user = userEvent.setup()
    unwrapReject(createLessonTrigger, new Error('boom'))
    renderPage()
    await user.type(screen.getByPlaceholderText('Slideshow title'), 'My Deck')
    await user.click(screen.getByText('Create slideshow'))
    expect(await screen.findByText('Could not create the slideshow. Is the API running?')).toBeInTheDocument()
  })

  test('cancel with unsaved title asks for confirmation', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValue(false)
    renderPage()
    await user.type(screen.getByPlaceholderText('Slideshow title'), 'Draft')
    await user.click(screen.getAllByText('Cancel')[0])
    expect(window.confirm).toHaveBeenCalledWith('Discard unsaved changes?')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('cancel with no changes navigates without confirming', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getAllByText('Cancel')[0])
    expect(window.confirm).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/admin/course/course1')
  })

  test('confirmed cancel navigates back', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByPlaceholderText('Slideshow title'), 'Draft')
    await user.click(screen.getAllByText('Cancel')[0])
    expect(mockNavigate).toHaveBeenCalledWith('/admin/course/course1')
  })

  test('back-arrow button also routes through the same guarded cancel', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByLabelText('Back to Course One'))
    expect(mockNavigate).toHaveBeenCalledWith('/admin/course/course1')
  })

  test('typing an overview marks the form dirty', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByPlaceholderText('A one-line summary for the Overview tab.'), 'Summary')
    await user.click(screen.getAllByText('Cancel')[0])
    expect(window.confirm).toHaveBeenCalled()
  })
})

describe('SlideshowEditor', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ courseId: 'course1', lessonId: 'lesson1' })
  })

  test('renders lesson title/overview, Save disabled when not dirty', () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ overview: 'Overview text' }), isLoading: false, isError: false })
    renderPage()
    expect(screen.getByDisplayValue('My Slideshow')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Overview text')).toBeInTheDocument()
    expect(screen.getByText('Save changes')).toBeDisabled()
  })

  test('editing the title enables Save and submits the expected payload', async () => {
    // Note: the "Saved." banner only appears once `dirty` clears, which
    // compares live state against the `lesson` *prop* — that only updates
    // once the real app's cache-invalidation-triggered refetch lands, which
    // a plain mocked hook (no real store) can't reproduce. Covered instead
    // by SlideshowEditorPage.jsx's dirty-flag logic exercised elsewhere.
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    unwrapResolve(updateLessonTrigger, {})
    renderPage()
    await user.type(screen.getByDisplayValue('My Slideshow'), ' v2')
    expect(screen.getByText('Save changes')).toBeEnabled()
    await user.click(screen.getByText('Save changes'))
    await waitFor(() =>
      expect(updateLessonTrigger).toHaveBeenCalledWith({
        courseId: 'course1',
        lessonId: 'lesson1',
        lesson: { title: 'My Slideshow v2', type: 'slideshow', overview: '', slides: [] },
      }),
    )
  })

  test('shows "Saved." once the refetched lesson prop catches up to local state', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    unwrapResolve(updateLessonTrigger, {})
    const { rerender } = renderPage()
    await user.type(screen.getByDisplayValue('My Slideshow'), ' v2')
    await user.click(screen.getByText('Save changes'))
    await waitFor(() => expect(updateLessonTrigger).toHaveBeenCalled())

    // Simulate the cache-invalidation refetch landing (a real store would
    // do this automatically; the mocked hook needs a manual nudge).
    mockGetLesson.mockReturnValue({ data: baseLesson({ title: 'My Slideshow v2' }), isLoading: false, isError: false })
    rerender(
      <MemoryRouter>
        <SlideshowEditorPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
  })

  test('failed save shows an error message', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    unwrapReject(updateLessonTrigger, new Error('boom'))
    renderPage()
    await user.type(screen.getByDisplayValue('My Slideshow'), ' v2')
    await user.click(screen.getByText('Save changes'))
    expect(await screen.findByText('Could not save the slideshow. Is the API running?')).toBeInTheDocument()
  })

  test('cancel with dirty state confirms before navigating away', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValue(false)
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    renderPage()
    await user.type(screen.getByDisplayValue('My Slideshow'), ' v2')
    await user.click(screen.getAllByText('Cancel')[0])
    expect(window.confirm).toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('cancel with no changes navigates back without confirming', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    renderPage()
    await user.click(screen.getAllByText('Cancel')[0])
    expect(window.confirm).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/admin/course/course1')
  })

  test('empty-slides state renders a call to action', () => {
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    renderPage()
    expect(screen.getByText('No slides yet')).toBeInTheDocument()
  })

  test('adding a slide uploads and appends it, selecting it', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    unwrapResolve(uploadSlideTrigger, slide(2))
    const { container } = renderPage()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const input = container.querySelector('input[type="file"][accept="image/*"]')
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(slidesHeading()).toHaveTextContent("Slides (2)"))
    expect(uploadSlideTrigger).toHaveBeenCalledWith({ courseId: 'course1', lessonId: 'lesson1', file })
  })

  test('add-slide failure shows an error', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    unwrapReject(uploadSlideTrigger, new Error('boom'))
    const { container } = renderPage()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const input = container.querySelector('input[type="file"][accept="image/*"]')
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText('Could not upload the slide image.')).toBeInTheDocument()
  })

  test('replacing the current slide image patches it in place', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    unwrapResolve(replaceImageTrigger, { image: 'https://example.com/new.png' })
    renderPage()
    const file = new File(['x'], 'new.png', { type: 'image/png' })
    const replaceInput = screen.getByText('Replace image').parentElement.querySelector('input[type="file"]')
    fireEvent.change(replaceInput, { target: { files: [file] } })
    await waitFor(() =>
      expect(replaceImageTrigger).toHaveBeenCalledWith({
        courseId: 'course1', lessonId: 'lesson1', slideId: 1, file,
      }),
    )
  })

  test('replace-image failure shows an error', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    unwrapReject(replaceImageTrigger, new Error('boom'))
    renderPage()
    const file = new File(['x'], 'new.png', { type: 'image/png' })
    const replaceInput = screen.getByText('Replace image').parentElement.querySelector('input[type="file"]')
    fireEvent.change(replaceInput, { target: { files: [file] } })
    expect(await screen.findByText('Could not replace the slide image.')).toBeInTheDocument()
  })

  test('deleting a slide asks for confirmation, then removes it and dangling hotspot refs', async () => {
    const user = userEvent.setup()
    const s1 = slide(1, { hotspots: [{ x: 0, y: 0, w: 0.1, h: 0.1, target: 2 }] })
    const s2 = slide(2)
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [s1, s2] }), isLoading: false, isError: false })
    unwrapResolve(deleteSlideTrigger, {})
    renderPage()
    await user.click(screen.getByLabelText('Delete slide 2'))
    expect(screen.getByText('Delete slide')).toBeInTheDocument()
    await user.click(screen.getByText('Delete'))
    await waitFor(() => expect(slidesHeading()).toHaveTextContent("Slides (1)"))
    expect(deleteSlideTrigger).toHaveBeenCalledWith({ courseId: 'course1', lessonId: 'lesson1', slideId: 2 })
  })

  test('delete-slide failure shows an error and still closes the modal', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1), slide(2)] }), isLoading: false, isError: false })
    unwrapReject(deleteSlideTrigger, new Error('boom'))
    renderPage()
    await user.click(screen.getByLabelText('Delete slide 2'))
    await user.click(screen.getByText('Delete'))
    expect(await screen.findByText('Could not delete the slide.')).toBeInTheDocument()
    expect(screen.queryByText('Delete slide')).not.toBeInTheDocument()
  })

  test('a slide with canDelete=false ignores the delete click', async () => {
    mockGetLesson.mockReturnValue({
      data: baseLesson({ slides: [slide(1), slide(2)], importStatus: 'pending' }),
      isLoading: false,
      isError: false,
    })
    renderPage()
    fireEvent.click(screen.getByLabelText('Delete slide 2'))
    expect(screen.queryByText('Delete slide')).not.toBeInTheDocument()
  })

  test('import with existing slides opens a re-import confirmation first', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    unwrapResolve(importPptxTrigger, {})
    const { container } = renderPage()
    const file = new File(['x'], 'deck.pptx', { type: 'application/octet-stream' })
    const input = container.querySelector('input[type="file"][accept=".pptx"]')
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText('Re-import from PPTX')).toBeInTheDocument()
    expect(importPptxTrigger).not.toHaveBeenCalled()

    const user = userEvent.setup()
    await user.click(screen.getByText('Replace slides'))
    expect(importPptxTrigger).toHaveBeenCalledWith({ courseId: 'course1', lessonId: 'lesson1', file })
  })

  test('import with zero slides runs immediately, no confirmation', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [] }), isLoading: false, isError: false })
    unwrapResolve(importPptxTrigger, {})
    const { container } = renderPage()
    const file = new File(['x'], 'deck.pptx', { type: 'application/octet-stream' })
    const input = container.querySelector('input[type="file"][accept=".pptx"]')
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() =>
      expect(importPptxTrigger).toHaveBeenCalledWith({ courseId: 'course1', lessonId: 'lesson1', file }),
    )
    expect(screen.queryByText('Re-import from PPTX')).not.toBeInTheDocument()
  })

  test('import failure surfaces the server detail message', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [] }), isLoading: false, isError: false })
    unwrapReject(importPptxTrigger, { data: { detail: 'An import is already in progress for this lesson.' } })
    const { container } = renderPage()
    const file = new File(['x'], 'deck.pptx', { type: 'application/octet-stream' })
    const input = container.querySelector('input[type="file"][accept=".pptx"]')
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText('An import is already in progress for this lesson.')).toBeInTheDocument()
  })

  test('import failure without a detail field falls back to a generic message', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [] }), isLoading: false, isError: false })
    unwrapReject(importPptxTrigger, new Error('network down'))
    const { container } = renderPage()
    const file = new File(['x'], 'deck.pptx', { type: 'application/octet-stream' })
    const input = container.querySelector('input[type="file"][accept=".pptx"]')
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText('Could not start the import.')).toBeInTheDocument()
  })

  test('pending import disables slide-editing actions and shows the banner', () => {
    mockGetLesson.mockReturnValue({
      data: baseLesson({ slides: [slide(1)], importStatus: 'pending' }),
      isLoading: false,
      isError: false,
    })
    renderPage()
    expect(screen.getByText('Importing…')).toBeInTheDocument()
    expect(screen.getByText(/this can take a little while/)).toBeInTheDocument()
    expect(screen.getByText('Import from PPTX')).toBeDisabled()
    expect(screen.getByText('Add slide')).toBeDisabled()
    expect(screen.getByText('Replace image')).toBeDisabled()
  })

  test('add-slide/replace-image are disabled during the import kickoff request itself, before import_status flips to pending', () => {
    // Regression: isPending only becomes true once the server responds —
    // there's a real network round-trip where `importing` is true but
    // isPending isn't yet, and these buttons must not be clickable then
    // either, or a manually-added slide gets wiped once the import lands.
    mockImportPptxState.isLoading = true
    mockGetLesson.mockReturnValue({
      data: baseLesson({ slides: [slide(1)], importStatus: 'idle' }),
      isLoading: false,
      isError: false,
    })
    renderPage()
    expect(screen.getByText('Add slide')).toBeDisabled()
    expect(screen.getByText('Replace image')).toBeDisabled()
  })

  test('uploading state relabels the import/add-slide buttons', () => {
    mockImportPptxState.isLoading = true
    mockUploadSlideState.isLoading = true
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    renderPage()
    expect(screen.getAllByText('Uploading…').length).toBeGreaterThan(0)
  })

  test('polling transition from pending to done re-seeds slides and invalidates the Course tag', async () => {
    const pendingLesson = baseLesson({ slides: [], importStatus: 'pending' })
    mockGetLesson.mockImplementation((queryArg, options) => {
      if (options && options.pollingInterval !== undefined) {
        return { data: baseLesson({ slides: [slide(1), slide(2)], importStatus: 'done' }) }
      }
      return { data: pendingLesson, isLoading: false, isError: false }
    })
    renderPage()
    await waitFor(() => expect(slidesHeading()).toHaveTextContent("Slides (2)"))
    expect(invalidateTags).toHaveBeenCalledWith([{ type: 'Course', id: 'course1' }])
    expect(mockDispatch).toHaveBeenCalled()
  })

  test('self-heals when the lesson prop jumps straight to done without ever observing pending locally', async () => {
    // Regression: if this component's own tracking ref never caught a
    // 'pending' tick (e.g. a fast import, or a refetch that lands after
    // completion), the transition-based re-seed alone would never fire and
    // the editor would be stuck showing 0 slides despite a real, completed
    // import. The missedReseed fallback (status done + local slides empty +
    // server slides non-empty) must catch this independently.
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [], importStatus: 'idle' }), isLoading: false, isError: false })
    const { rerender } = renderPage()
    expect(slidesHeading()).toHaveTextContent('Slides (0)')

    mockGetLesson.mockReturnValue({
      data: baseLesson({ slides: [slide(1), slide(2)], importStatus: 'done' }),
      isLoading: false,
      isError: false,
    })
    rerender(
      <MemoryRouter>
        <SlideshowEditorPage />
      </MemoryRouter>,
    )
    await waitFor(() => expect(slidesHeading()).toHaveTextContent('Slides (2)'))
  })

  test('polling transition from pending to failed surfaces the error', async () => {
    const pendingLesson = baseLesson({ slides: [], importStatus: 'pending' })
    mockGetLesson.mockImplementation((queryArg, options) => {
      if (options && options.pollingInterval !== undefined) {
        return { data: baseLesson({ slides: [], importStatus: 'failed', importError: 'bad file' }) }
      }
      return { data: pendingLesson, isLoading: false, isError: false }
    })
    renderPage()
    expect(await screen.findByText('bad file')).toBeInTheDocument()
  })

  describe('hotspot drawing on the slide canvas', () => {
    function setupCanvas(slides) {
      mockGetLesson.mockReturnValue({ data: baseLesson({ slides }), isLoading: false, isError: false })
      const utils = renderPage()
      const canvas = utils.container.querySelector('.cursor-crosshair')
      canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 })
      return { ...utils, canvas }
    }

    test('a drag past the threshold opens the target picker; picking a target adds the hotspot', async () => {
      const { canvas } = setupCanvas([slide(1), slide(2)])
      fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(canvas, { clientX: 100, clientY: 60, pointerId: 1 })
      fireEvent.pointerUp(canvas, { clientX: 100, clientY: 60, pointerId: 1 })
      expect(screen.getByText('New hotspot — jumps to:')).toBeInTheDocument()

      const select = screen.getByText('Choose a slide…').closest('select')
      fireEvent.change(select, { target: { value: '2' } })
      await waitFor(() => expect(screen.getByText('1 hotspot')).toBeInTheDocument())
    })

    test('switching slides mid-draw discards the draft instead of leaking it onto the new slide', async () => {
      const user = userEvent.setup()
      const utils = setupCanvas([slide(1), slide(2), slide(3)])
      fireEvent.pointerDown(utils.canvas, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(utils.canvas, { clientX: 100, clientY: 60, pointerId: 1 })
      fireEvent.pointerUp(utils.canvas, { clientX: 100, clientY: 60, pointerId: 1 })
      expect(screen.getByText('New hotspot — jumps to:')).toBeInTheDocument()

      // "Slide 2" also appears as an <option> in the open target-picker —
      // scope to the sidebar list item to click the right one.
      await user.click(within(screen.getAllByRole('listitem')[1]).getByText('Slide 2'))

      // With no `key` on SlideCanvas, the draft/picker would survive the
      // switch and a picked target would land on the wrong slide.
      expect(screen.queryByText('New hotspot — jumps to:')).not.toBeInTheDocument()
      expect(utils.container.querySelector('.border-dashed')).not.toBeInTheDocument()
    })

    test('a drag below the threshold is treated as an accidental click', () => {
      const { canvas } = setupCanvas([slide(1), slide(2)])
      fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(canvas, { clientX: 10.5, clientY: 10.5, pointerId: 1 })
      fireEvent.pointerUp(canvas, { clientX: 10.5, clientY: 10.5, pointerId: 1 })
      expect(screen.queryByText('New hotspot — jumps to:')).not.toBeInTheDocument()
    })

    test('cancelling a pending draft discards it', () => {
      const { canvas } = setupCanvas([slide(1), slide(2)])
      fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(canvas, { clientX: 100, clientY: 60, pointerId: 1 })
      fireEvent.pointerUp(canvas, { clientX: 100, clientY: 60, pointerId: 1 })
      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[cancelButtons.length - 1])
      expect(screen.queryByText('New hotspot — jumps to:')).not.toBeInTheDocument()
    })

    test('clicking an existing hotspot selects it, allows retarget and delete', async () => {
      const user = userEvent.setup()
      const s1 = slide(1, { hotspots: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.2, target: 2 }] })
      setupCanvas([s1, slide(2), slide(3)])
      await user.click(screen.getByTitle('Slide 1'))
      expect(screen.getByText('Hotspot — jumps to:')).toBeInTheDocument()

      const select = screen.getByDisplayValue('Slide 1')
      fireEvent.change(select, { target: { value: '3' } })

      await user.click(screen.getByText('Delete hotspot'))
      await waitFor(() =>
        expect(within(screen.getAllByRole('listitem')[0]).getByText('0 hotspots')).toBeInTheDocument(),
      )
    })

    test('closing the hotspot panel deselects it', async () => {
      const user = userEvent.setup()
      const s1 = slide(1, { hotspots: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.2, target: 2 }] })
      setupCanvas([s1, slide(2)])
      await user.click(screen.getByTitle('Slide 1'))
      await user.click(screen.getByText('Close'))
      expect(screen.queryByText('Hotspot — jumps to:')).not.toBeInTheDocument()
    })

    test('a hotspot targeting an unknown slide shows a fallback label', async () => {
      const user = userEvent.setup()
      const s1 = slide(1, { hotspots: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.2, target: 999 }] })
      setupCanvas([s1, slide(2)])
      await user.click(screen.getByTitle('Unknown slide'))
      expect(screen.getByText('Hotspot — jumps to:')).toBeInTheDocument()
    })
  })

  test('toggling the required checkbox patches the slide', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    renderPage()
    const checkbox = screen.getByLabelText('Required to complete')
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(within(screen.getAllByRole('listitem')[0]).getByText(/optional/)).toBeInTheDocument()
  })

  test('selecting a different slide from the list updates the active canvas', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1), slide(2)] }), isLoading: false, isError: false })
    renderPage()
    await user.click(screen.getByText('Slide 2'))
    expect(screen.getByText(/Slide 2 — click and drag/)).toBeInTheDocument()
  })

  test('typing an overview marks the form dirty', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValue(false)
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    renderPage()
    const overviewInput = screen.getByText('Overview (optional)').nextElementSibling
    await user.type(overviewInput, 'A summary')
    expect(screen.getByText('Save changes')).toBeEnabled()
    await user.click(screen.getAllByText('Cancel')[0])
    expect(window.confirm).toHaveBeenCalled()
  })

  test('clicking the file-picker trigger buttons opens the (mocked) file input', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    const { container } = renderPage()
    for (const input of container.querySelectorAll('input[type="file"]')) {
      input.click = vi.fn()
    }
    await user.click(screen.getByText('Import from PPTX'))
    await user.click(screen.getByText('Add slide'))
    await user.click(screen.getByText('Replace image'))
    for (const input of container.querySelectorAll('input[type="file"]')) {
      expect(input.click).toHaveBeenCalled()
    }
  })

  test('dirty state installs a beforeunload guard that prevents silent navigation', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson(), isLoading: false, isError: false })
    renderPage()
    await user.type(screen.getByDisplayValue('My Slideshow'), ' v2')
    const event = new Event('beforeunload', { cancelable: true })
    const preventDefault = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    expect(preventDefault).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  test('closing the delete-slide confirmation without confirming leaves the slide', async () => {
    const user = userEvent.setup()
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1), slide(2)] }), isLoading: false, isError: false })
    renderPage()
    await user.click(screen.getByLabelText('Delete slide 2'))
    const dialog = screen.getByText('Delete slide').closest('[role="dialog"]')
    await user.click(within(dialog).getByText('Cancel'))
    expect(screen.queryByText('Delete slide')).not.toBeInTheDocument()
    await waitFor(() => expect(slidesHeading()).toHaveTextContent('Slides (2)'))
  })

  test('closing the re-import confirmation without confirming does not start the import', async () => {
    mockGetLesson.mockReturnValue({ data: baseLesson({ slides: [slide(1)] }), isLoading: false, isError: false })
    const { container } = renderPage()
    const file = new File(['x'], 'deck.pptx', { type: 'application/octet-stream' })
    const input = container.querySelector('input[type="file"][accept=".pptx"]')
    fireEvent.change(input, { target: { files: [file] } })
    const dialog = await screen.findByText('Re-import from PPTX')
    const user = userEvent.setup()
    await user.click(within(dialog.closest('[role="dialog"]')).getByText('Cancel'))
    expect(screen.queryByText('Re-import from PPTX')).not.toBeInTheDocument()
    expect(importPptxTrigger).not.toHaveBeenCalled()
  })
})
