import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthForm from './AuthForm'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()
const mockLogin = vi.fn()
const mockRegister = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderForm = () => render(<AuthForm />)

const switchToRegister = async () => {
  const btn = screen.getByRole('button', { name: /quiero registrarme/i })
  await userEvent.click(btn)
}

const fillRegisterForm = async (overrides: Record<string, string> = {}) => {
  const defaults = {
    businessName: 'Supermercado Test',
    phone: '3001234567',
    nit: '900123456',
    email: 'test@example.com',
    password: 'Password1',
  }
  const values = { ...defaults, ...overrides }

  if (screen.queryByPlaceholderText(/mercacentro/i)) {
    await userEvent.type(screen.getByPlaceholderText(/mercacentro/i), values.businessName)
  }
  if (values.phone) {
    await userEvent.type(screen.getByPlaceholderText(/\+57/i), values.phone)
  }
  if (values.nit) {
    await userEvent.type(screen.getByPlaceholderText(/900123456/i), values.nit)
  }
  await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), values.email)
  await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), values.password)
}

// ---------------------------------------------------------------------------

describe('AuthForm — renderizado inicial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderForm()
  })

  it('muestra el formulario de login por defecto', () => {
    expect(screen.getByRole('heading', { name: /inicia sesión/i })).toBeInTheDocument()
  })

  it('muestra botón para cambiar a registro', () => {
    expect(screen.getByRole('button', { name: /quiero registrarme/i })).toBeInTheDocument()
  })

  it('muestra campos de email y contraseña', () => {
    expect(screen.getByPlaceholderText(/correo@ejemplo\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toBeInTheDocument()
  })

  it('muestra los role-cards de Supermercado y ONG', () => {
    expect(screen.getByText('Supermercado')).toBeInTheDocument()
    expect(screen.getByText('ONG')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------

describe('AuthForm — cambio de pestaña', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderForm()
  })

  it('al hacer clic en "Quiero registrarme" muestra el heading de registro', async () => {
    await switchToRegister()
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument()
  })

  it('en modo registro aparece el campo Razón Social', async () => {
    await switchToRegister()
    expect(screen.getByPlaceholderText(/mercacentro/i)).toBeInTheDocument()
  })

  it('en modo registro aparece el campo Teléfono', async () => {
    await switchToRegister()
    expect(screen.getByPlaceholderText(/\+57/i)).toBeInTheDocument()
  })

  it('en modo registro aparece el campo NIT', async () => {
    await switchToRegister()
    expect(screen.getByPlaceholderText(/900123456/i)).toBeInTheDocument()
  })

  it('volver a login desde registro oculta el campo Razón Social', async () => {
    await switchToRegister()
    await userEvent.click(screen.getByRole('button', { name: /ya tengo cuenta/i }))
    expect(screen.queryByPlaceholderText(/mercacentro/i)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------

describe('AuthForm — validaciones en modo login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderForm()
  })

  it('muestra error si se envía sin email ni contraseña', async () => {
    fireEvent.submit(screen.getByRole('button', { name: /ingresar/i }).closest('form')!)
    expect(await screen.findByText(/email y contraseña son requeridos/i)).toBeInTheDocument()
  })

  it('no llama a auth.login si faltan campos', async () => {
    fireEvent.submit(screen.getByRole('button', { name: /ingresar/i }).closest('form')!)
    expect(mockLogin).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------

describe('AuthForm — validaciones en modo registro', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    renderForm()
    await switchToRegister()
  })

  it('error cuando el nombre del negocio está vacío', async () => {
    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password1')
    fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)
    expect(await screen.findByText(/nombre o razón social es requerido/i)).toBeInTheDocument()
  })

  it('error cuando el teléfono es inválido', async () => {
    await userEvent.type(screen.getByPlaceholderText(/mercacentro/i), 'Test')
    await userEvent.type(screen.getByPlaceholderText(/\+57/i), 'abc')
    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password1')
    fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)
    expect(await screen.findByText(/número de teléfono válido/i)).toBeInTheDocument()
  })

  it('error cuando el NIT no tiene el formato correcto', async () => {
    await userEvent.type(screen.getByPlaceholderText(/mercacentro/i), 'Test')
    await userEvent.type(screen.getByPlaceholderText(/\+57/i), '3001234567')
    await userEvent.type(screen.getByPlaceholderText(/900123456/i), 'NOVALIDO')
    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password1')
    fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)
    expect(await screen.findByText(/nit válido/i)).toBeInTheDocument()
  })

  it('error cuando la contraseña tiene menos de 8 caracteres', async () => {
    await userEvent.type(screen.getByPlaceholderText(/mercacentro/i), 'Test')
    await userEvent.type(screen.getByPlaceholderText(/\+57/i), '3001234567')
    await userEvent.type(screen.getByPlaceholderText(/900123456/i), '900123456')
    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Ab1')
    fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)
    expect(await screen.findByText(/al menos 8 caracteres/i)).toBeInTheDocument()
  })

  it('error cuando la contraseña no tiene mayúscula', async () => {
    await userEvent.type(screen.getByPlaceholderText(/mercacentro/i), 'Test')
    await userEvent.type(screen.getByPlaceholderText(/\+57/i), '3001234567')
    await userEvent.type(screen.getByPlaceholderText(/900123456/i), '900123456')
    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'password1')
    fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)
    expect(await screen.findByText(/letra mayúscula/i)).toBeInTheDocument()
  })

  it('error cuando la contraseña no tiene número', async () => {
    await userEvent.type(screen.getByPlaceholderText(/mercacentro/i), 'Test')
    await userEvent.type(screen.getByPlaceholderText(/\+57/i), '3001234567')
    await userEvent.type(screen.getByPlaceholderText(/900123456/i), '900123456')
    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password')
    fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)
    expect(await screen.findByText(/al menos un número/i)).toBeInTheDocument()
  })

  it('muestra campo "Área de misión" solo cuando el rol es ONG', async () => {
    // Por defecto es supermarket, no debe aparecer
    expect(screen.queryByText(/área de misión/i)).not.toBeInTheDocument()

    // Seleccionar ONG
    await userEvent.click(screen.getByText('ONG'))
    expect(screen.getByText(/área de misión/i)).toBeInTheDocument()
  })

  it('error cuando ONG no selecciona área de misión', async () => {
    await userEvent.click(screen.getByText('ONG'))
    await fillRegisterForm()
    fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)
    expect(await screen.findByText(/área de misión es requerida/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------

describe('AuthForm — toggle de contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderForm()
  })

  it('la contraseña empieza oculta (type="password")', () => {
    expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toHaveAttribute('type', 'password')
  })

  it('al hacer clic en "Mostrar" cambia a type="text"', async () => {
    await userEvent.click(screen.getByRole('button', { name: /mostrar/i }))
    expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toHaveAttribute('type', 'text')
  })

  it('al hacer clic en "Ocultar" vuelve a type="password"', async () => {
    await userEvent.click(screen.getByRole('button', { name: /mostrar/i }))
    await userEvent.click(screen.getByRole('button', { name: /ocultar/i }))
    expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toHaveAttribute('type', 'password')
  })
})

// ---------------------------------------------------------------------------

describe('AuthForm — flujo de login con mock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderForm()
  })

  it('navega a /dashboard tras login exitoso de supermercado', async () => {
    mockLogin.mockResolvedValueOnce({ success: true, user: { role: 'supermarket' } })

    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password1')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('navega a /dashboard-ong tras login exitoso de ONG', async () => {
    mockLogin.mockResolvedValueOnce({ success: true, user: { role: 'ong' } })

    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'ong@test.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password1')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard-ong'))
  })

  it('navega a /dashboard-admin tras login exitoso de admin', async () => {
    mockLogin.mockResolvedValueOnce({ success: true, user: { role: 'admin' } })

    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'admin@test.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password1')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard-admin'))
  })

  it('muestra mensaje de error cuando login falla', async () => {
    mockLogin.mockResolvedValueOnce({ success: false, error: 'Credenciales inválidas' })

    await userEvent.type(screen.getByPlaceholderText(/correo@ejemplo\.com/i), 'bad@test.com')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Password1')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------

describe('AuthForm — flujo de registro con mock', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    renderForm()
    await switchToRegister()
  })

  it('registro exitoso cambia a pestaña login y muestra mensaje de éxito', async () => {
    mockRegister.mockResolvedValueOnce({ success: true, message: 'Registro exitoso.' })

    await fillRegisterForm()
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /inicia sesión/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/registro exitoso/i)).toBeInTheDocument()
  })

  it('registro fallido muestra mensaje de error', async () => {
    mockRegister.mockResolvedValueOnce({ success: false, error: 'Email ya registrado' })

    await fillRegisterForm()
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText('Email ya registrado')).toBeInTheDocument()
  })
})
