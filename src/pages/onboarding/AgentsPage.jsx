import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  useDeleteAgentMutation,
  useGetAgentsQuery,
  useGetCohortsQuery,
  useGetStaffQuery,
  useUpdateAgentMutation,
} from '../../store/onboardingApi.js'
import { selectOnboardingRole } from '../../store/authSlice.js'
import {
  ConfirmModal,
  Field,
  Modal,
  blackButton,
  inputClass,
  monoLabel,
  outlineButton,
} from '../../components/adminUi.jsx'
import { TrashIcon } from '../../components/Icons.jsx'
import StatusPill, { errorMessage } from '../../components/onboarding/StatusPill.jsx'
import { formatDate } from '../../utils/adminHelpers.js'

export default function AgentsPage() {
  const role = useSelector(selectOnboardingRole)
  const isAssistant = role === 'assistant'
  const [searchParams] = useSearchParams()
  const [cohort, setCohort] = useState(searchParams.get('cohort') || '')
  const [status, setStatus] = useState('')
  const [owner, setOwner] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const query = useMemo(
    () => ({ cohort, status, owner, search, page: 1 }),
    [cohort, status, owner, search],
  )
  const { data, isLoading, isError } = useGetAgentsQuery(query)
  const { data: cohorts } = useGetCohortsQuery()
  const { data: staff } = useGetStaffQuery()
  const [deleteAgent] = useDeleteAgentMutation()

  const rows = data?.results ?? []

  const remove = async () => {
    if (!pendingDelete) return
    setError(null)
    setDeleting(true)
    try {
      await deleteAgent(pendingDelete.id).unwrap()
      setPendingDelete(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that agent.'))
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

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
          Add via team
        </Link>
      </div>

      <div className="mt-8 grid gap-3 border-y border-stone-200 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email"
            className={inputClass}
          />
        </Field>
        <Field label="Team">
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
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      {!isLoading && rows.length === 0 && (
        <p className="mt-8 text-sm text-stone-500">
          No agents match these filters. Add a team and snapshot requirements from settings.
        </p>
      )}
      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-600">Agent</th>
                <th className="px-4 py-3 font-medium text-stone-600">Team</th>
                <th className="px-4 py-3 font-medium text-stone-600">Owner</th>
                <th className="px-4 py-3 font-medium text-stone-600">Complete</th>
                <th className="px-4 py-3 font-medium text-stone-600">Outstanding</th>
                <th className="px-4 py-3 font-medium text-stone-600">Status</th>
                <th className="px-4 py-3 font-medium text-stone-600">Updated</th>
                {isAssistant && (
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
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
                    {agent.email ? (
                      <span className="mt-0.5 block text-xs text-stone-500">
                        {agent.email}
                      </span>
                    ) : null}
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
                  {isAssistant && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null)
                            setEditing(agent)
                          }}
                          className="px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-stone-600 uppercase hover:text-stone-950"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null)
                            setPendingDelete(agent)
                          }}
                          aria-label={`Delete ${agent.fullName}`}
                          className="flex size-8 items-center justify-center text-stone-500 hover:text-red-600"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title="Edit agent" size="md" onClose={() => setEditing(null)}>
          <EditAgentForm
            agent={editing}
            cohorts={cohorts?.results ?? []}
            staff={staff ?? []}
            onDone={() => setEditing(null)}
          />
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete agent"
          message={`Delete "${pendingDelete.fullName}"? Their checklist and carrier progress will be removed. This cannot be undone.`}
          busy={deleting}
          onConfirm={remove}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </main>
  )
}

function EditAgentForm({ agent, cohorts, staff, onDone }) {
  const [updateAgent] = useUpdateAgentMutation()
  const [fullName, setFullName] = useState(agent.fullName)
  const [email, setEmail] = useState(agent.email || '')
  const [cohortId, setCohortId] = useState(String(agent.cohort || ''))
  const [ownerId, setOwnerId] = useState(agent.owner?.id ? String(agent.owner.id) : '')
  const [startDate, setStartDate] = useState(agent.startDate || '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !cohortId || !startDate) {
      setError('Name, team, and start date are required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updateAgent({
        id: agent.id,
        full_name: fullName.trim(),
        email: email.trim(),
        cohort: Number(cohortId),
        owner_id: ownerId ? Number(ownerId) : null,
        start_date: startDate,
      }).unwrap()
      onDone()
    } catch (err) {
      setError(errorMessage(err, 'Could not save agent.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-4">
      <Field label="Name">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Email (academy login)">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="Optional — creates or links their student account"
        />
      </Field>
      <Field label="Team">
        <select
          value={cohortId}
          onChange={(e) => {
            const next = e.target.value
            setCohortId(next)
            const match = cohorts.find((c) => String(c.id) === next)
            if (match?.startDate) setStartDate(match.startDate)
          }}
          className={inputClass}
        >
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Owner">
        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className={inputClass}
        >
          <option value="">None</option>
          {staff.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Start date">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputClass}
        />
      </Field>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={blackButton}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
