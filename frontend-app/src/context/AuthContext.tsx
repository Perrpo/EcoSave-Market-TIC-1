import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  businessName: string;
  phone: string;
  nit: string;
  role: 'supermarket' | 'ong' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string, role?: 'supermarket' | 'ong' | 'admin') => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (email: string, password: string, businessName: string, phone: string, nit: string, role: 'supermarket' | 'ong' | 'admin') => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializar estado desde localStorage de forma síncrona para evitar flash
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restaurar sesión guardada si existe
  React.useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string, role?: 'supermarket' | 'ong' | 'admin') => {
    try {
      const requestBody: any = { email, password };
      if (role) {
        requestBody.role = role;
      }

      const response = await fetch('http://localhost:3333/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        // Mejorar mensaje de error para usuarios no confirmados
        let errorMessage = error.message;
        if (response.status === 401 && errorMessage.toLowerCase().includes('email')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Actualizar estado de forma atómica
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Retornar el usuario para que AuthForm pueda navegar correctamente
      return { success: true, user: data.user as User };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, businessName: string, phone: string, nit: string, role: 'supermarket' | 'ong' | 'admin') => {
    try {
      const response = await fetch('http://localhost:3333/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, business_name: businessName, phone, nit, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return { 
        success: true,
        message: 'Registro exitoso. Si Supabase requiere confirmación de email, revisa tu bandeja de entrada antes de iniciar sesión.'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const getAuthHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        isReady,
        login,
        register,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
