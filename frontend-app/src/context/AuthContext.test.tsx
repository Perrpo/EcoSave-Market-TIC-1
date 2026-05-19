import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// ---------------------------------------------------------------------------
// Componente auxiliar para exponer el contexto en el DOM
// ---------------------------------------------------------------------------

const AuthConsumer = () => {
  const { isAuthenticated, user, token, isReady, login, logout, register, getAuthHeaders } =
    useAuth()

  return (
    <div>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="role">{user?.role ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="headers">{JSON.stringify(getAuthHeaders())}</span>
      <button onClick={() => login('a@b.com', 'pass')}>login</button>
      <button onClick={() => register('a@b.com', 'pass', 'Biz', '300', '900', 'supermarket')}>
        register
      </button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  )

// ---------------------------------------------------------------------------

describe('AuthContext — estado inicial', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('isReady pasa a true tras montar el provider', async () => {
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))
  })

  it('isAuthenticated es false cuando no hay sesión en localStorage', async () => {
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))
    expect(screen.getByTestId('auth').textContent).toBe('false')
  })

  it('restaura sesión desde localStorage al montar', async () => {
    const fakeUser = { id: '1', email: 'a@b.com', businessName: 'B', phone: '3', nit: '9', role: 'supermarket' as const }
    localStorage.setItem('token', 'tok123')
    localStorage.setItem('user', JSON.stringify(fakeUser))

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('true')
      expect(screen.getByTestId('token').textContent).toBe('tok123')
      expect(screen.getByTestId('role').textContent).toBe('supermarket')
    })
  })

  it('no restaura sesión si el JSON en localStorage es inválido', async () => {
    localStorage.setItem('token', 'tok123')
    localStorage.setItem('user', 'NOT_JSON')

    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))
    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(localStorage.getItem('token')).toBeNull()
  })
})

// ---------------------------------------------------------------------------

describe('AuthContext — login', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('login exitoso actualiza isAuthenticated, token y user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'jwt-abc',
        user: { id: 'u1', email: 'a@b.com', businessName: 'Biz', phone: '3', nit: '9', role: 'supermarket' },
      }),
    } as Response)

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))

    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('true')
      expect(screen.getByTestId('token').textContent).toBe('jwt-abc')
      expect(screen.getByTestId('role').textContent).toBe('supermarket')
    })
  })

  it('login exitoso guarda token y user en localStorage', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com', businessName: 'Biz', phone: '3', nit: '9', role: 'ong' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'jwt-xyz', user: fakeUser }),
    } as Response)

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))

    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click()
    })

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('jwt-xyz')
      expect(JSON.parse(localStorage.getItem('user')!).role).toBe('ong')
    })
  })

  it('login fallido retorna success=false y no cambia el estado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Credenciales inválidas' }),
    } as Response)

    let loginResult: any
    const TestComp = () => {
      const { login } = useAuth()
      return (
        <button
          onClick={async () => {
            loginResult = await login('x@x.com', 'bad')
          }}
        >
          go
        </button>
      )
    }

    render(<AuthProvider><TestComp /></AuthProvider>)
    await act(async () => { screen.getByRole('button', { name: 'go' }).click() })

    await waitFor(() => {
      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toMatch(/credenciales inválidas/i)
    })
  })
})

// ---------------------------------------------------------------------------

describe('AuthContext — logout', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('logout limpia isAuthenticated, user y token', async () => {
    const fakeUser = { id: '1', email: 'a@b.com', businessName: 'B', phone: '3', nit: '9', role: 'supermarket' as const }
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify(fakeUser))

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'))

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click()
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('token').textContent).toBe('none')
    expect(screen.getByTestId('role').textContent).toBe('none')
  })

  it('logout elimina token y user de localStorage', async () => {
    const fakeUser = { id: '1', email: 'a@b.com', businessName: 'B', phone: '3', nit: '9', role: 'supermarket' as const }
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify(fakeUser))

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'))

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

// ---------------------------------------------------------------------------

describe('AuthContext — getAuthHeaders', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('incluye Authorization Bearer cuando hay token activo', async () => {
    const fakeUser = { id: '1', email: 'a@b.com', businessName: 'B', phone: '3', nit: '9', role: 'supermarket' as const }
    localStorage.setItem('token', 'mi-token')
    localStorage.setItem('user', JSON.stringify(fakeUser))

    renderWithProvider()

    await waitFor(() => {
      const headers = JSON.parse(screen.getByTestId('headers').textContent!)
      expect(headers['Authorization']).toBe('Bearer mi-token')
    })
  })
})
