// lib/auth.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyJwt } from './jwt'
import { loadDB } from './jsonDb'

/**
 * Retourne soit une NextResponse (401/erreur),
 * soit un objet user { id, email, name }.
 */
export async function requireAuth() {
  const auth = (await headers()).get('authorization') || ''
  const token = auth.replace(/Bearer\s+/i, '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = verifyJwt(token)
  if (!payload || !payload.sub) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userId =
    typeof payload.sub === 'string' ? Number.parseInt(payload.sub, 10) : payload.sub

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
  }

  const db = await loadDB()
  const user = db.users.find((u) => u.id === userId)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // On ne renvoie que les champs utiles
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null
  }
}
