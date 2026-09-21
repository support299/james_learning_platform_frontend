import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AccountMenu from '../../components/AccountMenu.jsx'

const user = { username: 'pupil', email: 'pupil@example.com' }

async function openMenu(props) {
  const u = userEvent.setup()
  render(
    <MemoryRouter>
      <AccountMenu user={user} onLogout={() => {}} {...props} />
    </MemoryRouter>,
  )
  await u.click(screen.getByRole('button', { name: /account menu/i }))
}

describe('AccountMenu eligibility', () => {
  test('a plain student sees only Profile and Log out — no Admin section at all', async () => {
    await openMenu({ isAdmin: false, onboardingRole: null })
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /courses/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /students/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /onboarding/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /course catalog/i })).not.toBeInTheDocument()
  })

  test('staff with no onboarding role sees Courses/Students/Course catalog, but no Onboarding link', async () => {
    await openMenu({ isAdmin: true, onboardingRole: null })
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /^courses$/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /students/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /course catalog/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /onboarding/i })).not.toBeInTheDocument()
  })

  test.each(['assistant', 'recruiter', 'leadership'])(
    'staff with onboarding role %s additionally sees the Onboarding link',
    async (role) => {
      await openMenu({ isAdmin: true, onboardingRole: role })
      expect(screen.getByRole('menuitem', { name: /onboarding/i })).toBeInTheDocument()
    },
  )

  test('only a superadmin sees the Admin users link', async () => {
    await openMenu({ isAdmin: true, onboardingRole: null, isSuperadmin: true })
    expect(screen.getByRole('menuitem', { name: /admin users/i })).toBeInTheDocument()
  })

  test('plain staff does not see Admin users', async () => {
    await openMenu({ isAdmin: true, onboardingRole: 'assistant', isSuperadmin: false })
    expect(screen.queryByRole('menuitem', { name: /admin users/i })).not.toBeInTheDocument()
  })

  test('a non-staff account never sees Admin users even if the flag leaked', async () => {
    await openMenu({ isAdmin: false, isSuperadmin: true })
    expect(screen.queryByRole('menuitem', { name: /admin users/i })).not.toBeInTheDocument()
  })

  test('a non-staff account is never shown the Onboarding link even if a stray role value were passed', async () => {
    // Defense in depth: onboarding_role is never non-null for is_staff=False
    // server-side (onboarding_role() returns None outright), but the menu
    // itself gates Onboarding behind the same `isAdmin` wrapper as the rest
    // of the Admin section, so a bad value alone can't leak the link.
    await openMenu({ isAdmin: false, onboardingRole: 'assistant' })
    expect(screen.queryByRole('menuitem', { name: /onboarding/i })).not.toBeInTheDocument()
  })
})
