'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { withAuth } from '@/components/withAuth'
import { useAuth } from '@/context/AuthContext'

type Invoice = {
  id: number
  number: string
  total_ttc: number
  status: string
}

type InvoiceItemForm = {
  label: string
  qty: number
  unit_price_ht: number
  vat_rate: number
}

function InvoicesPage() {
  const { state } = useAuth()
  const token = state.token
  const router = useRouter()

  const [businessId, setBusinessId] = useState<number | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [form, setForm] = useState<{
    clientId: string
    items: [InvoiceItemForm]
  }>({
    clientId: '1',
    items: [
      { label: 'Prestation', qty: 1, unit_price_ht: 100, vat_rate: 0 }
    ]
  })

  // Business
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

  // Invoices
  useEffect(() => {
    if (!token || businessId === null) return

    fetch('/api/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data)
      })
      .catch((e) => {
        console.error('Erreur chargement factures:', e)
      })
  }, [token, businessId])

  async function addInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (businessId === null) {
      alert("Aucun business. Va d'abord sur la page Mon business.")
      router.push('/business')
      return
    }

    const item = form.items[0]
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        businessId,
        clientId: Number(form.clientId),
        items: [
          {
            label: item.label,
            qty: Number(item.qty),
            unit_price_ht: Number(item.unit_price_ht),
            vat_rate: Number(item.vat_rate)
          }
        ]
      })
    })

    if (res.ok) {
      const created = await res.json()
      setInvoices((inv) => [created, ...inv])
    } else {
      const txt = await res.text()
      alert('Erreur: ' + txt)
    }
  }

  async function generatePdf(id: number) {
    if (!token) return
    const res = await fetch(`/api/invoices/${id}/pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
    } else {
      const txt = await res.text()
      alert('Erreur PDF: ' + txt)
    }
  }

  const item = form.items[0]

  return (
    <div className="container">
      <h1>Factures</h1>

      <div className="card">
        <form onSubmit={addInvoice}>
          <label>Client ID</label>
          <input
            value={form.clientId}
            onChange={(e) =>
              setForm({ ...form, clientId: e.target.value })
            }
          />

          <label>Libellé</label>
          <input
            value={item.label}
            onChange={(e) =>
              setForm({
                ...form,
                items: [{ ...item, label: e.target.value }]
              })
            }
          />

          <label>Qté</label>
          <input
            type="number"
            value={item.qty}
            onChange={(e) =>
              setForm({
                ...form,
                items: [{ ...item, qty: Number(e.target.value) }]
              })
            }
          />

          <label>PU HT</label>
          <input
            type="number"
            value={item.unit_price_ht}
            onChange={(e) =>
              setForm({
                ...form,
                items: [
                  {
                    ...item,
                    unit_price_ht: Number(e.target.value)
                  }
                ]
              })
            }
          />

          <label>TVA (%)</label>
          <input
            type="number"
            value={item.vat_rate}
            onChange={(e) =>
              setForm({
                ...form,
                items: [{ ...item, vat_rate: Number(e.target.value) }]
              })
            }
          />

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={businessId === null}>
              Créer
            </button>
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Numéro</th>
            <th>Total TTC</th>
            <th>Status</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td>{i.id}</td>
              <td>{i.number}</td>
              <td>{i.total_ttc}</td>
              <td>{i.status}</td>
              <td>
                <button
                  type="button"
                  onClick={() => generatePdf(i.id)}
                >
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default withAuth(InvoicesPage)
