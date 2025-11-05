'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { withAuth } from '@/components/withAuth'
import { useAuth } from '@/context/AuthContext'

type Client = {
  id: number
  first_name: string
  last_name: string
  email?: string
}

function ClientsPage() {
  const { state } = useAuth()
  const token = state.token
  const router = useRouter()

  const [businessId, setBusinessId] = useState<number | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  // 1) Récupérer le business de l'utilisateur
  useEffect(() => {
    if (!token) return

    ;(async () => {
      try {
        const res = await fetch('/api/businesses/me', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.ok) {
          const data = await res.json()
          setBusinessId(data.id)
        } else if (res.status === 404) {
          // 👉 aucun business : on envoie directement vers la page de création
          router.push('/business')
        } else {
          console.error('Erreur business:', await res.text())
        }
      } catch (e) {
        console.error('Erreur réseau business:', e)
      }
    })()
  }, [token, router])

  // 2) Charger les clients une fois qu'on a un business
  useEffect(() => {
    if (!token || businessId === null) return

    fetch('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data)
      })
      .catch((e) => {
        console.error('Erreur chargement clients:', e)
      })
  }, [token, businessId])

  async function addClient(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (businessId === null) {
      alert("Aucun business. Va d'abord sur la page Mon business.")
      router.push('/business')
      return
    }

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        businessId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email
      })
    })

    if (res.ok) {
      const created = await res.json()
      setClients((c) => [created, ...c])
      setForm({ firstName: '', lastName: '', email: '' })
    } else {
      const txt = await res.text()
      alert('Erreur: ' + txt)
    }
  }

  return (
    <div className="container">
      <h1>Clients</h1>

      <div className="card">
        <form onSubmit={addClient}>
          <label>Prénom</label>
          <input
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
          />

          <label>Nom</label>
          <input
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
          />

          <label>Email</label>
          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={businessId === null}>
              Ajouter
            </button>
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>
                {c.first_name} {c.last_name}
              </td>
              <td>{c.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default withAuth(ClientsPage)
