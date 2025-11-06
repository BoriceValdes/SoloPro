// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { query } from '@/lib/db'
import { signJwt } from '@/lib/jwt'

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Crée un nouvel utilisateur
 *     description: |
 *       Enregistre un utilisateur en base (fichier JSON) et renvoie un JWT valide.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "azerty123"
 *               name:
 *                 type: string
 *                 example: "Jean Dupont"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: Jeton JWT pour l'authentification
 *       400:
 *         description: Corps de requête invalide
 *       409:
 *         description: L'utilisateur existe déjà
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email, password, name } = body || {}

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)

  const res = await query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, users.name)
     RETURNING id, email, name`,
    [email, hashed, name ?? null]
  )

  const user = res.rows[0]
  const token = signJwt({ sub: user.id, email: user.email })

  await query(`UPDATE users SET token = $1 WHERE id = $2`, [token, user.id])

  return NextResponse.json(
    { user: { id: user.id, email: user.email, name: user.name }, token },
    { status: 201 }
  )
}
