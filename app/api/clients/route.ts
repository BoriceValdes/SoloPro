// app/api/clients/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const ClientBody = z.object({
  businessId: z.coerce.number().int().positive(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional()
})

/**
 * @openapi
 * /api/clients:
 *   get:
 *     summary: Liste des clients
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des clients
 *   post:
 *     summary: Crée un client
 *     tags:
 *       - Clients
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
 *               - firstName
 *               - lastName
 *             properties:
 *               businessId:
 *                 type: integer
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client créé
 *       400:
 *         description: Corps invalide
 *       401:
 *         description: Non autorisé
 */
export async function GET() {
  const maybeUser = await requireAuth()
  if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

  const { rows } = await query('SELECT * FROM clients ORDER BY id DESC')
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const maybeUser = await requireAuth()
  if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

  const json = await req.json()
  const parsed = ClientBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { businessId, firstName, lastName, email, phone } = parsed.data
  const { rows } = await query(
    `INSERT INTO clients (business_id, first_name, last_name, email, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [businessId, firstName, lastName, email ?? null, phone ?? null]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
