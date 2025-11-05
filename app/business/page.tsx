// app/business/page.tsx
'use client'

import { FormEvent, useEffect, useState } from 'react'
import { withAuth } from '@/components/withAuth'
import { useAuth } from '@/context/AuthContext'

type Business = {
  id: number
  name: string
  siren?: string | null
  siret?: string | null
  tva_intra?: string | null
  vat_scheme: string
  invoice_prefix: string
  address?: string | null
  city?: string | null
  zip?: string | null
  created_at: string
}

function BusinessPage() {
  const { state } = useAuth()
  const token = state.token

  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<Business | null>(null)

  const [name, setName] = useState('')
  const [siren, setSiren] = useState('')
  const [siret, setSiret] = useState('')
  const [tvaIntra, setTvaIntra] = useState('')
  const [vatScheme, setVatScheme] = useState('standard')
  const [invoicePrefix, setInvoicePrefix] = useState('FAC-')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    ;(async () => {
      try {
        const res = await fetch('/api/businesses/me', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.ok) {
          const data = await res.json()
          setBusiness(data)
        } else if (res.status === 404) {
          setBusiness(null)
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Erreur lors du chargement du business.')
        }
      } catch {
        setError('Erreur réseau lors du chargement du business.')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null)

    const res = await fetch('/api/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        siren,
        siret,
        tva_intra: tvaIntra,
        vat_scheme: vatScheme,
        invoice_prefix: invoicePrefix,
        address,
        city,
        zip
      })
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Erreur lors de la création du business.')
      return
    }

    const created = await res.json()
    setBusiness(created)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Mon business</h1>

      {business ? (
        <div className="card">
          <h2>{business.name}</h2>
          <p>
            Régime de TVA : <strong>{business.vat_scheme}</strong>
          </p>
          <p>
            Préfixe facture : <code>{business.invoice_prefix}</code>
          </p>
          {business.siren && <p>SIREN : {business.siren}</p>}
          {business.siret && <p>SIRET : {business.siret}</p>}
          {business.tva_intra && <p>TVA intracom : {business.tva_intra}</p>}
          {business.address && (
            <p>
              Adresse : {business.address}
              {business.zip && `, ${business.zip}`}
              {business.city && ` ${business.city}`}
            </p>
          )}
          <p style={{ fontSize: 12, marginTop: 8 }}>
            Créé le :{' '}
            {new Date(business.created_at).toLocaleString('fr-FR')}
          </p>
        </div>
      ) : (
        <div className="card">
          <p>Aucun business n&apos;est encore créé pour ce compte.</p>
          <form onSubmit={handleSubmit}>
            <label>Nom du business *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label>SIREN (optionnel)</label>
            <input
              value={siren}
              onChange={(e) => setSiren(e.target.value)}
            />

            <label>SIRET (optionnel)</label>
            <input
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
            />

            <label>TVA intra (optionnel)</label>
            <input
              value={tvaIntra}
              onChange={(e) => setTvaIntra(e.target.value)}
            />

            <label>Régime de TVA *</label>
            <input
              value={vatScheme}
              onChange={(e) => setVatScheme(e.target.value)}
            />

            <label>Préfixe des factures *</label>
            <input
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
            />

            <label>Adresse (optionnel)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <label>Ville (optionnel)</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <label>Code postal (optionnel)</label>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />

            <div style={{ marginTop: 12 }}>
              <button type="submit">Créer mon business</button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="card" style={{ marginTop: 12 }}>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      )}
    </div>
  )
}

export default withAuth(BusinessPage)
