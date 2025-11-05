// app/ssr-dashboard/page.tsx
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SsrDashboard() {
  const { rows: clientsCountRows } = await query(
    'SELECT COUNT(*)::int AS count FROM clients'
  )
  const { rows: invoices } = await query('SELECT status, total_ttc FROM invoices')
  const { rows: appointments } = await query(
    `SELECT id, start_at, status FROM appointments 
     WHERE start_at >= NOW() 
     ORDER BY start_at ASC 
     LIMIT 5`
  )

  const clientsCount = clientsCountRows[0]?.count ?? 0
  const invoicesCount = invoices.length

  const normalize = (s: string | null) => s?.toLowerCase() ?? ''
  const paidInvoices = invoices.filter((i) => normalize(i.status) === 'paid')
  const draftInvoices = invoices.filter((i) => normalize(i.status) === 'draft')
  const sentInvoices = invoices.filter((i) => normalize(i.status) === 'sent')

  const paidCount = paidInvoices.length
  const draftCount = draftInvoices.length
  const sentCount = sentInvoices.length

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.total_ttc || 0), 0)

  return (
    <div className="container">
      <h1>Dashboard (SSR)</h1>

      <div className="card">
        <p>
          Nombre de clients : <strong>{clientsCount}</strong>
        </p>
        <p>
          Nombre de factures : <strong>{invoicesCount}</strong>
        </p>
        <p>
          CA total encaissé : <strong>{totalRevenue.toFixed(2)} €</strong>
        </p>
      </div>

      <div className="card">
        <h2>Statuts des factures</h2>
        <ul>
          <li>Payées : {paidCount}</li>
          <li>Envoyées : {sentCount}</li>
          <li>Brouillons : {draftCount}</li>
        </ul>
      </div>

      <div className="card">
        <h2>Prochains rendez-vous</h2>
        {appointments.length === 0 ? (
          <p>Aucun rendez-vous à venir</p>
        ) : (
          <ul>
            {appointments.map((a) => (
              <li key={a.id}>
                {new Date(a.start_at).toLocaleString('fr-FR')} — {a.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
