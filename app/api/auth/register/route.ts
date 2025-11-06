// app/api/invoices/[id]/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * @openapi
 * /api/invoices/{id}/payments:
 *   post:
 *     summary: Enregistrer un paiement pour une facture
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 120.5
 *               method:
 *                 type: string
 *                 example: "card"
 *               paid_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-06T10:15:00.000Z"
 *             required:
 *               - amount
 *     responses:
 *       201:
 *         description: Paiement enregistré
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Facture non trouvée
 */

const PaymentBody = z.object({
  amount: z.number().positive(),
  method: z.string().optional(),
  paid_at: z.string().datetime().optional() // ISO 8601 optionnel
})

export async function POST(
  request: NextRequest,
  { params }: any        // 👈 TRÈS IMPORTANT : PAS DE TYPE "{ params: { id: string } }" ici
) {
  try {
    // Auth : même logique que dans tes autres routes
    const authRes = (await requireAuth()) as any
    if (authRes && 'status' in authRes) {
      // requireAuth a renvoyé une NextResponse (401 par ex.)
      return authRes as NextResponse
    }
    const user = authRes as { id: number }

    const invoiceId = Number.parseInt(params.id, 10)
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return NextResponse.json(
        { error: 'Invalid invoice id' },
        { status: 400 }
      )
    }

    // Vérifier que la facture existe
    const invoiceRes = await query(
      'SELECT id FROM invoices WHERE id = $1',
      [invoiceId]
    )
    if (invoiceRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Récupérer et valider le body JSON
    const json = await request.json().catch(() => ({}))
    const parsed = PaymentBody.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { amount, method, paid_at } = parsed.data

    // TODO si tu veux : vérifier que la facture appartient au business de ce user
    // (join invoices -> businesses -> owner_id = user.id)

    // Enregistrer le paiement en base
    const paymentRes = await query(
      `INSERT INTO payments (invoice_id, amount, method, paid_at)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))
       RETURNING id, invoice_id, amount, method, paid_at`,
      [invoiceId, amount, method ?? null, paid_at ?? null]
    )

    const payment = paymentRes.rows[0]

    // Option : mettre la facture à "paid"
    await query(
      `UPDATE invoices
       SET status = 'paid'
       WHERE id = $1 AND status <> 'paid'`,
      [invoiceId]
    )

    return NextResponse.json(payment, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/invoices/[id]/payments ERROR', e)
    return NextResponse.json(
      { error: 'Internal error', detail: String(e?.message || e) },
      { status: 500 }
    )
  }
}
