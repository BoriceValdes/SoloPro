// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { query } from '@/lib/db'
import { signJwt } from '@/lib/jwt'

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: |
 *       Authentifie un utilisateur avec email + mot de passe et renvoie un JWT.
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
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Connexion réussie
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
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Identifiants invalides
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body || {}

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const { rows } = await query(
    'SELECT id, email, password, name FROM users WHERE email = $1',
    [email]
  )
  const user = rows[0]

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signJwt({ sub: user.id, email: user.email })
  await query('UPDATE users SET token = $1 WHERE id = $2', [token, user.id])

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    token
  })
}
