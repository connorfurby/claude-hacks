import { queries } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SpacePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const space = await queries.getSpace(spaceId);
  if (!space) notFound();

  const topics = await queries.getTopics(spaceId);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">← All spaces</Link>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{space.name}</h1>
              <p className="text-zinc-500 text-sm capitalize mt-0.5">{space.type}</p>
            </div>
            <Link
              href={`/new-post?spaceId=${spaceId}`}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-colors"
            >
              + Post
            </Link>
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium text-zinc-300">No topics yet</p>
            <p className="text-sm mt-1">Be the first to post something</p>
            <Link
              href={`/new-post?spaceId=${spaceId}`}
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              Create first post
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4">
              {topics.length} topic{topics.length !== 1 ? "s" : ""}
            </p>
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/spaces/${spaceId}/topics/${t.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 hover:border-violet-700 hover:bg-violet-950/20 transition-all group"
              >
                <div>
                  <p className="font-medium group-hover:text-violet-300 transition-colors">{t.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-300">{t.post_count}</p>
                  <p className="text-xs text-zinc-500">posts</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
