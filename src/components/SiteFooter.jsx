import { Link } from 'react-router-dom'

export default function SiteFooter({ links }) {
  return (
    <footer className="border-t border-gray-800 bg-gray-900">
      <div className="mx-auto max-w-7xl px-8 pt-12 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-xs">
            <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-sm">
                A
              </span>
              AgentGrowth
            </span>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              A focused, professional learning environment for building real skills.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {links.map((link) => {
              const label = typeof link === 'string' ? link : link.label
              const to = typeof link === 'string' ? null : link.to
              const className =
                'font-medium text-gray-400 transition-colors hover:text-white'
              return to ? (
                <Link key={label} to={to} className={className}>
                  {label}
                </Link>
              ) : (
                <a key={label} href="#" className={className}>
                  {label}
                </a>
              )
            })}
          </nav>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} AgentGrowth. Professional Learning Environment.
        </div>
      </div>
    </footer>
  )
}
