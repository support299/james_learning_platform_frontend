const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

// Brand mark — anarchy "A" crossing a ring. Uses currentColor, so it inherits
// its color from the surrounding text (dark on the header, white in the footer).
export function LogoMark({ size = 32, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      <g
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="60" cy="62" r="49" fill="none" strokeWidth="5.5" />
        <path d="M60 17 L37 96" fill="none" strokeWidth="12" />
        <path d="M60 17 L83 96" fill="none" strokeWidth="12" />
        <path d="M20 103 Q64.6 78.5 103 45 Q58.4 69.5 20 103 Z" stroke="none" />
      </g>
    </svg>
  )
}

export function SearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  )
}

export function StarIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function ChevronIcon({ size = 16, direction = 'down' }) {
  const rotation = { down: 0, up: 180, left: 90, right: -90 }[direction]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...base}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function ArrowIcon({ size = 16, direction = 'right' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...base}
      style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}
      aria-hidden="true"
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  )
}

export function PlayCircleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8.5 16 12 10 15.5" />
    </svg>
  )
}

export function CircleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

export function DocIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  )
}

export function QuizIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.33c-.55.21-.9.71-.9 1.3v.37" />
      <line x1="12" y1="16.5" x2="12" y2="16.51" />
    </svg>
  )
}

export function BellIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

export function UserIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  )
}

export function DotsIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  )
}

export function CloseIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

export function PlusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function GripIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}

export function PencilIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" />
      <line x1="13.5" y1="6.5" x2="17.5" y2="10.5" />
    </svg>
  )
}

export function TrashIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <polyline points="4 7 20 7" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

export function HelpIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.33c-.55.21-.9.71-.9 1.3v.37" />
      <line x1="12" y1="17" x2="12" y2="17.01" />
    </svg>
  )
}
