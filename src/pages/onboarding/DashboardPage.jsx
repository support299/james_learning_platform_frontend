import { Link } from 'react-router-dom'
import { useGetDashboardQuery } from '../../store/onboardingApi.js'
import { monoLabel } from '../../components/adminUi.jsx'
import { formatDate } from '../../utils/adminHelpers.js'

function Stat({ label, value, hint }) {
  return (
    <div className="border border-stone-200 bg-white p-5">
      <p className={monoLabel}>{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardQuery()

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
        Onboarding
      </h1>
      <p className="mt-1.5 text-stone-500">
        Operational view of active cohorts, completion, and items that still need work.
      </p>

      {isLoading && (
        <p className="mt-10 text-sm text-stone-500">Loading dashboard…</p>
      )}
      {isError && (
        <p className="mt-10 text-sm font-medium text-red-600">
          Could not load the onboarding dashboard.
        </p>
      )}
      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Active cohorts" value={data.activeCohorts} />
            <Stat label="Agents" value={data.agentCount} />
            <Stat
              label="Overall completion"
              value={`${data.overallCompletion}%`}
            />
            <Stat
              label="Outstanding items"
              value={data.outstandingCount}
              hint="Required items still incomplete"
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label="On track" value={data.onTrack} />
            <Stat label="At risk" value={data.atRisk} />
            <Stat label="Overdue" value={data.overdue} />
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-bold text-stone-900">Active cohorts</h2>
            {data.cohorts.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">
                No active cohorts yet.{' '}
                <Link to="/onboarding/cohorts" className="text-orange-700">
                  Create one
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-stone-600">Cohort</th>
                      <th className="px-4 py-3 font-medium text-stone-600">Start</th>
                      <th className="px-4 py-3 font-medium text-stone-600">Agents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cohorts.map((c) => (
                      <tr key={c.id} className="border-b border-stone-100">
                        <td className="px-4 py-3 font-semibold text-stone-900">
                          {c.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-600">
                          {formatDate(c.startDate)}
                        </td>
                        <td className="px-4 py-3">{c.agentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Recent activity</h2>
              <Link
                to="/onboarding/audit"
                className="text-sm font-medium text-orange-700"
              >
                Friday audit →
              </Link>
            </div>
            {data.recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">No activity yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-stone-200 border border-stone-200 bg-white">
                {data.recentActivity.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm text-stone-900">
                        <span className="font-semibold">{event.agentName}</span>
                        {' — '}
                        {event.label || event.action.replaceAll('_', ' ')}
                      </p>
                      <p className="text-xs text-stone-500">
                        {event.actor?.displayName || 'System'} · {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
