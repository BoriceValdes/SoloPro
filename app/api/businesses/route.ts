// app/api/businesses/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'

const BusinessBody = z.object({
  name: z.string().min(2),
  siren: z.string().optional(),
  siret: z.string().optional(),
  tva_intra: z.string().optional(),
  vat_scheme: z.string().min(1), // ex: "standard", "franchise"
  invoice_prefix: z.string().min(1).default('FAC-'),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional()
})

export async function POST(req: Request) {
  // ⚠️ compatibilité avec ton requireAuth :
  // - soit il renvoie un user {id, email...}
  // - soit il renvoie directement une NextResponse (401)
  const authRes = (await requireAuth()) as any
  if (authRes && 'status' in authRes) {
    // c'est une réponse HTTP (NextResponse)
    return authRes
  }
  const user = authRes as { id: number }

  const json = await req.json().catch(() => ({}))
  const parsed = BusinessBody.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const {
    name,
    siren,
    siret,
    tva_intra,
    vat_scheme,
    invoice_prefix,
    address,
    city,
    zip
  } = parsed.data

  // Option : empêcher plusieurs business pour un même utilisateur
  const existing = await query(
    'SELECT id FROM businesses WHERE owner_id = $1 LIMIT 1',
    [user.id]
  )

  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: 'Un business existe déjà pour cet utilisateur.' },
      { status: 400 }
    )
  }

  const { rows } = await query(
    `INSERT INTO businesses (
       owner_id,
       name,
       siren,
       siret,
       tva_intra,
       vat_scheme,
       invoice_prefix,
       address,
       city,
       zip
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING
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
       created_at`,
    [
      user.id,
      name,
      siren ?? null,
      siret ?? null,
      tva_intra ?? null,
      vat_scheme,
      invoice_prefix || 'FAC-',
      address ?? null,
      city ?? null,
      zip ?? null
    ]
  )

  const business = rows[0]

  return NextResponse.json(business, { status: 201 })
}
