// app/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik'
import * as Yup from 'yup'

type LoginFormValues = {
  email: string
  password: string
}

// Schéma de validation Yup
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Format d’email invalide')
    .required("L'email est obligatoire"),
  password: Yup.string()
    .min(6, 'Au moins 6 caractères')
    .required('Le mot de passe est obligatoire')
})

export default function LoginPage() {
  const router = useRouter()
  const { state, login } = useAuth()

  const [error, setError] = useState<string | null>(null)

  // Redirection si déjà connecté
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

  const initialValues: LoginFormValues = {
    email: 'demo@solopro.dev',
    password: 'password'
  }

  async function handleSubmit(
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) {
    setError(null)
    try {
      await login(values.email, values.password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1>Login</h1>
      <div className="card">
        <Formik<LoginFormValues>
          initialValues={initialValues}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <label>Email</label>
              <Field
                name="email"
                type="email"
                autoComplete="email"
              />
              <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>
                <ErrorMessage name="email" />
              </div>

              <label>Mot de passe</label>
              <Field
                name="password"
                type="password"
                autoComplete="current-password"
              />
              <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>
                <ErrorMessage name="password" />
              </div>

              <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Connexion…' : 'Se connecter'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

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
