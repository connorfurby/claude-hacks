import { queries } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/topics/[topicId]">) {
  const { topicId } = await ctx.params;

  const topic = await queries.getTopic(topicId);
  if (!topic) return Response.json({ error: "Not found" }, { status: 404 });

  const [posts, stats] = await Promise.all([
    queries.getPosts(topicId),
    queries.getTopicStats(topicId),
  ]);

  return Response.json({ topic, posts, stats });
}
