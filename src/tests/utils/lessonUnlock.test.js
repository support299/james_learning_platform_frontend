import { describe, test, expect } from 'vitest'
import {
  isLessonUnlocked,
  isSidebarUnlocked,
  furthestCompletedLesson,
} from '../../utils/lessonUnlock.js'

function course(lessonIds, lastVisitedLesson = null) {
  return {
    id: 'c1',
    lastVisitedLesson,
    lessons: lessonIds.map((id) => ({ id, title: `Lesson ${id}` })),
  }
}

describe('isLessonUnlocked', () => {
  test('the first lesson is always unlocked', () => {
    expect(isLessonUnlocked(course(['a', 'b', 'c']), {}, 'a')).toBe(true)
  })

  test('a later lesson is locked until every earlier one is completed', () => {
    const c = course(['a', 'b', 'c'])
    expect(isLessonUnlocked(c, {}, 'b')).toBe(false)
    expect(isLessonUnlocked(c, { c1: { a: true } }, 'b')).toBe(true)
  })

  test('leapfrogging is locked even if the immediate predecessor is skipped', () => {
    const c = course(['a', 'b', 'c'])
    expect(isLessonUnlocked(c, { c1: { b: true } }, 'c')).toBe(false)
  })

  test('a leapfrog is allowed once every lesson in between is completed', () => {
    const c = course(['a', 'b', 'c', 'd'])
    expect(isLessonUnlocked(c, { c1: { a: true, b: true, c: true } }, 'd')).toBe(true)
  })

  test('the persisted last-visited lesson is unlocked even if not completed', () => {
    const c = course(['a', 'b', 'c'], 'b')
    expect(isLessonUnlocked(c, {}, 'b')).toBe(true)
  })

  test('a lesson not in the course at all is treated as unlocked (findIndex -1)', () => {
    expect(isLessonUnlocked(course(['a', 'b']), {}, 'ghost')).toBe(true)
  })
})

describe('isSidebarUnlocked', () => {
  test('completed lessons are clickable', () => {
    const c = course(['a', 'b'])
    expect(isSidebarUnlocked(c, { c1: { a: true } }, 'a')).toBe(true)
  })

  test('a fresh lesson that only satisfies the prefix rule is NOT sidebar-clickable', () => {
    // Unlike isLessonUnlocked, the sidebar must not offer a lesson the
    // student hasn't opened yet — only Next/hotspot may open it first.
    const c = course(['a', 'b'])
    expect(isSidebarUnlocked(c, { c1: { a: true } }, 'b')).toBe(false)
  })

  test('the persisted last-visited lesson is sidebar-clickable', () => {
    const c = course(['a', 'b'], 'b')
    expect(isSidebarUnlocked(c, {}, 'b')).toBe(true)
  })
})

describe('furthestCompletedLesson', () => {
  test('falls back to the first lesson when nothing is completed', () => {
    const c = course(['a', 'b', 'c'])
    expect(furthestCompletedLesson(c, {}).id).toBe('a')
  })

  test('returns the last lesson in an unbroken completed-from-start run', () => {
    const c = course(['a', 'b', 'c', 'd'])
    expect(
      furthestCompletedLesson(c, { c1: { a: true, b: true, d: true } }).id,
    ).toBe('b')
  })
})
