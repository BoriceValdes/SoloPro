// app/login/page.tsx
'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { state, login } = useAuth()

  const [email, setEmail] = useState('demo@solopro.dev')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  // ✅ redirection faite dans un effet, plus dans le rendu
  useEffect(() => {
    if (!state.loading && state.token) {
      router.replace('/dashboard')
    }
  }, [state.loading, state.token, router])

  // Pendant la restauration du token
  if (state.loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  // Si déjà connecté, on ne renvoie rien (l'effet fait la redirection)
  if (!state.loading && state.token) {
    return null
  }

  return (
    <div className="container">
      <h1>Login</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: 'red', marginTop: 12 }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: 12, fontSize: 14 }}>
          Compte de démo (après <code>npm run db:seed</code>) :<br />
          <code>demo@solopro.dev / password</code>
        </p>
      </div>
    </div>
  )
}
