'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const Protected: React.FC<P> = (props) => {
    const { state } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!state.loading && !state.token) {
        router.replace('/login')
      }
    }, [state.loading, state.token, router])

    if (state.loading) {
      return (
        <div className="container">
          <div className="card">
            <p>Chargement de la session...</p>
          </div>
        </div>
      )
    }

    if (!state.token) {
      // Redirection en cours
      return null
    }

    // ✅ ici les types sont clairs : P pour les props, pas d'erreur TS
    return <WrappedComponent {...props} />
  }

  Protected.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`

  return Protected
}
