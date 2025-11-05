'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { withAuth } from '@/components/withAuth'
import { useAuth } from '@/context/AuthContext'

type Service = {
  id: number
  name: string
  duration_min: number
  price_ht: number
  vat_rate: number
}

function ServicesPage() {
  const { state } = useAuth()
  const token = state.token
  const router = useRouter()

  const [businessId, setBusinessId] = useState<number | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [form, setForm] = useState({
    name: '',
    duration_min: 60,
    price_ht: 80,
    vat_rate: 0
  })

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
          router.push('/business')
        } else {
          console.error('Erreur business:', await res.text())
        }
      } catch (e) {
        console.error('Erreur réseau business:', e)
      }
    })()
  }, [token, router])

  useEffect(() => {
    if (!token || businessId === null) return

    fetch('/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data)
      })
      .catch((e) => {
        console.error('Erreur chargement services:', e)
      })
  }, [token, businessId])

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (businessId === null) {
      alert("Aucun business. Va d'abord sur la page Mon business.")
      router.push('/business')
      return
    }

    const res = await fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        businessId,
        name: form.name,
        duration_min: Number(form.duration_min),
        price_ht: Number(form.price_ht),
        vat_rate: Number(form.vat_rate)
      })
    })

    if (res.ok) {
      const created = await res.json()
      setServices((s) => [created, ...s])
      setForm((f) => ({ ...f, name: '' }))
    } else {
      const txt = await res.text()
      alert('Erreur: ' + txt)
    }
  }

  return (
    <div className="container">
      <h1>Services</h1>

      <div className="card">
        <form onSubmit={addService}>
          <label>Nom</label>
          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <label>Durée (min)</label>
          <input
            type="number"
            value={form.duration_min}
            onChange={(e) =>
              setForm({
                ...form,
                duration_min: Number(e.target.value)
              })
            }
          />

          <label>Prix HT</label>
          <input
            type="number"
            value={form.price_ht}
            onChange={(e) =>
              setForm({
                ...form,
                price_ht: Number(e.target.value)
              })
            }
          />

          <label>TVA (%)</label>
          <input
            type="number"
            value={form.vat_rate}
            onChange={(e) =>
              setForm({
                ...form,
                vat_rate: Number(e.target.value)
              })
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
            <th>Durée</th>
            <th>Prix HT</th>
            <th>TVA</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.duration_min} min</td>
              <td>{s.price_ht}</td>
              <td>{s.vat_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default withAuth(ServicesPage)
