import { queries } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatDisplay from "@/components/StatDisplay";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ spaceId: string; topicId: string }>;
}) {
  const { spaceId, topicId } = await params;

  const [space, topic] = await Promise.all([
    queries.getSpace(spaceId),
    queries.getTopic(topicId),
  ]);
  if (!space || !topic) notFound();

  const [posts, stats] = await Promise.all([
    queries.getPosts(topicId),
    queries.getTopicStats(topicId),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href={`/spaces/${spaceId}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ← {space.name}
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{topic.name}</h1>
              <p className="text-zinc-500 text-sm mt-0.5">{topic.post_count} posts</p>
            </div>
            <Link
              href={`/new-post?spaceId=${spaceId}`}
              className="shrink-0 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-colors"
            >
              + Post
            </Link>
          </div>
        </div>

        {stats.questions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Group Stats</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {stats.questions.map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-2">
                  <p className="text-sm font-medium text-zinc-300">{stat.question.text}</p>
                  <StatDisplay stat={stat} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Posts</h2>
          {posts.length === 0 ? (
            <p className="text-zinc-500 text-sm">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold text-white">
                      {post.author_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-zinc-300">{post.author_name}</span>
                    <span className="text-xs text-zinc-600 ml-auto">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
