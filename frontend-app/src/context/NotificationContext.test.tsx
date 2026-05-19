import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { NotificationProvider, useNotifications } from './NotificationContext'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetNotifications = vi.fn()
const mockMarkAsRead = vi.fn()
const mockMarkAllAsRead = vi.fn()
const mockClearAll = vi.fn()

vi.mock('../services/api', () => ({
  default: {
    getNotifications: (...args: any[]) => mockGetNotifications(...args),
    markNotificationAsRead: (...args: any[]) => mockMarkAsRead(...args),
    markAllNotificationsAsRead: (...args: any[]) => mockMarkAllAsRead(...args),
    clearAllNotifications: (...args: any[]) => mockClearAll(...args),
  },
}))

// AuthContext mock — sobreescribimos por test cuando necesitemos cambiar estado
let mockIsAuthenticated = true
const mockUser = { id: 'u1', email: 'a@b.com', businessName: 'B', phone: '3', nit: '9', role: 'supermarket' as const }

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, user: mockIsAuthenticated ? mockUser : null }),
}))

// ---------------------------------------------------------------------------
// Notificaciones de prueba
// ---------------------------------------------------------------------------

const makeNotification = (overrides: Partial<{ id: number; is_read: boolean; urgent: boolean }> = {}) => ({
  id: 1,
  type: 'donation_request',
  title: 'Nueva solicitud',
  message: 'Se solicita donación',
  created_at: '2026-01-01T00:00:00Z',
  is_read: false,
  urgent: false,
  ...overrides,
})

// ---------------------------------------------------------------------------
// Componente auxiliar
// ---------------------------------------------------------------------------

const NotifConsumer = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()

  return (
    <div>
      <span data-testid="count">{notifications.length}</span>
      <span data-testid="unread">{unreadCount}</span>
      <span data-testid="first-read">{notifications[0] ? String(notifications[0].is_read) : 'none'}</span>
      <button onClick={() => markAsRead(1)}>markAsRead</button>
      <button onClick={markAllAsRead}>markAllAsRead</button>
      <button onClick={clearAll}>clearAll</button>
    </div>
  )
}

const renderWithProvider = () =>
  render(
    <NotificationProvider>
      <NotifConsumer />
    </NotificationProvider>
  )

// ---------------------------------------------------------------------------

describe('NotificationContext — estado inicial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = true
    mockGetNotifications.mockResolvedValue({ success: true, data: [], unreadCount: 0 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('arranca con notifications vacías y unreadCount en 0', async () => {
    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalled())
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('unread').textContent).toBe('0')
  })

  it('llama a getNotifications al montar si el usuario está autenticado', async () => {
    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1))
  })

  it('NO llama a getNotifications si el usuario no está autenticado', async () => {
    mockIsAuthenticated = false
    renderWithProvider()
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    expect(mockGetNotifications).not.toHaveBeenCalled()
  })

  it('carga las notificaciones retornadas por la API', async () => {
    const notifs = [makeNotification({ id: 1 }), makeNotification({ id: 2, is_read: true })]
    mockGetNotifications.mockResolvedValueOnce({ success: true, data: notifs, unreadCount: 1 })

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('2')
      expect(screen.getByTestId('unread').textContent).toBe('1')
    })
  })

  it('no modifica el estado si la API retorna success=false', async () => {
    mockGetNotifications.mockResolvedValueOnce({ success: false })
    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalled())
    expect(screen.getByTestId('count').textContent).toBe('0')
  })
})

// ---------------------------------------------------------------------------

describe('NotificationContext — markAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = true
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('aplica actualización optimista: marca la notificación como leída y decrementa unreadCount', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      success: true,
      data: [makeNotification({ id: 1, is_read: false })],
      unreadCount: 1,
    })
    mockMarkAsRead.mockResolvedValueOnce({ success: true })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('unread').textContent).toBe('1'))

    await act(async () => {
      screen.getByRole('button', { name: 'markAsRead' }).click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('first-read').textContent).toBe('true')
      expect(screen.getByTestId('unread').textContent).toBe('0')
    })
  })

  it('unreadCount no baja de 0', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      success: true,
      data: [makeNotification({ id: 1, is_read: true })],
      unreadCount: 0,
    })
    mockMarkAsRead.mockResolvedValueOnce({ success: true })

    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalled())

    await act(async () => {
      screen.getByRole('button', { name: 'markAsRead' }).click()
    })

    expect(screen.getByTestId('unread').textContent).toBe('0')
  })

  it('revierte el estado y vuelve a cargar si la API falla', async () => {
    const notif = makeNotification({ id: 1, is_read: false })
    mockGetNotifications.mockResolvedValue({
      success: true,
      data: [notif],
      unreadCount: 1,
    })
    mockMarkAsRead.mockRejectedValueOnce(new Error('network error'))

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('unread').textContent).toBe('1'))

    await act(async () => {
      screen.getByRole('button', { name: 'markAsRead' }).click()
    })

    // fetchNotifications se vuelve a llamar (una vez al montar, otra al revertir)
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(2))
  })
})

// ---------------------------------------------------------------------------

describe('NotificationContext — markAllAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = true
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('marca todas las notificaciones como leídas y pone unreadCount en 0', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      success: true,
      data: [makeNotification({ id: 1 }), makeNotification({ id: 2 })],
      unreadCount: 2,
    })
    mockMarkAllAsRead.mockResolvedValueOnce({ success: true })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('unread').textContent).toBe('2'))

    await act(async () => {
      screen.getByRole('button', { name: 'markAllAsRead' }).click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('unread').textContent).toBe('0')
      expect(screen.getByTestId('first-read').textContent).toBe('true')
    })
  })

  it('llama a apiService.markAllNotificationsAsRead', async () => {
    mockGetNotifications.mockResolvedValueOnce({ success: true, data: [], unreadCount: 0 })
    mockMarkAllAsRead.mockResolvedValueOnce({ success: true })

    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalled())

    await act(async () => {
      screen.getByRole('button', { name: 'markAllAsRead' }).click()
    })

    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1)
  })

  it('recarga desde la API si markAllAsRead falla', async () => {
    mockGetNotifications.mockResolvedValue({ success: true, data: [], unreadCount: 0 })
    mockMarkAllAsRead.mockRejectedValueOnce(new Error('server error'))

    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1))

    await act(async () => {
      screen.getByRole('button', { name: 'markAllAsRead' }).click()
    })

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(2))
  })
})

// ---------------------------------------------------------------------------

describe('NotificationContext — clearAll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = true
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('vacía el array de notificaciones y pone unreadCount en 0', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      success: true,
      data: [makeNotification({ id: 1 }), makeNotification({ id: 2 })],
      unreadCount: 2,
    })
    mockClearAll.mockResolvedValueOnce({ success: true })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))

    await act(async () => {
      screen.getByRole('button', { name: 'clearAll' }).click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('0')
      expect(screen.getByTestId('unread').textContent).toBe('0')
    })
  })

  it('llama a apiService.clearAllNotifications', async () => {
    mockGetNotifications.mockResolvedValueOnce({ success: true, data: [], unreadCount: 0 })
    mockClearAll.mockResolvedValueOnce({ success: true })

    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalled())

    await act(async () => {
      screen.getByRole('button', { name: 'clearAll' }).click()
    })

    expect(mockClearAll).toHaveBeenCalledTimes(1)
  })

  it('recarga desde la API si clearAll falla', async () => {
    mockGetNotifications.mockResolvedValue({ success: true, data: [], unreadCount: 0 })
    mockClearAll.mockRejectedValueOnce(new Error('server error'))

    renderWithProvider()
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1))

    await act(async () => {
      screen.getByRole('button', { name: 'clearAll' }).click()
    })

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(2))
  })
})
