import { queries } from "@/lib/db";

export async function POST(request: Request) {
  const { spaceId, topicId, newTopicName, authorName, content, questions, answers } = await request.json();

  if (!spaceId || !authorName?.trim() || !content?.trim()) {
    return Response.json({ error: "spaceId, authorName, and content are required" }, { status: 400 });
  }

  let resolvedTopicId = topicId as string | null;
  // For new topics: track created question IDs in order so we can match answers by index
  let createdQuestionIds: string[] | null = null;

  if (!resolvedTopicId && newTopicName) {
    resolvedTopicId = await queries.createTopic(spaceId, newTopicName);

    if (Array.isArray(questions)) {
      createdQuestionIds = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qId = await queries.createQuestion(resolvedTopicId, q.text, q.type, q.options ?? null, i);
        createdQuestionIds.push(qId);
      }
    }
  }

  if (!resolvedTopicId) {
    return Response.json({ error: "topicId or newTopicName is required" }, { status: 400 });
  }

  const postId = await queries.createPost(resolvedTopicId, authorName.trim(), content.trim());
  await queries.incrementPostCount(resolvedTopicId);

  if (Array.isArray(answers)) {
    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      // For existing topics: use the questionId sent from the client
      // For new topics: use the question created at the same index
      const questionId = ans.questionId ?? createdQuestionIds?.[i];
      if (questionId && ans.value !== undefined && ans.value !== "") {
        await queries.createAnswer(postId, questionId, String(ans.value));
      }
    }
  }

  return Response.json({ postId, topicId: resolvedTopicId });
}
