import { useState } from 'react'
import {
  useGetMyOnboardingQuery,
  usePatchCarrierRequirementMutation,
  usePatchChecklistItemMutation,
} from '../../store/onboardingApi.js'
import { errorMessage } from '../../components/onboarding/StatusPill.jsx'
import AgentWorkspace from '../../components/onboarding/AgentWorkspace.jsx'

export default function AgentSelfPage() {
  const { data, isLoading, isError, error: loadError } = useGetMyOnboardingQuery()
  const [patchItem] = usePatchChecklistItemMutation()
  const [patchCarrier] = usePatchCarrierRequirementMutation()
  const [error, setError] = useState(null)

  const run = async (fn) => {
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(errorMessage(err, 'Could not save that change.'))
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#f6f5f2]">
        <p className="text-sm text-stone-500">Loading your onboarding…</p>
      </main>
    )
  }

  if (isError || !data) {
    const detail = loadError?.data?.detail
    return (
      <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center bg-[#f6f5f2] px-8">
        <p className="text-sm font-medium text-red-600">
          {typeof detail === 'string'
            ? detail
            : 'No onboarding case is linked to this account.'}
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[#f6f5f2]">
      <div className="mx-auto w-full max-w-5xl px-8 py-10">
        <AgentWorkspace
          agent={data}
          staff={data.staff ?? []}
          writable
          error={error}
          run={run}
          patchItem={patchItem}
          patchCarrier={patchCarrier}
          showBack={false}
          showAtRisk={false}
          showOutstanding={false}
          showLoginMeta={false}
        />
      </div>
    </main>
  )
}
