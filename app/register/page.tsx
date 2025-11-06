// app/register/page.tsx
'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erreur lors de la création du compte')
        return
      }

      // Si l'API renvoie bien { user, token }
      // on peut juste prévenir l’utilisateur puis le rediriger vers /login
      setSuccess('Compte créé avec succès. Vous pouvez maintenant vous connecter.')
      // petite pause facultative puis redirection :
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1>Créer un compte</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <label>Nom</label>
          <input
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="vous@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Mot de passe</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Création…' : "S'inscrire"}
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: 'red', marginTop: 12 }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: 'green', marginTop: 12 }}>
            {success}
          </p>
        )}

        <p style={{ marginTop: 12, fontSize: 14 }}>
          Déjà un compte ?{' '}
          <Link href="/login">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
