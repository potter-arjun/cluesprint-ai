import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const MODEL = 'gemini-2.5-flash'

export const AI_MODELS = {
  CHAT: MODEL,
  VISION: MODEL,
}

// Strip markdown fences and extract the first JSON object/array from the response
function extractJSON(raw: string): string {
  if (!raw || !raw.trim()) throw new Error('Gemini returned an empty response')

  // Strip ```json ... ``` or ``` ... ``` fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced?.[1]?.trim()) return fenced[1].trim()

  // Extract first {...} or [...] block in case there's preamble text
  const objMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (objMatch?.[1]) return objMatch[1].trim()

  return raw.trim()
}

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, delay * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxTokens ?? 8192,
      // Disable thinking — it consumes output budget and truncates JSON
      thinkingConfig: { thinkingBudget: 0 },
    } as never,
  })

  const text = response.text
  if (!text) throw new Error('Gemini returned an empty response')
  return extractJSON(text)
}

export async function callAIWithImages(
  systemPrompt: string,
  userPrompt: string,
  imageUrls: string[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const imageParts = await Promise.all(
    imageUrls.map(async (url) => {
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
      return { inlineData: { data: base64, mimeType } }
    })
  )

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ text: userPrompt }, ...imageParts],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 8192,
      thinkingConfig: { thinkingBudget: 0 },
    } as never,
  })

  const text = response.text
  if (!text) throw new Error('Gemini returned an empty response')
  return extractJSON(text)
}
