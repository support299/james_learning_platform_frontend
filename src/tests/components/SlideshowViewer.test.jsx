import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SlideshowViewer from '../../components/SlideshowViewer.jsx'

const markVisited = vi.fn()

vi.mock('../../store/coursesApi.js', () => ({
  useMarkSlideVisitedMutation: () => [markVisited],
}))

function slide(id, overrides = {}) {
  return { id, order: id, image: `https://example.com/${id}.png`, hotspots: [], isRequired: true, ...overrides }
}

beforeEach(() => {
  markVisited.mockClear()
  document.exitFullscreen = vi.fn()
})

describe('SlideshowViewer', () => {
  test('renders empty state when there are no slides', () => {
    render(<SlideshowViewer lesson={{ id: 'l1', title: 'Empty Deck', slides: [] }} courseId="c1" />)
    expect(screen.getByText('Empty Deck')).toBeInTheDocument()
    expect(screen.getByText(/doesn't have any slides yet/)).toBeInTheDocument()
  })

  test('renders the first slide and marks it visited', () => {
    const lesson = { id: 'l1', title: 'Deck', slides: [slide(1), slide(2)] }
    render(<SlideshowViewer lesson={lesson} courseId="c1" />)
    expect(screen.getByText('Slide 1 of 2')).toBeInTheDocument()
    expect(markVisited).toHaveBeenCalledWith({ courseId: 'c1', lessonId: 'l1', slideId: 1 })
  })

  test('Previous is disabled on the first slide, Next disabled on the last', async () => {
    const user = userEvent.setup()
    const lesson = { id: 'l1', title: 'Deck', slides: [slide(1), slide(2)] }
    render(<SlideshowViewer lesson={lesson} courseId="c1" />)
    expect(screen.getByText('Previous')).toBeDisabled()
    await user.click(screen.getByText('Next'))
    expect(screen.getByText('Slide 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeDisabled()
    expect(markVisited).toHaveBeenCalledWith({ courseId: 'c1', lessonId: 'l1', slideId: 2 })
  })

  test('hotspot click jumps to its target slide', async () => {
    const user = userEvent.setup()
    const lesson = {
      id: 'l1',
      title: 'Deck',
      slides: [
        slide(1, { hotspots: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.2, target: 2 }] }),
        slide(2),
      ],
    }
    render(<SlideshowViewer lesson={lesson} courseId="c1" />)
    await user.click(screen.getByLabelText('Go to slide 2'))
    expect(screen.getByText('Slide 2 of 2')).toBeInTheDocument()
  })

  test('hotspot with an unresolvable target is a no-op', async () => {
    const user = userEvent.setup()
    const lesson = {
      id: 'l1',
      title: 'Deck',
      slides: [slide(1, { hotspots: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.2, target: 999 }] })],
    }
    render(<SlideshowViewer lesson={lesson} courseId="c1" />)
    await user.click(screen.getByLabelText('Go to slide 1'))
    expect(screen.getByText('Slide 1 of 1')).toBeInTheDocument()
  })

  test('switching lessons resets to the first slide', () => {
    const lessonA = { id: 'l1', title: 'A', slides: [slide(1), slide(2)] }
    const { rerender } = render(<SlideshowViewer lesson={lessonA} courseId="c1" />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Slide 2 of 2')).toBeInTheDocument()

    const lessonB = { id: 'l2', title: 'B', slides: [slide(3), slide(4)] }
    rerender(<SlideshowViewer lesson={lessonB} courseId="c1" />)
    expect(screen.getByText('Slide 1 of 2')).toBeInTheDocument()
  })

  test('fullscreen toggle requests fullscreen and reflects fullscreenchange', async () => {
    const user = userEvent.setup()
    const lesson = { id: 'l1', title: 'Deck', slides: [slide(1)] }
    const { container } = render(<SlideshowViewer lesson={lesson} courseId="c1" />)
    const requestFullscreen = vi.fn()
    container.firstChild.requestFullscreen = requestFullscreen

    await user.click(screen.getByLabelText('View fullscreen'))
    expect(requestFullscreen).toHaveBeenCalled()

    Object.defineProperty(document, 'fullscreenElement', {
      value: container.firstChild, configurable: true,
    })
    fireEvent(document, new Event('fullscreenchange'))
    expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Exit fullscreen'))
    expect(document.exitFullscreen).toHaveBeenCalled()

    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    fireEvent(document, new Event('fullscreenchange'))
    expect(screen.getByLabelText('View fullscreen')).toBeInTheDocument()
  })
})
