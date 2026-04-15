"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedQuestion } from "@/lib/claude";
import type { Question } from "@/lib/db";

type Step = "write" | "analyzing" | "answer" | "submitting" | "done";

type QuestionWithId = (GeneratedQuestion & { id?: string }) | Question;

export default function NewPostForm({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("write");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  // After analysis
  const [matchedTopicId, setMatchedTopicId] = useState<string | null>(null);
  const [matchedTopicName, setMatchedTopicName] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionWithId[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  async function handleAnalyze() {
    if (!authorName.trim() || !content.trim()) {
      setError("Please fill in both your name and your post.");
      return;
    }
    setError("");
    setStep("analyzing");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent: content, spaceId }),
      });
      const data = await res.json();

      setMatchedTopicId(data.matchedTopicId ?? null);
      setMatchedTopicName(data.matchedTopicName ?? null);
      setNewTopicName(data.newTopicName ?? null);

      // Use existing questions if matched, otherwise generated ones
      if (data.matchedTopicId && data.existingQuestions) {
        setQuestions(data.existingQuestions as Question[]);
      } else {
        setQuestions((data.questions ?? []) as GeneratedQuestion[]);
      }

      setStep("answer");
    } catch {
      setError("Something went wrong analyzing your post. Try again.");
      setStep("write");
    }
  }

  async function handleSubmit() {
    setStep("submitting");
    setError("");

    const answerPayload = questions.map((q) => ({
      questionId: "id" in q ? q.id : undefined,
      questionText: q.text,
      value: answers[q.text] ?? "",
    }));

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId,
          topicId: matchedTopicId,
          newTopicName,
          authorName: authorName.trim(),
          content: content.trim(),
          questions: matchedTopicId ? undefined : questions,
          answers: answerPayload.map((a) => ({ questionId: a.questionId, value: a.value })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/spaces/${spaceId}/topics/${data.topicId}`);
    } catch {
      setError("Failed to submit. Please try again.");
      setStep("answer");
    }
  }

  function renderQuestion(q: QuestionWithId, i: number) {
    const key = q.text;
    const type = q.type;
    const options: string[] = ("options" in q && Array.isArray(q.options)) ? q.options : [];

    return (
      <div key={i} className="space-y-2">
        <p className="text-sm font-medium text-zinc-200">{q.text}</p>

        {type === "scale" && (
          <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [key]: String(n) }))}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors border ${
                  answers[key] === String(n)
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {type === "boolean" && (
          <div className="flex gap-2">
            {["yes", "no"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [key]: v }))}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${
                  answers[key] === v
                    ? v === "yes"
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-rose-600 border-rose-500 text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {type === "choice" && (
          <div className="flex flex-col gap-1.5">
            {options.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [key]: opt }))}
                className={`px-4 py-2 rounded-lg text-sm text-left transition-colors border ${
                  answers[key] === opt
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === "write") {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Your name</label>
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="e.g. Alex"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">What's on your mind?</label>
          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            placeholder="Just bombed my Calc 2 exam... that integral section was no joke"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          onClick={handleAnalyze}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === "analyzing") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-zinc-400">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Claude is finding your topic...</p>
      </div>
    );
  }

  if (step === "answer") {
    return (
      <div className="space-y-6">
        <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
          <p className="text-xs text-zinc-400 mb-1">
            {matchedTopicId ? "Joining topic" : "Creating new topic"}
          </p>
          <p className="text-sm font-semibold text-violet-300">
            {matchedTopicName ?? newTopicName ?? "..."}
          </p>
          {matchedTopicId && (
            <p className="text-xs text-zinc-500 mt-1">Claude matched your post to an existing topic</p>
          )}
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-4">
            Answer a few quick questions — your responses add to the group stats.
          </p>
          <div className="space-y-6">
            {questions.map((q, i) => renderQuestion(q, i))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("write")}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    );
  }

  if (step === "submitting") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-zinc-400">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Publishing your post...</p>
      </div>
    );
  }

  return null;
}
