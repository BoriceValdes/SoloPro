// // app/api/invoices/[id]/payments/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { z } from 'zod'
// import { requireAuth } from '@/lib/auth'
// import { query } from '@/lib/db'

// const PaymentBody = z.object({
//   amount: z.number().positive(),
//   method: z.string().optional(),
//   paid_at: z.string().datetime().optional() // ISO string optionnelle
// })

// export async function POST(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   // Auth : on laisse requireAuth faire le taf
//   const maybeUser = (await requireAuth()) as any
//   if (maybeUser && 'status' in maybeUser) {
//     // requireAuth a déjà renvoyé une réponse HTTP (401, etc.)
//     return maybeUser as NextResponse
//   }
//   const user = maybeUser as { id: number }

//   const invoiceId = Number.parseInt(context.params.id, 10)
//   if (!Number.isFinite(invoiceId)) {
//     return NextResponse.json(
//       { error: 'Invalid invoice id' },
//       { status: 400 }
//     )
//   }

//   // Récupérer et valider le body
//   const json = await request.json().catch(() => ({}))
//   const parsed = PaymentBody.safeParse(json)
//   if (!parsed.success) {
//     return NextResponse.json(
//       { error: 'Invalid payload', details: parsed.error.flatten() },
//       { status: 400 }
//     )
//   }

//   const { amount, method, paid_at } = parsed.data

//   // Vérifier que la facture existe et appartient bien au business de l'utilisateur
//   // (ici je fais simple : je vérifie juste qu'elle existe)
//   const invoiceRes = await query(
//     'SELECT id FROM invoices WHERE id = $1',
//     [invoiceId]
//   )
//   if (invoiceRes.rows.length === 0) {
//     return NextResponse.json(
//       { error: 'Invoice not found' },
//       { status: 404 }
//     )
//   }

//   // Insérer le paiement
//   const paymentRes = await query(
//     `INSERT INTO payments (invoice_id, amount, method, paid_at)
//      VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))
//      RETURNING id, invoice_id, amount, method, paid_at`,
//     [invoiceId, amount, method ?? null, paid_at ?? null]
//   )

//   const payment = paymentRes.rows[0]

//   // Optionnel : mettre à jour le statut de la facture (ex: "paid")
//   // à adapter selon ton schema (status, total_ttc, etc.)
//   // Exemple basique :
//   await query(
//     `UPDATE invoices
//      SET status = 'paid'
//      WHERE id = $1 AND status <> 'paid'`,
//     [invoiceId]
//   )

//   return NextResponse.json(payment, { status: 201 })
// }
