import dotenv from "dotenv";

dotenv.config();

function fallback(type, prompt) {
  const subject = prompt.trim();
  const responses = {
    caption: `Here’s a creator-ready caption for “${subject}”:\n\nStart with a curiosity-driven first line, share one personal detail, and finish with a clear save/share call to action.`,
    hook: `5 hook directions for “${subject}”:\n1. Nobody tells you this about ${subject}.\n2. POV: you finally take ${subject} seriously.\n3. I tried this for 7 days. Here’s what happened.\n4. Stop scrolling if you’re working on ${subject}.\n5. This changed the way I approach ${subject}.`,
    script: `SCRIPT\n\nHook: Open with a curiosity gap about ${subject}.\n\nBody: Show the problem, transformation, and proof in three short beats.\n\nCTA: Ask viewers to save the post and follow for the next part.`,
    hashtag:
      "#contentcreator #creatorlife #reels #instagramtips #digitalcreator #creatoros #contentstrategy",
    idea: `Content idea: turn “${subject}” into a 20–30 second story with a strong first-second visual, one clear lesson, and a direct CTA.`,
    analyze: `Engagement analysis for “${subject}”:\n\nLead with the clearest audience benefit, use a specific example to add emotional connection, and end with one direct next step.`,
  };
  return responses[type] || responses.idea;
}

export async function generate(type, prompt) {
  const local = () => ({
    text: fallback(type, prompt),
    provider: "local-fallback",
  });
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return local();

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are CreatorOS AI, an expert social content strategist. Generate ${type} for: ${prompt}. Be concise, practical, original, and creator-friendly.`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) {
      const output = local();
      output.warning = "Gemini is unavailable. A local AI response was used.";
      return output;
    }
    const body = await response.json();
    const text = body?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!text) {
      const output = local();
      output.warning =
        "Gemini returned no content. A local AI response was used.";
      return output;
    }
    return { text, provider: "gemini" };
  } catch {
    const output = local();
    output.warning =
      "Gemini could not be reached. A local AI response was used.";
    return output;
  }
}

export function score(text) {
  const content = text.trim();
  const words = content.split(/\s+/).filter(Boolean);
  const firstLine = content.split(/\r?\n/).find((line) => line.trim()) || "";
  const hasHook =
    /[?!]|^(stop|why|how|what|pov|here|the|nobody|i tried)\b/i.test(firstLine);
  const emotionWords =
    content.match(
      /\b(love|fear|surprise|finally|struggle|changed|mistake|secret|excited|frustrat\w*|amazing|impossible|breakthrough)\b/gi,
    ) || [];
  const hasCta =
    /\b(save|share|comment|follow|subscribe|try|download|join|tell me|check out)\b/i.test(
      content,
    );
  const sentenceCount = Math.max(1, (content.match(/[.!?]+/g) || []).length);
  const averageSentenceLength = words.length / sentenceCount;
  const hook = Math.min(
    98,
    52 + (hasHook ? 24 : 0) + Math.min(16, firstLine.length / 8),
  );
  const emotion = Math.min(98, 58 + Math.min(32, emotionWords.length * 8));
  const readability = Math.max(
    45,
    Math.min(98, 96 - Math.max(0, averageSentenceLength - 14) * 2),
  );
  const cta = Math.min(98, 52 + (hasCta ? 38 : 0));
  const overall = Math.round((hook + emotion + readability + cta) / 4);
  const improvementSuggestions = [];
  if (!hasHook)
    improvementSuggestions.push(
      "Open with a sharper question or curiosity gap.",
    );
  if (!emotionWords.length)
    improvementSuggestions.push(
      "Add a specific personal detail to strengthen the emotional connection.",
    );
  if (!hasCta)
    improvementSuggestions.push(
      "Finish with one clear action for the audience.",
    );
  if (averageSentenceLength > 18)
    improvementSuggestions.push(
      "Shorten long sentences to make the content easier to scan.",
    );
  if (!improvementSuggestions.length)
    improvementSuggestions.push(
      "Strong structure. Test a more specific CTA to encourage saves or comments.",
    );
  return {
    overall,
    hook: Math.round(hook),
    emotion: Math.round(emotion),
    readability: Math.round(readability),
    cta: Math.round(cta),
    suggestion: improvementSuggestions[0],
    improvementSuggestions,
  };
}
