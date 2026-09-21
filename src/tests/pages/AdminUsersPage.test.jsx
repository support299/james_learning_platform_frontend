import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminUsersPage from '../../pages/AdminUsersPage.jsx'

vi.mock('../../components/SiteHeader.jsx', () => ({ default: () => <div /> }))
vi.mock('react-redux', () => ({
  useSelector: () => ({ id: 1, username: 'root' }),
}))

const update = vi.fn()
const demote = vi.fn()
const promote = vi.fn()
const unwrapped = () => ({ unwrap: () => Promise.resolve() })
const admins = [
  { id: 1, username: 'root', email: 'root@x.com', isSuperuser: true, isActive: true },
  { id: 2, username: 'staffer', email: 's@x.com', isSuperuser: false, isActive: true },
]

vi.mock('../../store/adminUsersApi.js', () => ({
  useGetAdminUsersQuery: () => ({ data: admins, isLoading: false }),
  useCreateAdminUserMutation: () => [vi.fn(), {}],
  useUpdateAdminUserMutation: () => [(a) => (update(a), unwrapped()), {}],
  useDeleteAdminUserMutation: () => [vi.fn(), {}],
  useDemoteFromStaffMutation: () => [(a) => (demote(a), unwrapped()), {}],
  usePromoteToStaffMutation: () => [(a) => (promote(a), unwrapped()), {}],
}))
vi.mock('../../store/studentsApi.js', () => ({
  useGetStudentsQuery: () => ({
    data: [{ id: 9, username: 'pupil', email: 'p@x.com', firstName: 'Pat', lastName: 'Pupil' }],
  }),
}))

beforeEach(() => vi.clearAllMocks())

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>,
  )

describe('AdminUsersPage', () => {
  test('shows role badges and gives your own row no actions', () => {
    renderPage()
    expect(screen.getByText('Superadmin')).toBeInTheDocument()
    expect(screen.getByText('Staff')).toBeInTheDocument()
    expect(screen.getByText('(you)')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /make superadmin/i })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /delete root/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete staffer/i })).toBeInTheDocument()
  })

  test('Make superadmin patches is_superuser on that row', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /make superadmin/i }))
    expect(update).toHaveBeenCalledWith({ id: 2, isSuperuser: true })
  })

  test('Remove access asks for confirmation, then demotes', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /remove access/i }))
    expect(demote).not.toHaveBeenCalled()
    await userEvent.click(screen.getAllByRole('button', { name: /remove access/i }).at(-1))
    expect(demote).toHaveBeenCalledWith(2)
  })

  test('Add Admin can promote an existing account', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /add admin/i }))
    await userEvent.click(screen.getByRole('button', { name: /make staff/i }))
    expect(promote).toHaveBeenCalledWith(9)
  })
})
