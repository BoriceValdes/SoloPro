// app/api/businesses/me/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const authRes = (await requireAuth()) as any
  if (authRes && 'status' in authRes) {
    return authRes
  }
  const user = authRes as { id: number }

  const { rows } = await query(
    `SELECT
       id,
       owner_id,
       name,
       siren,
       siret,
       tva_intra,
       vat_scheme,
       invoice_prefix,
       address,
       city,
       zip,
       created_at
     FROM businesses
     WHERE owner_id = $1
     ORDER BY id ASC
     LIMIT 1`,
    [user.id]
  )

  const business = rows[0]

  if (!business) {
    return NextResponse.json(
      { error: 'No business found' },
      { status: 404 }
    )
  }

  return NextResponse.json(business)
}
