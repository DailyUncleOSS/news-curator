const gfetch: any = (globalThis as any).fetch

export async function callOpenRouter({
  prompt,
  model,
  apiKey,
  maxAttempts = 3,
}: {
  prompt: string
  model: string
  apiKey: string
  maxAttempts?: number
}) {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await gfetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          reasoning: { enabled: true },
          top_p: 0.1,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`OpenRouter HTTP ${res.status}: ${text}`)
      }
      const data = await res.json()
      const content: string = data?.choices?.[0]?.message?.content ?? ""
      if (!content) throw new Error("Empty content from model")
      return content
    } catch (err) {
      lastError = err
      const delayMs = Math.min(20_000, 1000 * 2 ** (attempt - 1))
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw lastError
}
