import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default openai

export const AI_MODELS = {
  CHAT: 'gpt-4o' as const,
  VISION: 'gpt-4o' as const,
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
