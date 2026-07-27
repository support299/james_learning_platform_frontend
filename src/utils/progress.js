// Helpers over the completion map from `useGetMyCompletionsQuery`, shaped
// { [courseId]: { [lessonId]: true } }.

// Counts only completions whose lesson still exists on the course, so a
// deleted lesson can't push a course past 100%.
export function completedCount(completions, course) {
  const done = completions[course.id] ?? {}
  return (course.lessons ?? []).filter((l) => done[l.id]).length
}

export function courseProgress(completions, course) {
  const total = course.lessons?.length ?? 0
  if (total === 0) return 0
  return Math.round((completedCount(completions, course) / total) * 100)
}

// An empty course is never "complete" — it has nothing to finish.
export function isCourseComplete(completions, course) {
  const total = course.lessons?.length ?? 0
  return total > 0 && completedCount(completions, course) === total
}
