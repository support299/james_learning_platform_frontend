import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  useBulkCreateAgentsMutation,
  useCreateAgentMutation,
  useCreateCohortMutation,
  useGetCohortsQuery,
  useGetStaffQuery,
  useUpdateCohortMutation,
} from '../../store/onboardingApi.js'
import { selectOnboardingRole } from '../../store/authSlice.js'
import {
  Field,
  blackButton,
  inputClass,
  outlineButton,
} from '../../components/adminUi.jsx'
import { errorMessage } from '../../components/onboarding/StatusPill.jsx'
import { formatDate } from '../../utils/adminHelpers.js'

export default function CohortsPage() {
  const role = useSelector(selectOnboardingRole)
  const isAssistant = role === 'assistant'
  const { data, isLoading, isError } = useGetCohortsQuery()
  const { data: staff } = useGetStaffQuery()
  const [createCohort] = useCreateCohortMutation()
  const [updateCohort] = useUpdateCohortMutation()
  const [createAgent] = useCreateAgentMutation()
  const [bulkCreate] = useBulkCreateAgentsMutation()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [names, setNames] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const agentNames = names
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean)
    if (!name.trim() || !startDate) {
      setError('Cohort name and start date are required.')
      return
    }
    setBusy(true)
    try {
      if (agentNames.length === 0) {
        await createCohort({ name: name.trim(), start_date: startDate }).unwrap()
      } else {
        await bulkCreate({
          cohort_name: name.trim(),
          start_date: startDate,
          owner_id: ownerId ? Number(ownerId) : null,
          agents: agentNames.map((full_name) => ({ full_name })),
        }).unwrap()
      }
      setName('')
      setStartDate('')
      setNames('')
    } catch (err) {
      setError(errorMessage(err, 'Could not save the cohort.'))
    } finally {
      setBusy(false)
    }
  }

  const addOneToExisting = async (cohort) => {
    const fullName = window.prompt(`Agent name for ${cohort.name}`)
    if (!fullName?.trim()) return
    setError(null)
    try {
      await createAgent({
        full_name: fullName.trim(),
        cohort: cohort.id,
        start_date: cohort.startDate,
      }).unwrap()
    } catch (err) {
      setError(errorMessage(err, 'Could not add that agent.'))
    }
  }

  const rows = data?.results ?? []

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
        Cohorts
      </h1>
      <p className="mt-1.5 text-stone-500">
        Multiple active cohorts stay visible. Historical ones can be archived, not deleted.
      </p>

      {isAssistant && (
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 border border-stone-200 bg-white p-6"
        >
          <h2 className="text-lg font-bold text-stone-900">New cohort</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cohort name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Week of Aug 25"
              />
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Recruiter / owner">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {(staff ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Agents (one name per line)">
            <textarea
              value={names}
              onChange={(e) => setNames(e.target.value)}
              rows={5}
              className={inputClass}
              placeholder="Jane Doe&#10;John Smith"
            />
          </Field>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={blackButton}>
            {busy ? 'Saving…' : 'Create cohort'}
          </button>
        </form>
      )}

      {isLoading && <p className="mt-8 text-sm text-stone-500">Loading cohorts…</p>}
      {isError && (
        <p className="mt-8 text-sm font-medium text-red-600">Could not load cohorts.</p>
      )}
      <div className="mt-8 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 font-medium text-stone-600">Cohort</th>
              <th className="px-4 py-3 font-medium text-stone-600">Start</th>
              <th className="px-4 py-3 font-medium text-stone-600">Agents</th>
              <th className="px-4 py-3 font-medium text-stone-600">Active</th>
              <th className="px-4 py-3 font-medium text-stone-600" />
            </tr>
          </thead>
          <tbody>
            {rows.map((cohort) => (
              <tr key={cohort.id} className="border-b border-stone-100">
                <td className="px-4 py-3 font-semibold">{cohort.name}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatDate(cohort.startDate)}
                </td>
                <td className="px-4 py-3">{cohort.agentCount}</td>
                <td className="px-4 py-3">{cohort.isActive ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/onboarding/agents?cohort=${cohort.id}`}
                    className="mr-3 text-xs font-medium text-orange-700"
                  >
                    View agents
                  </Link>
                  {isAssistant && (
                    <>
                      <button
                        type="button"
                        className="mr-3 text-xs font-medium text-stone-600"
                        onClick={() => addOneToExisting(cohort)}
                      >
                        Add agent
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-stone-600"
                        onClick={() =>
                          updateCohort({
                            id: cohort.id,
                            is_active: !cohort.isActive,
                          })
                        }
                      >
                        {cohort.isActive ? 'Archive' : 'Reactivate'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
