import { queries } from "@/lib/db";
import { analyzePost } from "@/lib/claude";

export async function POST(request: Request) {
  const { postContent, spaceId } = await request.json();

  if (!postContent?.trim() || !spaceId) {
    return Response.json({ error: "postContent and spaceId are required" }, { status: 400 });
  }

  const existingTopics = await queries.getTopics(spaceId);
  const topicSummaries = existingTopics.map((t) => ({ id: t.id, name: t.name }));
  const result = await analyzePost(postContent, topicSummaries);

  if (result.matchedTopicId) {
    const matched = existingTopics.find((t) => t.id === result.matchedTopicId);
    const existingQuestions = await queries.getQuestions(result.matchedTopicId);
    return Response.json({
      ...result,
      matchedTopicName: matched?.name ?? null,
      existingQuestions,
    });
  }

  return Response.json(result);
}
