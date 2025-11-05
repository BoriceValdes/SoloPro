// app/api/invoices/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const Item = z.object({
  label: z.string(),
  qty: z.number().int().positive(),
  unit_price_ht: z.number().nonnegative(),
  vat_rate: z.number().nonnegative()
})

const Body = z.object({
  businessId: z.coerce.number().int().positive(),
  clientId: z.coerce.number().int().positive(),
  items: z.array(Item).min(1)
})

/**
 * @openapi
 * /api/invoices:
 *   get:
 *     summary: Liste des factures
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des factures avec leurs lignes
 *   post:
 *     summary: Crée une facture avec lignes
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - clientId
 *               - items
 *             properties:
 *               businessId:
 *                 type: integer
 *               clientId:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - label
 *                     - qty
 *                     - unit_price_ht
 *                     - vat_rate
 *                   properties:
 *                     label:
 *                       type: string
 *                     qty:
 *                       type: integer
 *                     unit_price_ht:
 *                       type: number
 *                     vat_rate:
 *                       type: number
 *     responses:
 *       201:
 *         description: Facture créée
 *       400:
 *         description: Corps invalide
 *       401:
 *         description: Non autorisé
 */
export async function GET() {
  const maybeUser = await requireAuth()
  if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

  const { rows } = await query(`
    SELECT i.*, COALESCE(json_agg(ii.*) FILTER (WHERE ii.id IS NOT NULL), '[]') AS items
    FROM invoices i
    LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
    GROUP BY i.id
    ORDER BY i.id DESC
  `)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  try {
    const maybeUser = await requireAuth()
    if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

    const json = await req.json()
    const parsed = Body.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { businessId, clientId, items } = parsed.data

    // calcul des totaux
    const totals = items.reduce(
      (acc, it) => {
        const lineHT = it.unit_price_ht * it.qty
        const lineVAT = +(lineHT * (it.vat_rate / 100)).toFixed(2)
        acc.ht += lineHT
        acc.vat += lineVAT
        return acc
      },
      { ht: 0, vat: 0 }
    )
    const total_ht = +totals.ht.toFixed(2)
    const total_vat = +totals.vat.toFixed(2)
    const total_ttc = +(total_ht + total_vat).toFixed(2)

    // génération du numéro de facture
    const countRes = await query(
      'SELECT COUNT(*)::int AS count FROM invoices WHERE business_id = $1',
      [businessId]
    )
    const count = countRes.rows[0]?.count ?? 0
    const number = `FAC-${String(Number(count) + 1).padStart(5, '0')}`

    // ✅ INSERT corrigé : 9 colonnes, 9 valeurs
    const invRes = await query(
      `INSERT INTO invoices
       (business_id, client_id, number, issue_date, due_date, status, total_ht, total_vat, total_ttc)
       VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'sent', $4, $5, $6)
       RETURNING *`,
      [businessId, clientId, number, total_ht, total_vat, total_ttc]
    )
    const invoice = invRes.rows[0]

    // lignes de facture
    for (const it of items) {
      const lineHT = it.unit_price_ht * it.qty
      const lineVAT = +(lineHT * (it.vat_rate / 100)).toFixed(2)
      await query(
        `INSERT INTO invoice_items
         (invoice_id, label, qty, unit_price_ht, vat_rate, line_total_ht, line_total_vat)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [invoice.id, it.label, it.qty, it.unit_price_ht, it.vat_rate, lineHT, lineVAT]
      )
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/invoices ERROR', e)
    return NextResponse.json(
      {
        error: 'Internal error',
        detail: String(e?.message || e)
      },
      { status: 500 }
    )
  }
}
