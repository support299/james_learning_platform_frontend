// Sequential lesson gating. Two rules, deliberately different:
//
// - isLessonUnlocked (reachability): a lesson can be viewed once every
//   earlier lesson (by course order) is completed — this necessarily
//   includes the one fresh lesson right after the completed run, since the
//   order gate (backend LessonCompletionView._order_completion_blockers)
//   never lets a later one complete first. Used for the direct-URL/refresh
//   block on LessonPage and for image-lesson hotspot targets.
// - isSidebarUnlocked (stricter, per product decision): the sidebar must
//   NOT let a student jump straight to that fresh next lesson — only Next
//   or a hotspot may open it for the first time. A sidebar entry is
//   clickable only once actually completed, or once it's the lesson the
//   student is already mid-way through (course.lastVisitedLesson, set
//   server-side on every lesson view — see coursesApi.js's getLesson).

export function isLessonUnlocked(course, completions, lessonId) {
  const lessons = course.lessons ?? []
  const index = lessons.findIndex((l) => l.id === lessonId)
  if (index <= 0) return true
  if (lessonId === course.lastVisitedLesson) return true
  const done = completions[course.id] ?? {}
  return lessons.slice(0, index).every((l) => done[l.id])
}

export function isSidebarUnlocked(course, completions, lessonId) {
  const done = completions[course.id] ?? {}
  return Boolean(done[lessonId]) || lessonId === course.lastVisitedLesson
}

// The furthest lesson reachable by completed-prefix alone (ignoring the
// in-progress exception) — used as the "back to" link target when a lesson
// is blocked. Falls back to the first lesson if nothing is completed yet.
export function furthestCompletedLesson(course, completions) {
  const lessons = course.lessons ?? []
  const done = completions[course.id] ?? {}
  let furthest = lessons[0]
  for (const lesson of lessons) {
    if (!done[lesson.id]) break
    furthest = lesson
  }
  return furthest
}
