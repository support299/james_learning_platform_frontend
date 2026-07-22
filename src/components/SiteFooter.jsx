import { Link } from 'react-router-dom'
import { LogoMark } from './Icons.jsx'

export default function SiteFooter({ links }) {
  return (
    <footer className="border-t border-gray-800 bg-gray-900">
      <div className="mx-auto max-w-7xl px-8 pt-12 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-xs">
            <span className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-white">
              <LogoMark size={32} />
              <span>
                Aftermath <span className="text-[#E4B94D]">Academy</span>
              </span>
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
          © {new Date().getFullYear()} Aftermath Academy. Professional Learning Environment.
        </div>
      </div>
    </footer>
  )
}
