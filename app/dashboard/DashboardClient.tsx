// app/dashboard/DashboardClient.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type AppointmentView = {
  id: number
  start_at: string
  status: string
}

type DashboardClientProps = {
  clientsCount: number
  invoicesCount: number
  paidCount: number
  sentCount: number
  draftCount: number
  totalRevenue: number
  appointments: AppointmentView[]
}

export default function DashboardClient({
  clientsCount,
  invoicesCount,
  paidCount,
  sentCount,
  draftCount,
  totalRevenue,
  appointments
}: DashboardClientProps) {
  const router = useRouter()
  const { state } = useAuth() // ⚠️ on utilise state, comme dans app/login & withAuth

  useEffect(() => {
    if (!state.loading && !state.token) {
      router.replace('/login')
    }
  }, [state.loading, state.token, router])

  // Pendant le chargement de l'état d'auth
  if (state.loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  // Pas de token → redirection en cours
  if (!state.token) {
    return null
  }

  // Ici, l'utilisateur est connecté
  return (
    <div className="container">
      <h1>Dashboard</h1>

      {/* Vue d'ensemble */}
      <div className="card">
        <h2 className="card-title">Vue d&apos;ensemble</h2>
        <p className="card-subtitle">
          Statistiques calculées côté serveur à partir de{' '}
          <code>data/db.json</code>.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginTop: 12
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Nombre de clients
            </div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{clientsCount}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Nombre de factures
            </div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>
              {invoicesCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              CA encaissé
            </div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>
              {totalRevenue.toFixed(2)} €
            </div>
          </div>
        </div>
      </div>

      {/* Statuts des factures */}
      <div className="card">
        <h2 className="card-title">Statut des factures</h2>
        <p className="card-subtitle">
          Répartition par statut (champ <code>status</code>).
        </p>

        {invoicesCount === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Aucune facture pour le moment.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Payées
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{paidCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Envoyées
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{sentCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Brouillons
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{draftCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Prochains rendez-vous */}
      <div className="card">
        <h2 className="card-title">Prochains rendez-vous</h2>
        <p className="card-subtitle">
          Basé sur la table <code>appointments</code> (
          <code>start_at</code>, <code>status</code>).
        </p>

        {appointments.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Aucun rendez-vous à venir.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {appointments.map((appt) => {
              const d = appt.start_at ? new Date(appt.start_at) : null
              const dateLabel = d
                ? d.toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Date inconnue'

              return (
                <li
                  key={appt.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {dateLabel}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize'
                    }}
                  >
                    Statut : {appt.status}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
