import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  useGetAgentsQuery,
  useGetCohortsQuery,
  useGetStaffQuery,
} from '../../store/onboardingApi.js'
import {
  Field,
  inputClass,
  monoLabel,
  outlineButton,
} from '../../components/adminUi.jsx'
import StatusPill from '../../components/onboarding/StatusPill.jsx'
import { formatDate } from '../../utils/adminHelpers.js'

export default function AgentsPage() {
  const [searchParams] = useSearchParams()
  const [cohort, setCohort] = useState(searchParams.get('cohort') || '')
  const [status, setStatus] = useState('')
  const [owner, setOwner] = useState('')
  const [search, setSearch] = useState('')

  const query = useMemo(
    () => ({ cohort, status, owner, search, page: 1 }),
    [cohort, status, owner, search],
  )
  const { data, isLoading, isError } = useGetAgentsQuery(query)
  const { data: cohorts } = useGetCohortsQuery()
  const { data: staff } = useGetStaffQuery()

  const rows = data?.results ?? []

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
            Agents
          </h1>
          <p className="mt-1.5 text-stone-500">
            Find who needs attention. Completion and status come from the API.
          </p>
        </div>
        <Link to="/onboarding/cohorts" className={outlineButton}>
          Add via cohort
        </Link>
      </div>

      <div className="mt-8 grid gap-3 border-y border-stone-200 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name"
            className={inputClass}
          />
        </Field>
        <Field label="Cohort">
          <select
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className={inputClass}
          >
            <option value="">All</option>
            {(cohorts?.results ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option value="">All</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="overdue">Overdue</option>
          </select>
        </Field>
        <Field label="Owner">
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={inputClass}
          >
            <option value="">All</option>
            {(staff ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isLoading && <p className="mt-8 text-sm text-stone-500">Loading agents…</p>}
      {isError && (
        <p className="mt-8 text-sm font-medium text-red-600">Could not load agents.</p>
      )}
      {!isLoading && rows.length === 0 && (
        <p className="mt-8 text-sm text-stone-500">
          No agents match these filters. Add a cohort and snapshot requirements from settings.
        </p>
      )}
      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-600">Agent</th>
                <th className="px-4 py-3 font-medium text-stone-600">Cohort</th>
                <th className="px-4 py-3 font-medium text-stone-600">Owner</th>
                <th className="px-4 py-3 font-medium text-stone-600">Complete</th>
                <th className="px-4 py-3 font-medium text-stone-600">Outstanding</th>
                <th className="px-4 py-3 font-medium text-stone-600">Status</th>
                <th className="px-4 py-3 font-medium text-stone-600">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((agent) => (
                <tr key={agent.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/onboarding/agents/${agent.id}`}
                      className="font-semibold text-stone-900 hover:text-orange-700"
                    >
                      {agent.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    <span className="block">{agent.cohortName}</span>
                    <span className={`${monoLabel} mt-0.5`}>
                      {formatDate(agent.startDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {agent.owner?.displayName || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {agent.completionPercent}%
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {agent.outstanding.length === 0
                      ? '—'
                      : agent.outstanding.slice(0, 2).join(', ') +
                        (agent.outstanding.length > 2
                          ? ` +${agent.outstanding.length - 2}`
                          : '')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={agent.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {formatDate(agent.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
