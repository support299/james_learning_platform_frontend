// Toolbar icons for the rich-text editor (Lucide-style, 24px stroke).
const s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} aria-hidden="true">
      {children}
    </svg>
  )
}

export const BoldIcon = () => (
  <Svg>
    <path d="M14 12a4 4 0 0 0 0-8H6v8" />
    <path d="M15 20a4 4 0 0 0 0-8H6v8Z" />
  </Svg>
)

export const ItalicIcon = () => (
  <Svg>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </Svg>
)

export const UnderlineIcon = () => (
  <Svg>
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </Svg>
)

export const StrikeIcon = () => (
  <Svg>
    <path d="M16 4H9a3 3 0 0 0-2.83 4" />
    <path d="M14 12a4 4 0 0 1 0 8H7" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </Svg>
)

export const HighlightIcon = () => (
  <Svg>
    <path d="m9 11-6 6v3h3l6-6" />
    <path d="m14 6 4 4" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L13 14l-4-4Z" />
  </Svg>
)

export const CodeIcon = () => (
  <Svg>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </Svg>
)

export const LinkIcon = () => (
  <Svg>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
)

export const BulletListIcon = () => (
  <Svg>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3.5" y1="6" x2="3.51" y2="6" />
    <line x1="3.5" y1="12" x2="3.51" y2="12" />
    <line x1="3.5" y1="18" x2="3.51" y2="18" />
  </Svg>
)

export const OrderedListIcon = () => (
  <Svg>
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-1.6 2-2.5S5 14 4 14.5" />
  </Svg>
)

export const QuoteIcon = () => (
  <Svg>
    <path d="M7 7H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2v1a2 2 0 0 1-2 2 1 1 0 0 0 0 2 4 4 0 0 0 4-4V8a1 1 0 0 0-1-1Z" />
    <path d="M18 7h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2v1a2 2 0 0 1-2 2 1 1 0 0 0 0 2 4 4 0 0 0 4-4V8a1 1 0 0 0-1-1Z" />
  </Svg>
)

export const DividerIcon = () => (
  <Svg>
    <line x1="4" y1="12" x2="20" y2="12" />
  </Svg>
)

export const VideoIcon = () => (
  <Svg>
    <path d="m22 8-6 4 6 4V8Z" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </Svg>
)

export const AlignLeftIcon = () => (
  <Svg>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="15" y2="12" />
    <line x1="3" y1="18" x2="17" y2="18" />
  </Svg>
)

export const AlignCenterIcon = () => (
  <Svg>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="5" y1="18" x2="19" y2="18" />
  </Svg>
)

export const AlignRightIcon = () => (
  <Svg>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="7" y1="18" x2="21" y2="18" />
  </Svg>
)

export const UndoIcon = () => (
  <Svg>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H10" />
  </Svg>
)

export const RedoIcon = () => (
  <Svg>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H14" />
  </Svg>
)
