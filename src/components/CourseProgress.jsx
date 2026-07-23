// Course completion meter: a labelled bar with the lesson count on the left and
// the percentage on the right. Switches to a "Completed" emerald state at 100%.
export default function CourseProgress({ value, done, total }) {
  const clamped = Math.min(100, Math.max(0, value))
  const complete = clamped === 100

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span
          className={
            complete ? 'font-semibold text-emerald-600' : 'font-medium text-gray-500'
          }
        >
          {complete ? 'Completed' : `${done} of ${total} lessons`}
        </span>
        <span
          className={`font-bold tabular-nums ${
            complete ? 'text-emerald-600' : 'text-gray-900'
          }`}
        >
          {clamped}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} lessons complete`}
        className="h-2 overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            complete ? 'bg-emerald-500' : 'bg-blue-700'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
