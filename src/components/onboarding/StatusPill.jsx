const labels = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  overdue: 'Overdue',
}

const tones = {
  on_track: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  at_risk: 'bg-amber-50 text-amber-800 border-amber-200',
  overdue: 'bg-red-50 text-red-800 border-red-200',
}

export function statusLabel(status) {
  return labels[status] || status || '—'
}

export default function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${
        tones[status] || 'border-stone-200 text-stone-600'
      }`}
    >
      {statusLabel(status)}
    </span>
  )
}

export function errorMessage(err, fallback) {
  const data = err?.data
  if (!data) return fallback
  if (typeof data.detail === 'string') return data.detail
  if (typeof data.error === 'string') return data.error
  const [field, value] = Object.entries(data)[0] ?? []
  const message = Array.isArray(value) ? value[0] : value
  if (typeof message !== 'string') return fallback
  return field === 'non_field_errors' ? message : `${field}: ${message}`
}
