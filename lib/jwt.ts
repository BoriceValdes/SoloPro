// lib/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_please'
const JWT_EXPIRES_IN = '7d'

export function signJwt(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, any>
  } catch {
    return null
  }
}
