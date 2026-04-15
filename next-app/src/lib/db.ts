import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _client;
}

export type Space    = { id: string; name: string; type: "university" | "city"; created_at: string };
export type Topic    = { id: string; space_id: string; name: string; post_count: number; created_at: string };
// options is JSONB in Postgres — comes back as string[] | null directly
export type Question = { id: string; topic_id: string; text: string; type: "scale" | "boolean" | "choice"; options: string[] | null; sort_order: number };
export type Post     = { id: string; topic_id: string; author_name: string; content: string; created_at: string };
export type Answer   = { id: string; post_id: string; question_id: string; value: string };

export const queries = {
  getSpaces: async (): Promise<Space[]> => {
    const { data, error } = await db().from("spaces").select("*").order("type").order("name");
    if (error) throw error;
    return data as Space[];
  },

  getSpace: async (id: string): Promise<Space | null> => {
    const { data, error } = await db().from("spaces").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Space | null;
  },

  getTopics: async (spaceId: string): Promise<Topic[]> => {
    const { data, error } = await db()
      .from("topics")
      .select("*")
      .eq("space_id", spaceId)
      .order("post_count", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Topic[];
  },

  getTopic: async (id: string): Promise<Topic | null> => {
    const { data, error } = await db().from("topics").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Topic | null;
  },

  getQuestions: async (topicId: string): Promise<Question[]> => {
    const { data, error } = await db()
      .from("questions")
      .select("*")
      .eq("topic_id", topicId)
      .order("sort_order");
    if (error) throw error;
    return data as Question[];
  },

  getPosts: async (topicId: string): Promise<Post[]> => {
    const { data, error } = await db()
      .from("posts")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Post[];
  },

  createTopic: async (spaceId: string, name: string): Promise<string> => {
    const { data, error } = await db()
      .from("topics")
      .insert({ space_id: spaceId, name })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  createQuestion: async (
    topicId: string,
    text: string,
    type: string,
    options: string[] | null,
    sortOrder: number
  ): Promise<string> => {
    const { data, error } = await db()
      .from("questions")
      .insert({ topic_id: topicId, text, type, options, sort_order: sortOrder })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  createPost: async (topicId: string, authorName: string, content: string): Promise<string> => {
    const { data, error } = await db()
      .from("posts")
      .insert({ topic_id: topicId, author_name: authorName, content })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  createAnswer: async (postId: string, questionId: string, value: string): Promise<void> => {
    const { error } = await db()
      .from("answers")
      .insert({ post_id: postId, question_id: questionId, value });
    if (error) throw error;
  },

  incrementPostCount: async (topicId: string): Promise<void> => {
    const { error } = await db().rpc("increment_post_count", { p_topic_id: topicId });
    if (error) throw error;
  },

  getTopicStats: async (topicId: string): Promise<TopicStats> => {
    const { data: questions, error: qErr } = await db()
      .from("questions")
      .select("*")
      .eq("topic_id", topicId)
      .order("sort_order");
    if (qErr) throw qErr;
    if (!questions || questions.length === 0) return { questions: [] };

    const questionIds = (questions as Question[]).map((q) => q.id);
    const { data: allAnswers, error: aErr } = await db()
      .from("answers")
      .select("question_id, value")
      .in("question_id", questionIds);
    if (aErr) throw aErr;

    const byQuestion: Record<string, string[]> = {};
    for (const id of questionIds) byQuestion[id] = [];
    for (const a of allAnswers ?? []) {
      byQuestion[a.question_id]?.push(a.value);
    }

    const stats: TopicStats = { questions: [] };

    for (const q of questions as Question[]) {
      const values = byQuestion[q.id] ?? [];

      if (q.type === "scale") {
        const nums = values.map(Number).filter((n) => !isNaN(n));
        const avg  = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        const dist: Record<string, number> = {};
        for (let i = 1; i <= 10; i++) dist[String(i)] = 0;
        for (const n of nums) dist[String(n)] = (dist[String(n)] || 0) + 1;
        stats.questions.push({ question: q, average: avg, distribution: dist, total: nums.length });
      } else if (q.type === "boolean") {
        const yesCount = values.filter((v) => v === "yes").length;
        const noCount  = values.filter((v) => v === "no").length;
        const total    = yesCount + noCount;
        stats.questions.push({ question: q, yesCount, noCount, total, yesPct: total > 0 ? Math.round((yesCount / total) * 100) : null });
      } else if (q.type === "choice") {
        const opts   = q.options ?? [];
        const counts: Record<string, number> = {};
        for (const opt of opts) counts[opt] = 0;
        for (const v of values) counts[v] = (counts[v] || 0) + 1;
        stats.questions.push({ question: q, counts, total: values.length });
      }
    }

    return stats;
  },
};

export type QuestionStat =
  | { question: Question; average: number | null; distribution: Record<string, number>; total: number }
  | { question: Question; yesCount: number; noCount: number; total: number; yesPct: number | null }
  | { question: Question; counts: Record<string, number>; total: number };

export type TopicStats = { questions: QuestionStat[] };
