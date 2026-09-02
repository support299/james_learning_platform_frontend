import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  useGetAuditQuery,
  useGetCohortsQuery,
  useGetStaffQuery,
  usePatchCarrierRequirementMutation,
  usePatchChecklistItemMutation,
} from '../../store/onboardingApi.js'
import { selectOnboardingRole } from '../../store/authSlice.js'
import {
  Field,
  inputClass,
  outlineButton,
} from '../../components/adminUi.jsx'
import StatusPill, { errorMessage } from '../../components/onboarding/StatusPill.jsx'
import { formatDate } from '../../utils/adminHelpers.js'

export default function AuditPage() {
  const role = useSelector(selectOnboardingRole)
  const writable = role === 'assistant' || role === 'recruiter'
  const [cohort, setCohort] = useState('')
  const [owner, setOwner] = useState('')
  const [flagged, setFlagged] = useState(false)
  const params = useMemo(
    () => ({ cohort, owner, flagged: flagged ? '1' : '' }),
    [cohort, owner, flagged],
  )
  const { data, isLoading, isError } = useGetAuditQuery(params)
  const { data: cohorts } = useGetCohortsQuery()
  const { data: staff } = useGetStaffQuery()
  const [patchItem] = usePatchChecklistItemMutation()
  const [patchCarrier] = usePatchCarrierRequirementMutation()
  const [error, setError] = useState(null)

  const rows = data?.results ?? []

  const patch = async (row, body) => {
    setError(null)
    try {
      if (row.itemType === 'checklist') {
        await patchItem({ agentId: row.agentId, itemId: row.itemId, ...body }).unwrap()
      } else {
        await patchCarrier({ agentId: row.agentId, reqId: row.itemId, ...body }).unwrap()
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not update that item.'))
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
        Friday audit
      </h1>
      <p className="mt-1.5 text-stone-500">
        Everything still incomplete on active cohorts. Flag, comment, or assign an owner without leaving this list.
      </p>

      <div className="mt-8 grid gap-3 border-y border-stone-200 py-5 sm:grid-cols-3">
        <Field label="Cohort">
          <select
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className={inputClass}
          >
            <option value="">Active cohorts</option>
            {(cohorts?.results ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
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
        <label className="flex items-end gap-2 pb-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={flagged}
            onChange={(e) => setFlagged(e.target.checked)}
          />
          Flagged only
        </label>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      {isLoading && <p className="mt-6 text-sm text-stone-500">Loading audit…</p>}
      {isError && (
        <p className="mt-6 text-sm font-medium text-red-600">Could not load the audit.</p>
      )}
      {!isLoading && rows.length === 0 && (
        <p className="mt-6 text-sm text-stone-500">No outstanding items for this filter.</p>
      )}
      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-600">Agent</th>
                <th className="px-4 py-3 font-medium text-stone-600">Item</th>
                <th className="px-4 py-3 font-medium text-stone-600">Carrier</th>
                <th className="px-4 py-3 font-medium text-stone-600">Owner</th>
                <th className="px-4 py-3 font-medium text-stone-600">Status</th>
                <th className="px-4 py-3 font-medium text-stone-600">Context</th>
                <th className="px-4 py-3 font-medium text-stone-600" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.itemType}-${row.itemId}`}
                  className="border-b border-stone-100 align-top"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/onboarding/agents/${row.agentId}`}
                      className="font-semibold text-stone-900 hover:text-orange-700"
                    >
                      {row.agentName}
                    </Link>
                    <p className="text-xs text-stone-500">{row.cohortName}</p>
                  </td>
                  <td className="px-4 py-3">
                    {row.label}
                    {row.isFlagged && (
                      <span className="ml-2 font-mono text-[10px] text-amber-700 uppercase">
                        flagged
                      </span>
                    )}
                    {row.comment && (
                      <p className="mt-1 text-xs text-stone-500">{row.comment}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{row.carrier || '—'}</td>
                  <td className="px-4 py-3">
                    {writable ? (
                      <select
                        value={row.owner?.id || ''}
                        className={inputClass}
                        onChange={(e) =>
                          patch(row, {
                            owner_id: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      >
                        <option value="">Unassigned</option>
                        {(staff ?? []).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.displayName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      row.owner?.displayName || '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.agentStatus} />
                    <p className="mt-1 font-mono text-[10px] text-stone-500 uppercase">
                      {row.status.replaceAll('_', ' ')}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {row.dueContext}
                    <div>{formatDate(row.startDate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    {writable && (
                      <button
                        type="button"
                        className={outlineButton}
                        onClick={() => patch(row, { is_flagged: !row.isFlagged })}
                      >
                        {row.isFlagged ? 'Unflag' : 'Flag'}
                      </button>
                    )}
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
