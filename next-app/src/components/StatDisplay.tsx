"use client";

import type { QuestionStat } from "@/lib/db";

function StatBar({ pct, color = "bg-violet-500" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function StatDisplay({ stat }: { stat: QuestionStat }) {
  const q = stat.question;

  if (q.type === "scale" && "average" in stat) {
    const avg = stat.average;
    const dist = stat.distribution;
    const max = Math.max(...Object.values(dist), 1);
    return (
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{avg !== null ? avg.toFixed(1) : "—"}</span>
          <span className="text-sm text-zinc-400">/ 10 avg · {stat.total} responses</span>
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const count = dist[String(n)] || 0;
            const h = max > 0 ? Math.round((count / max) * 40) : 0;
            return (
              <div key={n} className="flex flex-col items-center gap-0.5 flex-1">
                <div
                  className="w-full rounded-sm bg-violet-500 opacity-80"
                  style={{ height: `${h}px` }}
                />
                <span className="text-[9px] text-zinc-500">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "boolean" && "yesPct" in stat) {
    const yesPct = stat.yesPct ?? 0;
    const noPct = 100 - yesPct;
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-zinc-300">
          <span>Yes — <strong className="text-white">{yesPct}%</strong></span>
          <span>No — <strong className="text-white">{noPct}%</strong></span>
        </div>
        <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${yesPct}%` }} />
          <div className="h-full bg-rose-500 transition-all flex-1" />
        </div>
        <p className="text-xs text-zinc-500">{stat.total} responses</p>
      </div>
    );
  }

  if (q.type === "choice" && "counts" in stat) {
    const total = stat.total || 1;
    const opts = q.options ?? Object.keys(stat.counts);
    return (
      <div className="space-y-2">
        {opts.map((opt: string) => {
          const count = stat.counts[opt] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={opt} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300">{opt}</span>
                <span className="text-zinc-400">{pct}% · {count}</span>
              </div>
              <StatBar pct={pct} />
            </div>
          );
        })}
        <p className="text-xs text-zinc-500">{stat.total} responses</p>
      </div>
    );
  }

  return null;
}
