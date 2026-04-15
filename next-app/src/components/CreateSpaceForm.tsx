"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSpaceForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"university" | "city">("university");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create space.");
      setLoading(false);
      return;
    }

    router.push(`/spaces/${data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-2 p-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 text-sm transition-colors"
      >
        + Add new space
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-4 rounded-xl border border-zinc-700 bg-zinc-900/60 space-y-3">
      <input
        autoFocus
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
        placeholder="e.g. UW-Madison or Chicago, IL"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex gap-2">
        {(["university", "city"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
              type === t
                ? "bg-violet-600 border-violet-500 text-white"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {t === "university" ? "🎓 University" : "🏙️ City"}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setName(""); setError(""); }}
          className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
