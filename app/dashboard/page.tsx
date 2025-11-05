// app/dashboard/page.tsx
import { query } from '@/lib/db'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Clients
  const { rows: clientsCountRows } = await query(
    'SELECT COUNT(*)::int AS count FROM clients'
  )
  const clientsCount = clientsCountRows[0]?.count ?? 0

  // Invoices
  const { rows: invoices } = await query('SELECT status, total_ttc FROM invoices')
  const invoicesCount = invoices.length

  const normalize = (s: string | null) => s?.toLowerCase() ?? ''
  const paidInvoices = invoices.filter((i) => normalize(i.status) === 'paid')
  const sentInvoices = invoices.filter((i) => normalize(i.status) === 'sent')
  const draftInvoices = invoices.filter((i) => normalize(i.status) === 'draft')

  const paidCount = paidInvoices.length
  const sentCount = sentInvoices.length
  const draftCount = draftInvoices.length

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.total_ttc || 0), 0)

  // Appointments à venir
  const { rows: appointments } = await query(
    `SELECT id, start_at, status FROM appointments 
     WHERE start_at >= NOW() 
     ORDER BY start_at ASC 
     LIMIT 5`
  )

  return (
    <DashboardClient
      clientsCount={clientsCount}
      invoicesCount={invoicesCount}
      paidCount={paidCount}
      sentCount={sentCount}
      draftCount={draftCount}
      totalRevenue={totalRevenue}
      appointments={appointments}
    />
  )
}
