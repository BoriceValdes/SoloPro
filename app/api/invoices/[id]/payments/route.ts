// app/api/invoices/[id]/payments/route.ts
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

/**
 * @openapi
 * /api/invoices/{id}/payments:
 *   post:
 *     summary: Crée un paiement pour une facture (lien Stripe fictif)
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Paiement créé, lien de paiement renvoyé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       400:
 *         description: ID invalide
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Facture non trouvée
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const maybeUser = await requireAuth()
  if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const { rows } = await query('SELECT * FROM invoices WHERE id = $1', [id])
  const invoice = rows[0]
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const fakeLink = `https://pay.example.com/i/${invoice.id}`

  await query(
    `INSERT INTO payments (invoice_id, provider, amount, provider_ref)
     VALUES ($1, 'stripe', $2, $3)`,
    [invoice.id, invoice.total_ttc, fakeLink]
  )

  return NextResponse.json({ url: fakeLink }, { status: 201 })
}
