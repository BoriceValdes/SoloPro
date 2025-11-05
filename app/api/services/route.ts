// app/api/services/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const ServiceBody = z.object({
  businessId: z.coerce.number().int().positive(),
  name: z.string(),
  duration_min: z.number().int().positive(),
  price_ht: z.number().nonnegative(),
  vat_rate: z.number().nonnegative()
})

/**
 * @openapi
 * /api/services:
 *   get:
 *     summary: Liste des services
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des services
 *   post:
 *     summary: Crée un service
 *     tags:
 *       - Services
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
 *               - name
 *               - duration_min
 *               - price_ht
 *               - vat_rate
 *             properties:
 *               businessId:
 *                 type: integer
 *               name:
 *                 type: string
 *               duration_min:
 *                 type: integer
 *               price_ht:
 *                 type: number
 *               vat_rate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Service créé
 *       400:
 *         description: Corps invalide
 *       401:
 *         description: Non autorisé
 */
export async function GET() {
  const maybeUser = await requireAuth()
  if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

  const { rows } = await query('SELECT * FROM services ORDER BY id DESC')
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const maybeUser = await requireAuth()
  if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

  const json = await req.json()
  const parsed = ServiceBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { businessId, name, duration_min, price_ht, vat_rate } = parsed.data
  const { rows } = await query(
    `INSERT INTO services (business_id, name, duration_min, price_ht, vat_rate)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [businessId, name, duration_min, price_ht, vat_rate]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
