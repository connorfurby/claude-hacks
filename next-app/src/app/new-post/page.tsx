import { queries } from "@/lib/db";
import { notFound } from "next/navigation";
import NewPostForm from "@/components/NewPostForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ spaceId?: string }>;
}) {
  const { spaceId } = await searchParams;
  if (!spaceId) notFound();

  const space = await queries.getSpace(spaceId);
  if (!space) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href={`/spaces/${spaceId}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ← {space.name}
          </Link>
          <h1 className="text-2xl font-bold mt-3">New post</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Claude will find your topic and ask a few quick questions to build group stats.
          </p>
        </div>

        <NewPostForm spaceId={spaceId} />
      </div>
    </div>
  );
}
