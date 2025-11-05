'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer
} from 'react'

type User = {
  id: number
  email: string
  name?: string | null
}

type AuthState = {
  user: User | null
  token: string | null
  loading: boolean
}

type AuthAction =
  | { type: 'RESTORE'; payload: { token: string | null; user: User | null } }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'LOGOUT' }

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        loading: false
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        loading: false
      }
    case 'LOGOUT':
      return {
        ...state,
        token: null,
        user: null,
        loading: false
      }
    default:
      return state
  }
}

type AuthContextValue = {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Restaurer la session au chargement
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('solopro_token')
        : null

    if (!token) {
      dispatch({ type: 'RESTORE', payload: { token: null, user: null } })
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          dispatch({
            type: 'RESTORE',
            payload: { token, user: data.user }
          })
        } else {
          localStorage.removeItem('solopro_token')
          dispatch({
            type: 'RESTORE',
            payload: { token: null, user: null }
          })
        }
      } catch {
        dispatch({
          type: 'RESTORE',
          payload: { token: null, user: null }
        })
      }
    })()
  }, [])

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erreur de connexion')
    }

    const data = await res.json()
    const token: string = data.token
    const user: User = data.user

    if (typeof window !== 'undefined') {
      localStorage.setItem('solopro_token', token)
    }

    dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } })
  }

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('solopro_token')
    }
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
