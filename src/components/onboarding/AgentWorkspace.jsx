import { Link } from 'react-router-dom'
import { inputClass, monoLabel, outlineButton } from '../adminUi.jsx'
import StatusPill from './StatusPill.jsx'
import { formatDate } from '../../utils/adminHelpers.js'

const carrierStatuses = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
]

export default function AgentWorkspace({
  agent,
  staff = [],
  writable,
  error,
  run,
  patchItem,
  patchCarrier,
  updateAgent,
  showBack = true,
  showAtRisk = true,
  showOutstanding = true,
  showLoginMeta = true,
  showFlags = true,
}) {
  return (
    <>
      {showBack && (
        <Link to="/onboarding/agents" className="text-sm text-stone-500 hover:text-stone-800">
          ← Agents
        </Link>
      )}
      <div className={`flex flex-wrap items-start justify-between gap-4 ${showBack ? 'mt-4' : ''}`}>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
            {agent.fullName}
          </h1>
          <p className="mt-1.5 text-stone-500">
            {agent.cohortName} · started {formatDate(agent.startDate)}
            {agent.owner ? ` · ${agent.owner.displayName}` : ''}
          </p>
          {showLoginMeta && (agent.email || agent.user) && (
            <p className={`${monoLabel} mt-2`}>
              {agent.email || agent.user.email}
              {agent.user
                ? ` · login ${agent.user.username}`
                : ' · no academy login yet'}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={agent.status} />
          <p className="text-2xl font-extrabold text-stone-900">
            {agent.completionPercent}%
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      {showAtRisk && writable && updateAgent && (
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={agent.manuallyAtRisk}
            onChange={(e) =>
              run(() =>
                updateAgent({ id: agent.id, manually_at_risk: e.target.checked }).unwrap(),
              )
            }
          />
          Flag agent as at risk
        </label>
      )}

      {showOutstanding && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-stone-900">Outstanding</h2>
          {agent.outstanding.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Nothing outstanding.</p>
          ) : (
            <ul className="mt-2 list-disc pl-5 text-sm text-stone-700">
              {agent.outstanding.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-stone-900">Checklist</h2>
        {agent.checklist.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            No checklist items. Add definitions and a template in Settings, then create the agent again — or ask an assistant to configure the catalog.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-200 border border-stone-200 bg-white">
            {agent.checklist.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex items-start gap-3 text-sm text-stone-900">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={item.isCompleted}
                      disabled={!writable}
                      onChange={(e) =>
                        run(() =>
                          patchItem({
                            agentId: agent.id,
                            itemId: item.id,
                            is_completed: e.target.checked,
                          }).unwrap(),
                        )
                      }
                    />
                    <span>
                      <span className={item.isCompleted ? 'text-stone-400 line-through' : ''}>
                        {item.label}
                      </span>
                      {!item.isRequired && (
                        <span className={`${monoLabel} ml-2`}>optional</span>
                      )}
                      {showFlags && item.isFlagged && (
                        <span className="ml-2 font-mono text-[10px] text-amber-700 uppercase">
                          flagged
                        </span>
                      )}
                    </span>
                  </label>
                  {showFlags && writable && (
                    <button
                      type="button"
                      onClick={() =>
                        run(() =>
                          patchItem({
                            agentId: agent.id,
                            itemId: item.id,
                            is_flagged: !item.isFlagged,
                          }).unwrap(),
                        )
                      }
                      className="text-xs font-medium text-stone-500 hover:text-stone-800"
                    >
                      {item.isFlagged ? 'Unflag' : 'Flag'}
                    </button>
                  )}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <textarea
                    defaultValue={item.comment}
                    disabled={!writable}
                    placeholder="Comment"
                    rows={2}
                    className={inputClass}
                    onBlur={(e) => {
                      if (e.target.value === item.comment) return
                      run(() =>
                        patchItem({
                          agentId: agent.id,
                          itemId: item.id,
                          comment: e.target.value,
                        }).unwrap(),
                      )
                    }}
                  />
                  <select
                    value={item.owner?.id || ''}
                    disabled={!writable}
                    className={inputClass}
                    onChange={(e) =>
                      run(() =>
                        patchItem({
                          agentId: agent.id,
                          itemId: item.id,
                          owner_id: e.target.value ? Number(e.target.value) : null,
                        }).unwrap(),
                      )
                    }
                  >
                    <option value="">Owner</option>
                    {staff.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-stone-900">Carrier contracts</h2>
        {agent.carriers.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            No carrier requirements on this agent. Add carriers to a template in Settings.
          </p>
        ) : (
          ['health', 'life'].map((line) => {
            const rows = agent.carriers.filter((req) => req.carrierLine === line)
            if (rows.length === 0) return null
            return (
              <div key={line} className="mt-4">
                <h3 className="mb-2 font-mono text-[11px] font-medium tracking-[0.15em] text-stone-500 uppercase">
                  {line === 'health' ? 'Health' : 'Life'}
                </h3>
                <div className="overflow-x-auto border border-stone-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-stone-600">Carrier</th>
                        <th className="px-4 py-3 font-medium text-stone-600">Status</th>
                        <th className="px-4 py-3 font-medium text-stone-600">Owner</th>
                        {showFlags && (
                          <th className="px-4 py-3 font-medium text-stone-600">Flag</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((req) => (
                        <tr key={req.id} className="border-b border-stone-100">
                          <td className="px-4 py-3 font-medium">{req.carrierName}</td>
                          <td className="px-4 py-3">
                            <select
                              value={req.status}
                              disabled={!writable}
                              className={inputClass}
                              onChange={(e) =>
                                run(() =>
                                  patchCarrier({
                                    agentId: agent.id,
                                    reqId: req.id,
                                    status: e.target.value,
                                  }).unwrap(),
                                )
                              }
                            >
                              {carrierStatuses.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={req.owner?.id || ''}
                              disabled={!writable}
                              className={inputClass}
                              onChange={(e) =>
                                run(() =>
                                  patchCarrier({
                                    agentId: agent.id,
                                    reqId: req.id,
                                    owner_id: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  }).unwrap(),
                                )
                              }
                            >
                              <option value="">Owner</option>
                              {staff.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.displayName}
                                </option>
                              ))}
                            </select>
                          </td>
                          {showFlags && (
                            <td className="px-4 py-3">
                              {writable && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    run(() =>
                                      patchCarrier({
                                        agentId: agent.id,
                                        reqId: req.id,
                                        is_flagged: !req.isFlagged,
                                      }).unwrap(),
                                    )
                                  }
                                  className="text-xs font-medium text-stone-500"
                                >
                                  {req.isFlagged ? 'Unflag' : 'Flag'}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        )}
      </section>
    </>
  )
}
