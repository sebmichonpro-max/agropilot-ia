'use server'

import Anthropic from '@anthropic-ai/sdk'

const EXTRACTION_PROMPTS: Record<string, string> = {
  supplier_price_list: `Tu es un extracteur de données. Analyse ce document PDF (tarif fournisseur agroalimentaire).
Extrais UNIQUEMENT les données sous forme JSON, sans aucun texte autour.
Format attendu :
{
  "supplier_name": "Nom du fournisseur",
  "items": [
    {
      "name": "Nom du produit",
      "unit": "kg" | "L" | "pièce" | "carton",
      "price_ht": 4.20,
      "category": "légume" | "viande" | "sauce" | "emballage" | "autre"
    }
  ]
}
Si une donnée est illisible ou ambiguë, mets null. Ne jamais inventer de données.`,

  invoice: `Tu es un extracteur de données. Analyse cette facture fournisseur agroalimentaire.
Extrais UNIQUEMENT les données sous forme JSON :
{
  "supplier_name": "Nom du fournisseur",
  "invoice_date": "YYYY-MM-DD",
  "invoice_number": "Numéro facture",
  "lines": [
    {
      "name": "Nom du produit",
      "quantity": 50,
      "unit": "kg",
      "unit_price_ht": 4.35,
      "total_ht": 217.50
    }
  ]
}
Si une donnée est illisible ou ambiguë, mets null. Ne jamais inventer de données.`,

  product_spec: `Tu es un extracteur de données. Analyse cette fiche technique produit agroalimentaire.
Extrais UNIQUEMENT les données sous forme JSON :
{
  "product_name": "Nom du produit fini",
  "net_weight_g": 250,
  "ingredients": [
    {
      "name": "Nom ingrédient",
      "quantity_g": 150,
      "percentage": 60
    }
  ],
  "allergens": ["lait", "gluten"],
  "shelf_life_days": 7
}
Si une donnée est illisible ou ambiguë, mets null. Ne jamais inventer de données.`,
}

export async function extractFromPdf(
  fileBase64: string,
  documentType: string,
): Promise<{ data: unknown; error?: string }> {
  const systemPrompt = EXTRACTION_PROMPTS[documentType]
  if (!systemPrompt) return { data: null, error: 'Type de document non supporté' }

  try {
    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: fileBase64,
            },
          },
          {
            type: 'text',
            text: 'Extrais toutes les données de ce document selon le format demandé.',
          },
        ],
      }],
    })

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return { data: parsed }
  } catch (e) {
    return { data: null, error: 'Erreur lors de l\'extraction. Vérifiez le document et réessayez.' }
  }
}
