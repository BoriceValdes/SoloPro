'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export function withAuth<P>(Component: React.ComponentType<P>) {
  function Protected(props: P) {
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

    return <Component {...props} />
  }

  return Protected
}
