import { queries } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const spaces = await queries.getSpaces();
  const universities = spaces.filter((s) => s.type === "university");
  const cities = spaces.filter((s) => s.type === "city");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Pulse</h1>
          <p className="text-zinc-400 mt-2">
            Post what&apos;s on your mind. See how everyone else is feeling about the same things.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Universities</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {universities.map((s) => (
                <Link
                  key={s.id}
                  href={`/spaces/${s.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 hover:border-violet-700 hover:bg-violet-950/30 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-900/50 flex items-center justify-center text-lg">🎓</div>
                  <div>
                    <p className="font-medium group-hover:text-violet-300 transition-colors">{s.name}</p>
                    <p className="text-xs text-zinc-500">University</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Cities</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cities.map((s) => (
                <Link
                  key={s.id}
                  href={`/spaces/${s.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 hover:border-sky-700 hover:bg-sky-950/30 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-900/50 flex items-center justify-center text-lg">🏙️</div>
                  <div>
                    <p className="font-medium group-hover:text-sky-300 transition-colors">{s.name}</p>
                    <p className="text-xs text-zinc-500">City</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
