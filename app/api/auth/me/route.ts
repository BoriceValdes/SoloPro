// app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/auth/me
 * header: Authorization: Bearer <token>
 */
export async function GET() {
  const maybeUser = await requireAuth()
  if ('status' in (maybeUser as any) && (maybeUser as any).status) return maybeUser as any

  const user = maybeUser as any
  return NextResponse.json({ user })
}
