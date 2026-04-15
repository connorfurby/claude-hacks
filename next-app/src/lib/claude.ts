import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type GeneratedQuestion = {
  text: string;
  type: "scale" | "boolean" | "choice";
  options?: string[];
};

export type AnalyzeResult = {
  matchedTopicId: string | null;
  newTopicName: string | null;
  questions: GeneratedQuestion[];
};

export async function analyzePost(
  postContent: string,
  existingTopics: { id: string; name: string }[]
): Promise<AnalyzeResult> {
  const topicList =
    existingTopics.length > 0
      ? existingTopics.map((t) => `- id: "${t.id}", name: "${t.name}"`).join("\n")
      : "(none yet)";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are grouping college student posts into shared topics for a statistics platform.

User's post: "${postContent}"

Existing topics in this space:
${topicList}

Rules for matching:
- Match based on the SUBJECT or EVENT, completely ignoring sentiment, outcome, or opinion.
- "I bombed Calc 2" and "I aced Calc 2" are the SAME topic: "Calc 2 Exam".
- "The housing lottery was great" and "The housing lottery is rigged" are the SAME topic.
- Be INCLUSIVE — if the post is plausibly about the same subject as an existing topic, match it.
- Only create a new topic if the post is genuinely about something not yet listed.

If matched: return that topic's id.
If not matched: suggest a short neutral topic name (2–5 words, e.g. "Calc 2 Exam", "Campus Housing Lottery", "Spring Career Fair"). The name should describe the subject, not any particular sentiment about it.

Also generate 3–5 concise statistical questions that would be interesting to aggregate across all posts on this topic regardless of the poster's experience.
- "scale": 1–10 rating
- "boolean": yes/no
- "choice": pick one of 3–5 options

Respond ONLY with valid JSON:
{
  "matchedTopicId": "<id or null>",
  "newTopicName": "<string or null>",
  "questions": [
    { "text": "...", "type": "scale" },
    { "text": "...", "type": "boolean" },
    { "text": "...", "type": "choice", "options": ["A", "B", "C"] }
  ]
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned invalid JSON");

  return JSON.parse(jsonMatch[0]) as AnalyzeResult;
}
