import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  useCreateCarrierMutation,
  useCreateChecklistDefinitionMutation,
  useCreateTemplateMutation,
  useDeleteCarrierMutation,
  useDeleteChecklistDefinitionMutation,
  useGetCarriersQuery,
  useGetChecklistDefinitionsQuery,
  useGetSettingsQuery,
  useGetTemplatesQuery,
  useTriggerSyncMutation,
  useUpdateSettingsMutation,
  useUpdateTemplateMutation,
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

export default function SettingsPage() {
  const role = useSelector(selectOnboardingRole)
  const { data: settings, isLoading } = useGetSettingsQuery()
  const { data: carriers = [] } = useGetCarriersQuery()
  const { data: definitions = [] } = useGetChecklistDefinitionsQuery()
  const { data: templates = [] } = useGetTemplatesQuery()
  const [updateSettings] = useUpdateSettingsMutation()
  const [createCarrier] = useCreateCarrierMutation()
  const [deleteCarrier] = useDeleteCarrierMutation()
  const [createDefinition] = useCreateChecklistDefinitionMutation()
  const [deleteDefinition] = useDeleteChecklistDefinitionMutation()
  const [createTemplate] = useCreateTemplateMutation()
  const [updateTemplate] = useUpdateTemplateMutation()
  const [triggerSync, { isLoading: syncing }] = useTriggerSyncMutation()

  const [atRisk, setAtRisk] = useState('')
  const [overdue, setOverdue] = useState('')
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [carrierName, setCarrierName] = useState('')
  const [carrierLine, setCarrierLine] = useState('health')
  const [itemLabel, setItemLabel] = useState('')
  const [templateName, setTemplateName] = useState('Default')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingAdd, setPendingAdd] = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!settings) return
    setAtRisk(settings.atRiskAfterDays ?? '')
    setOverdue(settings.overdueAfterDays ?? '')
    setSyncEnabled(settings.syncEnabled)
  }, [settings])

  if (role && role !== 'assistant') {
    return <Navigate to="/onboarding" replace />
  }

  const saveThresholds = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await updateSettings({
        at_risk_after_days: atRisk === '' ? null : Number(atRisk),
        overdue_after_days: overdue === '' ? null : Number(overdue),
        sync_enabled: syncEnabled,
      }).unwrap()
      setNotice('Settings saved.')
    } catch (err) {
      setError(errorMessage(err, 'Could not save settings.'))
    }
  }

  const addCarrier = (e) => {
    e.preventDefault()
    if (!carrierName.trim()) return
    setError(null)
    setNotice(null)
    setPendingAdd({
      kind: 'carrier',
      name: carrierName.trim(),
      line: carrierLine,
    })
  }

  const addItem = (e) => {
    e.preventDefault()
    if (!itemLabel.trim()) return
    setError(null)
    setNotice(null)
    setPendingAdd({ kind: 'item', label: itemLabel.trim() })
  }

  const confirmAdd = async (applyTo) => {
    if (!pendingAdd) return
    setAdding(true)
    setError(null)
    try {
      const result =
        pendingAdd.kind === 'carrier'
          ? await createCarrier({
              name: pendingAdd.name,
              line: pendingAdd.line,
              apply_to: applyTo,
            }).unwrap()
          : await createDefinition({
              label: pendingAdd.label,
              is_required: true,
              apply_to: applyTo,
            }).unwrap()
      if (pendingAdd.kind === 'carrier') setCarrierName('')
      else setItemLabel('')
      const label = pendingAdd.kind === 'carrier' ? pendingAdd.name : pendingAdd.label
      setNotice(
        applyTo === 'existing'
          ? `Added "${label}" to ${result.applied_to_agents} existing agent${result.applied_to_agents === 1 ? '' : 's'}.`
          : `Added "${label}" for new teams only.`,
      )
      setPendingAdd(null)
    } catch (err) {
      setError(
        errorMessage(
          err,
          pendingAdd.kind === 'carrier'
            ? 'Could not add carrier.'
            : 'Could not add checklist item.',
        ),
      )
    } finally {
      setAdding(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setError(null)
    setNotice(null)
    try {
      if (pendingDelete.kind === 'carrier') {
        await deleteCarrier(pendingDelete.item.id).unwrap()
      } else {
        await deleteDefinition(pendingDelete.item.id).unwrap()
      }
      setPendingDelete(null)
    } catch (err) {
      setPendingDelete(null)
      setError(
        errorMessage(
          err,
          pendingDelete.kind === 'carrier'
            ? 'Could not delete carrier.'
            : 'Could not delete checklist item.',
        ),
      )
    }
  }

  const saveDefaultTemplate = async () => {
    setError(null)
    const body = {
      name: templateName.trim() || 'Default',
      is_default: true,
      is_active: true,
      carrier_ids: carriers
        .filter((c) => c.isActive)
        .map((c) => ({ carrier: c.id, is_required: true })),
      item_ids: definitions
        .filter((d) => d.isActive)
        .map((d, index) => ({
          definition: d.id,
          is_required: d.isRequired,
          sort_order: index,
        })),
    }
    try {
      const existing = templates.find((t) => t.isDefault) || templates[0]
      if (existing) {
        await updateTemplate({ id: existing.id, ...body }).unwrap()
      } else {
        await createTemplate(body).unwrap()
      }
      setNotice('Default template now includes the current catalog.')
    } catch (err) {
      setError(errorMessage(err, 'Could not save template.'))
    }
  }

  const pushSheet = async () => {
    setError(null)
    setNotice(null)
    try {
      const result = await triggerSync().unwrap()
      if (result.ok) {
        setNotice(`Synced ${result.synced} agent row(s) to Google Sheets.`)
      } else {
        setError(result.error || 'Sync did not complete.')
      }
    } catch (err) {
      setError(errorMessage(err, 'Sync failed. Check Google Sheets configuration.'))
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-8 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
        Settings
      </h1>
      <p className="mt-1.5 text-stone-500">
        Carriers and checklist items are configured here — not hard-coded. Status day
        thresholds stay blank until the client confirms At Risk / Overdue rules.
      </p>

      {isLoading && <p className="mt-8 text-sm text-stone-500">Loading…</p>}
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm font-medium text-emerald-700">{notice}</p>}

      {settings && (
        <form onSubmit={saveThresholds} className="mt-8 space-y-4 border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold">Status thresholds</h2>
          <p className="text-sm text-stone-500">
            Leave blank to keep auto-status as On Track unless an item or agent is flagged.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="At risk after (days)">
              <input
                type="number"
                min="0"
                value={atRisk}
                onChange={(e) => setAtRisk(e.target.value)}
                className={inputClass}
                placeholder="unset"
              />
            </Field>
            <Field label="Overdue after (days)">
              <input
                type="number"
                min="0"
                value={overdue}
                onChange={(e) => setOverdue(e.target.value)}
                className={inputClass}
                placeholder="unset"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={(e) => setSyncEnabled(e.target.checked)}
            />
            Enable spreadsheet sync (must be checked, then Save thresholds)
          </label>
          <button type="submit" className={blackButton}>
            Save thresholds
          </button>
        </form>
      )}

      <section className="mt-8 border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold">Google Sheets</h2>
        <p className="mt-2 text-sm text-stone-600">
          Configured: {settings?.sheetConfigured ? 'yes' : 'no'}. Tab:{' '}
          {settings?.sheetTab || 'Onboarding'}.
        </p>
        {settings?.syncState?.last_error &&
          !(
            settings.sheetConfigured &&
            String(settings.syncState.last_error).includes('is not configured')
          ) && (
            <p className="mt-2 text-sm text-red-600">
              {settings.syncState.last_error}
            </p>
          )}
        {settings?.syncState?.last_success_at && (
          <p className="mt-2 text-xs text-stone-500">
            Last success: {settings.syncState.last_success_at}
          </p>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Set GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SERVICE_ACCOUNT_JSON and
          GOOGLE_SHEETS_SPREADSHEET_ID. Share the sheet with the service-account email.
        </p>
        <button
          type="button"
          onClick={pushSheet}
          disabled={syncing}
          className={`${outlineButton} mt-4`}
        >
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </section>

      <section className="mt-8 border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold">Carriers</h2>
        <p className="mt-1 text-sm text-stone-500">
          Aftermath list is split into Health and Life. You can still add more.
          New teams pick these up. You choose whether current agents get them too.
        </p>
        <form onSubmit={addCarrier} className="mt-4 flex flex-wrap gap-3">
          <select
            value={carrierLine}
            onChange={(e) => setCarrierLine(e.target.value)}
            className={inputClass}
          >
            <option value="health">Health</option>
            <option value="life">Life</option>
          </select>
          <input
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
            className={`${inputClass} min-w-56 flex-1`}
            placeholder="Carrier name"
          />
          <button type="submit" className={blackButton}>
            Add
          </button>
        </form>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {['health', 'life'].map((line) => {
            const rows = carriers.filter((c) => c.line === line)
            return (
              <div key={line}>
                <h3 className="font-mono text-[11px] font-medium tracking-[0.15em] text-stone-500 uppercase">
                  {line === 'health' ? 'Health carrier list' : 'Life carrier list'}
                </h3>
                <ul className="mt-2 text-sm text-stone-700">
                  {rows.length === 0 && (
                    <li className="text-stone-400">None yet.</li>
                  )}
                  {rows.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 py-0.5">
                      <span>
                        {c.name}{' '}
                        <span className="text-stone-400">({c.code})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingDelete({ kind: 'carrier', item: c })}
                        aria-label={`Delete ${c.name}`}
                        className="flex size-7 shrink-0 items-center justify-center text-stone-400 hover:text-red-600"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-8 border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold">Checklist items</h2>
        <p className="mt-1 text-sm text-stone-500">
          New teams get each item. You choose whether current agents get it too.
        </p>
        <form onSubmit={addItem} className="mt-4 flex gap-3">
          <input
            value={itemLabel}
            onChange={(e) => setItemLabel(e.target.value)}
            className={inputClass}
            placeholder="e.g. E&O verified"
          />
          <button type="submit" className={blackButton}>
            Add
          </button>
        </form>
        <ul className="mt-4 text-sm text-stone-700">
          {definitions.length === 0 && <li className="text-stone-500">None yet.</li>}
          {definitions.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-0.5">
              <span>{d.label}</span>
              <button
                type="button"
                onClick={() => setPendingDelete({ kind: 'item', item: d })}
                aria-label={`Delete ${d.label}`}
                className="flex size-7 shrink-0 items-center justify-center text-stone-400 hover:text-red-600"
              >
                <TrashIcon size={15} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold">Default template</h2>
        <p className="mt-2 text-sm text-stone-500">
          New agents snapshot this template. Matching by role/state/agent type is stored on
          extra templates when you add them later.
        </p>
        <Field label="Template name">
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className={`${inputClass} mt-2`}
          />
        </Field>
        <button type="button" onClick={saveDefaultTemplate} className={`${blackButton} mt-4`}>
          Use current catalog as default template
        </button>
      </section>

      {pendingAdd && (
        <Modal
          title={pendingAdd.kind === 'carrier' ? 'Add carrier' : 'Add checklist item'}
          onClose={() => {
            if (!adding) setPendingAdd(null)
          }}
          size="sm"
        >
          <p className="text-sm leading-relaxed text-stone-600">
            {`Add "${pendingAdd.kind === 'carrier' ? pendingAdd.name : pendingAdd.label}" for new teams only, or also give it to every agent already on a team?`}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={outlineButton}
              disabled={adding}
              onClick={() => setPendingAdd(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={outlineButton}
              disabled={adding}
              onClick={() => confirmAdd('new')}
            >
              New teams only
            </button>
            <button
              type="button"
              className={blackButton}
              disabled={adding}
              onClick={() => confirmAdd('existing')}
            >
              {adding ? 'Adding…' : 'All existing agents'}
            </button>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmModal
          title={pendingDelete.kind === 'carrier' ? 'Delete carrier' : 'Delete checklist item'}
          message={
            pendingDelete.kind === 'carrier'
              ? `Delete "${pendingDelete.item.name}"? This cannot be undone.`
              : `Delete "${pendingDelete.item.label}"? This cannot be undone.`
          }
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </main>
  )
}
