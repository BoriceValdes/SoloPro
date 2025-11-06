// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'

export const runtime = 'nodejs' // pour être sûr d'avoir accès à Node côté serveur

/**
 * @openapi
 * /api/invoices/{id}/pdf:
 *   post:
 *     summary: Génère le PDF d'une facture
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF généré et renvoyé dans la réponse
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: ID invalide
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Facture non trouvée
 */
export async function POST(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const authRes = (await requireAuth()) as any
    if (authRes && 'status' in authRes) {
      // requireAuth a déjà renvoyé une réponse (401, etc.)
      return authRes as NextResponse
    }
    const user = authRes as { id: number }
    // user.id dispo ici si tu veux vérifier que la facture appartient à son business

    const id = Number.parseInt(context.params.id, 10)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const invRes = await query('SELECT * FROM invoices WHERE id = $1', [id])
    const invoice = invRes.rows[0]
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const itemsRes = await query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id',
      [id]
    )
    const items = itemsRes.rows

    const clientRes = await query(
      'SELECT * FROM clients WHERE id = $1',
      [invoice.client_id]
    )
    const client =
      clientRes.rows[0] || { first_name: '', last_name: '', email: '' }

    const bizRes = await query(
      'SELECT * FROM businesses WHERE id = $1',
      [invoice.business_id]
    )
    const business = bizRes.rows[0] || { name: '' }

    // --- Génération du PDF avec pdf-lib ---
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    let y = height - 50

    const fontSizeTitle = 18
    const fontSizeText = 12
    const fontSizeSmall = 10

    // En-tête entreprise
    page.drawText(business.name || 'Mon entreprise', {
      x: 50,
      y,
      size: fontSizeTitle,
      font
    })

    // Facture / dates à droite
    y -= 30
    const rightX = width - 200
    page.drawText(`Facture: ${invoice.number}`, {
      x: rightX,
      y,
      size: fontSizeText,
      font
    })
    y -= 16
    page.drawText(`Émise le: ${String(invoice.issue_date)}`, {
      x: rightX,
      y,
      size: fontSizeText,
      font
    })

    // Infos client
    y -= 40
    page.drawText('Client :', {
      x: 50,
      y,
      size: fontSizeText,
      font
    })
    y -= 16
    page.drawText(
      `${client.first_name || ''} ${client.last_name || ''}`.trim(),
      {
        x: 50,
        y,
        size: fontSizeText,
        font
      }
    )
    if (client.email) {
      y -= 16
      page.drawText(client.email, {
        x: 50,
        y,
        size: fontSizeText,
        font
      })
    }

    // En-tête tableau
    y -= 30
    page.drawText('Désignation', {
      x: 50,
      y,
      size: fontSizeText,
      font
    })
    page.drawText('Qté', {
      x: 280,
      y,
      size: fontSizeText,
      font
    })
    page.drawText('PU HT', {
      x: 330,
      y,
      size: fontSizeText,
      font
    })
    page.drawText('Total HT', {
      x: 420,
      y,
      size: fontSizeText,
      font
    })

    y -= 10
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 0.5
    })

    // Lignes
    y -= 20
    for (const it of items as any[]) {
      if (y < 80) {
        // (simplifié : si trop long, on couperait ici ou on gèrerait une 2e page)
        break
      }

      page.drawText(String(it.label), {
        x: 50,
        y,
        size: fontSizeText,
        font
      })
      page.drawText(String(it.qty), {
        x: 280,
        y,
        size: fontSizeText,
        font
      })
      page.drawText(Number(it.unit_price_ht).toFixed(2) + ' €', {
        x: 330,
        y,
        size: fontSizeText,
        font
      })
      page.drawText(Number(it.line_total_ht).toFixed(2) + ' €', {
        x: 420,
        y,
        size: fontSizeText,
        font
      })

      y -= 18
    }

    // Totaux
    y -= 20
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 0.5
    })
    y -= 20

    page.drawText(
      `Total HT: ${Number(invoice.total_ht).toFixed(2)} €`,
      { x: 320, y, size: fontSizeText, font }
    )
    y -= 16
    page.drawText(
      `Total TVA: ${Number(invoice.total_vat).toFixed(2)} €`,
      { x: 320, y, size: fontSizeText, font }
    )
    y -= 16
    page.drawText(
      `Total TTC: ${Number(invoice.total_ttc).toFixed(2)} €`,
      { x: 320, y, size: fontSizeText, font }
    )

    // Notes éventuelles
    if (invoice.notes) {
      y -= 30
      page.drawText('Notes :', {
        x: 50,
        y,
        size: fontSizeSmall,
        font
      })
      y -= 14
      page.drawText(String(invoice.notes), {
        x: 50,
        y,
        size: fontSizeSmall,
        font
      })
    }

    const pdfBytes = await pdfDoc.save() // Uint8Array

    // ✅ On donne un ArrayBuffer au constructeur de NextResponse
    return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.id}.pdf"`
      }
    })
  } catch (e: any) {
    console.error('POST /api/invoices/[id]/pdf ERROR', e)
    return NextResponse.json(
      {
        error: 'Internal error',
        detail: String(e?.message || e)
      },
      { status: 500 }
    )
  }
}
