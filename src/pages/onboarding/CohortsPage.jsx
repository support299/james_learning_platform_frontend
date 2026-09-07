import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  useBulkCreateAgentsMutation,
  useCreateAgentMutation,
  useCreateCohortMutation,
  useDeleteCohortMutation,
  useGetCohortsQuery,
  useGetStaffQuery,
  useUpdateCohortMutation,
} from '../../store/onboardingApi.js'
import { selectOnboardingRole } from '../../store/authSlice.js'
import {
  ConfirmModal,
  Field,
  Modal,
  blackButton,
  inputClass,
  outlineButton,
} from '../../components/adminUi.jsx'
import { TrashIcon } from '../../components/Icons.jsx'
import { errorMessage } from '../../components/onboarding/StatusPill.jsx'
import { formatDate } from '../../utils/adminHelpers.js'
import GhlUserPicker from '../../components/GhlUserPicker.jsx'

export default function CohortsPage() {
  const role = useSelector(selectOnboardingRole)
  const isAssistant = role === 'assistant'
  const { data, isLoading, isError } = useGetCohortsQuery()
  const { data: staff } = useGetStaffQuery()
  const [createCohort] = useCreateCohortMutation()
  const [updateCohort] = useUpdateCohortMutation()
  const [deleteCohort] = useDeleteCohortMutation()
  const [createAgent] = useCreateAgentMutation()
  const [bulkCreate] = useBulkCreateAgentsMutation()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [picked, setPicked] = useState([])
  const [ownerId, setOwnerId] = useState('')
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [addingTo, setAddingTo] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !startDate) {
      setError('Team name and start date are required.')
      return
    }
    setBusy(true)
    try {
      if (picked.length === 0) {
        await createCohort({ name: name.trim(), start_date: startDate }).unwrap()
      } else {
        await bulkCreate({
          cohort_name: name.trim(),
          start_date: startDate,
          owner_id: ownerId ? Number(ownerId) : null,
          agents: picked.map((u) => ({
            full_name: u.name,
            email: u.email,
            ghl_user_id: u.id,
          })),
        }).unwrap()
      }
      setName('')
      setStartDate('')
      setPicked([])
    } catch (err) {
      setError(errorMessage(err, 'Could not save the team.'))
    } finally {
      setBusy(false)
    }
  }

  const addOneToExisting = async (ghlUser) => {
    if (!addingTo || !ghlUser) return
    setError(null)
    try {
      await createAgent({
        full_name: ghlUser.name,
        email: ghlUser.email || '',
        ghl_user_id: ghlUser.id,
        cohort: addingTo.id,
        start_date: addingTo.startDate,
      }).unwrap()
      setAddingTo(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not add that agent.'))
      setAddingTo(null)
    }
  }

  const remove = async () => {
    if (!pendingDelete) return
    setError(null)
    setDeleting(true)
    try {
      await deleteCohort(pendingDelete.id).unwrap()
      setPendingDelete(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that team.'))
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const rows = data?.results ?? []

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
        Teams
      </h1>
      <p className="mt-1.5 text-stone-500">
        Multiple active teams stay visible. Archive old ones, or delete a team to remove
        it and every agent in it.
      </p>

      {isAssistant && (
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 border border-stone-200 bg-white p-6"
        >
          <h2 className="text-lg font-bold text-stone-900">New team</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Team name">
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
          <Field label="Agents">
            <GhlUserPicker
              multiple
              value={picked}
              onChange={setPicked}
              placeholder="Search synced GoHighLevel users…"
            />
            <p className="mt-1.5 text-xs text-stone-500">
              Pick people already synced from GoHighLevel. Each one becomes an
              agent on this team (and an academy login if they have an email).
            </p>
          </Field>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={blackButton}>
            {busy ? 'Saving…' : 'Create team'}
          </button>
        </form>
      )}

      {isLoading && <p className="mt-8 text-sm text-stone-500">Loading teams…</p>}
      {isError && (
        <p className="mt-8 text-sm font-medium text-red-600">Could not load teams.</p>
      )}
      {!isAssistant && error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}
      <div className="mt-8 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 font-medium text-stone-600">Team</th>
              <th className="px-4 py-3 font-medium text-stone-600">Start</th>
              <th className="px-4 py-3 font-medium text-stone-600">Agents</th>
              <th className="px-4 py-3 font-medium text-stone-600">Active</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
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
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/onboarding/agents?cohort=${cohort.id}`}
                      className="px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-orange-700 uppercase hover:text-orange-900"
                    >
                      View agents
                    </Link>
                    {isAssistant && (
                      <>
                        <button
                          type="button"
                          className="px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-stone-600 uppercase hover:text-stone-950"
                          onClick={() => {
                            setError(null)
                            setAddingTo(cohort)
                          }}
                        >
                          Add agent
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-stone-600 uppercase hover:text-stone-950"
                          onClick={() => {
                            setError(null)
                            setEditing(cohort)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-stone-600 uppercase hover:text-stone-950"
                          onClick={() =>
                            updateCohort({
                              id: cohort.id,
                              is_active: !cohort.isActive,
                            })
                          }
                        >
                          {cohort.isActive ? 'Archive' : 'Reactivate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null)
                            setPendingDelete(cohort)
                          }}
                          aria-label={`Delete ${cohort.name}`}
                          className="flex size-8 items-center justify-center text-stone-500 hover:text-red-600"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title="Edit team" size="md" onClose={() => setEditing(null)}>
          <EditCohortForm cohort={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}

      {addingTo && (
        <Modal title="Add agent" size="md" onClose={() => setAddingTo(null)}>
          <AddAgentForm
            cohortName={addingTo.name}
            onSubmit={addOneToExisting}
            onClose={() => setAddingTo(null)}
          />
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete team"
          message={
            pendingDelete.agentCount > 0
              ? `Delete "${pendingDelete.name}" and its ${pendingDelete.agentCount} agent${pendingDelete.agentCount === 1 ? '' : 's'}? This cannot be undone.`
              : `Delete "${pendingDelete.name}"? This cannot be undone.`
          }
          busy={deleting}
          onConfirm={remove}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </main>
  )
}

function AddAgentForm({ cohortName, onSubmit, onClose }) {
  const [ghlUser, setGhlUser] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!ghlUser) return
    setBusy(true)
    try {
      await onSubmit(ghlUser)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-stone-600">Add an agent to {cohortName}.</p>
      <Field label="GoHighLevel user">
        <GhlUserPicker
          value={ghlUser}
          onChange={setGhlUser}
          autoFocus
          placeholder="Search synced users…"
        />
      </Field>
      <div className="flex justify-end gap-3">
        <button type="button" className={outlineButton} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={busy || !ghlUser} className={blackButton}>
          {busy ? 'Adding…' : 'Add'}
        </button>
      </div>
    </form>
  )
}

function EditCohortForm({ cohort, onDone }) {
  const [updateCohort] = useUpdateCohortMutation()
  const [name, setName] = useState(cohort.name)
  const [startDate, setStartDate] = useState(cohort.startDate || '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!name.trim() || !startDate) {
      setError('Name and start date are required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updateCohort({
        id: cohort.id,
        name: name.trim(),
        start_date: startDate,
      }).unwrap()
      onDone()
    } catch (err) {
      setError(errorMessage(err, 'Could not save team.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-4">
      <Field label="Team name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
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
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={blackButton}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
