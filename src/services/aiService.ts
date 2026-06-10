import { Item } from '../types';
import { ENV } from '../config/env';

interface SimplifiedItem {
  titre: string;
  prix: number;
  categorie: string;
  ville: string;
  note: number;
}

export async function askAssistant(
  userMessage: string,
  items: Item[],
): Promise<string> {
  console.log('[AI] API Key loaded:', ENV.OPENAI_API_KEY ? 'Yes (length: ' + ENV.OPENAI_API_KEY.length + ')' : 'NO KEY');

  const simplifiedItems: SimplifiedItem[] = items.map((i) => ({
    titre: i.titre,
    prix: i.prixParJour,
    categorie: i.categorie,
    ville: i.ville,
    note: i.averageRating ?? 0,
  }));

  const systemPrompt =
    `Tu es l'assistant intelligent de Rentify, une application de location d'objets entre particuliers au Maroc.\n\n` +
    `Voici les objets actuellement disponibles sur la plateforme :\n${JSON.stringify(simplifiedItems)}\n\n` +
    `Règles :\n` +
    `- Réponds toujours en français, de manière concise (3-4 phrases max)\n` +
    `- Utilise MAD comme devise (pas DH)\n` +
    `- Quand tu recommandes un objet, mentionne : le titre exact, le prix par jour en MAD, la ville, et la catégorie\n` +
    `- Si plusieurs objets correspondent, liste-les tous brièvement\n` +
    `- Si aucun objet ne correspond, suggère poliment de modifier la recherche ou de publier une demande\n` +
    `- Ne mets PAS de markdown (pas de ** ou ##), écris en texte simple\n` +
    `- Sois chaleureux et utile, comme un ami qui aide\n` +
    `- Si on te pose une question hors sujet (pas liée à la location d'objets), rappelle poliment que tu es spécialisé dans la location d'objets sur Rentify`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    console.log('[AI] Response status:', response.status);
    const data = await response.json();
    console.log('[AI] Response body:', JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      throw new Error(`OpenAI ${response.status}: ${JSON.stringify(data)}`);
    }

    return (data.choices?.[0]?.message?.content ?? '').trim();
  } catch (error) {
    console.error('[AI] Error:', error);
    throw error;
  }
}
