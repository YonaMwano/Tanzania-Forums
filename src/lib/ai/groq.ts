import Groq from "groq-sdk";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function generateThreadSummary(
  title: string,
  posts: { body: string; author?: string }[]
): Promise<string> {
  const conversation = posts
    .slice(0, 40)
    .map((p, i) => `[${p.author || "User"}]: ${p.body}`)
    .join("\n\n");

  const prompt = `You are summarizing a discussion thread on Tanzania Forums for a general audience.

Thread title: ${title}

Posts:
${conversation}

Write a clear, neutral 30-second read summary (max 120 words) in plain English. Cover the main points, key arguments, and any conclusions. Do not invent facts. Do not use bullet points. Write in paragraph form.`;

  const completion = await getGroq().chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that writes concise, accurate summaries of online discussions. Be neutral and factual.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content?.trim() || "Summary unavailable.";
}

export async function moderateContent(
  text: string
): Promise<{ flagged: boolean; reason: string | null; confidence: number }> {
  const prompt = `Analyze the following text for hate speech, harassment, spam, or clear misinformation.

Text:
"""
${text.slice(0, 2000)}
"""

Respond ONLY with valid JSON in this exact shape:
{"flagged": boolean, "reason": string or null, "confidence": number between 0 and 1}

Reasons should be short: "hate_speech", "harassment", "spam", "misinformation", or null if clean.`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a content moderation assistant. Respond only with the requested JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        flagged: Boolean(parsed.flagged),
        reason: parsed.reason || null,
        confidence: Number(parsed.confidence) || 0,
      };
    }
  } catch {
    // fail open
  }

  return { flagged: false, reason: null, confidence: 0 };
}
