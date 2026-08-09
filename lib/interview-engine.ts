import curriculumData from './data/curriculum.json';
import candidateData from './data/candidates.json';
import type { CurriculumDay, Candidate, AnswerScore, ChatMessage, FinalReport } from './types';

export const curriculum = curriculumData as CurriculumDay[];
export const candidates = candidateData as Candidate[];

// ============================================================
// Agent 1: Context/RAG Retriever
// Selects a topic the candidate has completed but hasn't been tested on yet.
// Simulates FAISS-like retrieval by scoring relevance using keyword overlap.
// ============================================================

export function retrieveNextTopic(
  candidate: Candidate,
  coveredDays: number[]
): { day: CurriculumDay; contextChunks: string[] } | null {
  const testedDays = new Set(coveredDays);

  // Pool of completed but untested days
  const availableDays = curriculum.filter(
    (d) => candidate.completedDays.includes(d.day) && !testedDays.has(d.day)
  );

  // If we've exhausted completed days, fall back to attempted days
  const pool = availableDays.length > 0
    ? availableDays
    : curriculum.filter(
        (d) => candidate.attemptedDays.includes(d.day) && !testedDays.has(d.day)
      );

  if (pool.length === 0) {
    // Last resort: any curriculum day not yet covered
    const remaining = curriculum.filter((d) => !testedDays.has(d.day));
    if (remaining.length === 0) return null;
    return {
      day: remaining[0],
      contextChunks: buildContextChunks(remaining[0]),
    };
  }

  // Simulate embedding-based retrieval: prioritize candidate's preferred topics
  const preferred = candidate.learningSignals.preferredTopics;
  const scored = pool.map((d) => {
    let score = Math.random() * 0.3;
    if (preferred.includes(d.module)) score += 0.5;
    if (candidate.strengths.some((s) => d.module.toLowerCase().includes(s.toLowerCase().split(' ')[0])))
      score += 0.2;
    return { day: d, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored[0].day;

  return {
    day: selected,
    contextChunks: buildContextChunks(selected),
  };
}

function buildContextChunks(day: CurriculumDay): string[] {
  // Simulate top-3 retrieved chunks from FAISS
  return [
    `Day ${day.day}: ${day.title} — ${day.description}`,
    `Module: ${day.module}. Learning objectives: ${day.objectives.join('; ')}.`,
    `Key concepts: ${day.module}, ${day.title}. This topic is part of the ${day.status} curriculum.`,
  ];
}

// ============================================================
// Agent 2: Conversational Interviewer
// Generates the next question or a dynamic follow-up.
// ============================================================

export type QuestionResult = {
  question: string;
  day: number;
  topic: string;
  isFollowUp: boolean;
};

export function generateQuestion(
  candidate: Candidate,
  coveredDays: number[],
  conversation: ChatMessage[],
  contextChunks: string[]
): QuestionResult {
  const retrieval = retrieveNextTopic(candidate, coveredDays);
  if (!retrieval) {
    return {
      question: "Let's wrap up. Can you summarize what you've learned in this cohort so far?",
      day: coveredDays[coveredDays.length - 1] || 1,
      topic: 'Summary',
      isFollowUp: false,
    };
  }

  const { day } = retrieval;
  const lastUserMessage = [...conversation].reverse().find((m) => m.role === 'user');

  // Decide whether to ask a follow-up or a new question
  const shouldFollowUp = lastUserMessage && shouldAskFollowUp(lastUserMessage.content, conversation);

  if (shouldFollowUp && lastUserMessage) {
    const lastAgentMsg = [...conversation].reverse().find((m) => m.role === 'agent');
    return {
      question: generateFollowUp(lastUserMessage.content, day, lastAgentMsg?.topic || day.module),
      day: day.day,
      topic: day.module,
      isFollowUp: true,
    };
  }

  return {
    question: generateNewQuestion(day, candidate, contextChunks),
    day: day.day,
    topic: day.module,
    isFollowUp: false,
  };
}

function shouldAskFollowUp(userAnswer: string, conversation: ChatMessage[]): boolean {
  // If the answer is short or shallow, ask a follow-up
  const wordCount = userAnswer.trim().split(/\s+/).length;
  const recentFollowUps = conversation.filter((m) => m.isFollowUp).length;
  // Don't chain too many follow-ups
  if (recentFollowUps >= 2) return false;
  // Short answers trigger follow-up
  if (wordCount < 25) return true;
  // 30% chance of follow-up for deeper exploration
  return Math.random() < 0.3;
}

function generateFollowUp(userAnswer: string, day: CurriculumDay, lastTopic: string): string {
  const followUps = [
    `Interesting. Can you go deeper on that? Specifically, how would you handle edge cases in a production ${day.module} system?`,
    `Good start. What would the architecture look like if you had to scale this to millions of requests?`,
    `I see. Can you give me a concrete example of how you'd implement this in code?`,
    `Let's push on that. What are the trade-offs of the approach you just described versus alternatives?`,
    `Could you explain what happens internally when that process runs? I want to understand your mental model.`,
    `How would you debug or monitor this in a production environment?`,
    `What would you do differently if latency was your top priority vs. accuracy?`,
  ];
  return followUps[Math.floor(Math.random() * followUps.length)];
}

function generateNewQuestion(
  day: CurriculumDay,
  candidate: Candidate,
  contextChunks: string[]
): string {
  const questionBank: Record<string, string[]> = {
    RAG: [
      `Walk me through how you would design a RAG pipeline from scratch. What components would you need?`,
      `Explain the difference between naive RAG and advanced RAG. What makes advanced RAG better?`,
      `How do you evaluate the quality of a RAG system? What metrics would you use?`,
      `Your RAG system is returning irrelevant chunks. How do you debug and fix this?`,
    ],
    'Vector Databases': [
      `Compare Pinecone, Weaviate, and pgvector. When would you choose each?`,
      `Explain how HNSW indexing works and why it's faster than brute-force search.`,
      `What is hybrid search and why is it better than pure semantic search?`,
      `How do you choose the right embedding model for your vector database?`,
    ],
    'Prompt Engineering': [
      `What is chain-of-thought prompting and when does it outperform standard prompting?`,
      `Design a prompt that classifies customer support tickets. Walk me through your approach.`,
      `Explain the ReAct pattern. How does it improve LLM reasoning?`,
      `How do you prevent prompt injection attacks in a production system?`,
    ],
    'Agentic AI': [
      `What's the difference between an AI agent and a prompt chain? When would you use each?`,
      `Design a multi-agent system for research. What roles would each agent play?`,
      `How do you implement tool use in an AI agent? Walk through the function calling flow.`,
      `Explain how agent memory works. How do you manage state across multiple turns?`,
    ],
    MCP: [
      `What is the Model Context Protocol and what problem does it solve?`,
      `How would you build an MCP server to expose a database to an AI model?`,
      `Compare MCP to traditional REST API integration. What are the trade-offs?`,
      `Walk me through how an MCP client negotiates context with a server.`,
    ],
    'AI Deployment': [
      `How would you deploy an AI service to production? Walk through your architecture.`,
      `Compare serverless vs. containerized deployment for AI workloads.`,
      `How do you handle cold starts in serverless AI functions?`,
      `What monitoring and observability tools would you set up for a production AI system?`,
    ],
    'Production AI': [
      `How do you optimize AI costs in production? What strategies would you use?`,
      `Design a guardrail system for an AI chatbot. What would you protect against?`,
      `How do you implement streaming responses in a real-time AI application?`,
      `Walk me through how you'd scale an AI system to handle 10x traffic growth.`,
    ],
    'LLM Foundations': [
      `Explain how tokenization works. Why does it matter for prompt engineering?`,
      `Compare fine-tuning vs. RAG vs. prompt engineering. When would you use each?`,
      `How do you evaluate an LLM's performance? What benchmarks would you use?`,
      `What is the transformer architecture and why was it a breakthrough?`,
    ],
    Introduction: [
      `How do you see the AI engineering role evolving in the next 2 years?`,
      `What's your approach to building an AI portfolio that stands out?`,
      `Walk me through how you'd prepare for an AI engineering interview.`,
    ],
  };

  const questions = questionBank[day.module] || [
    `Explain the key concepts from ${day.title}. What did you learn?`,
    `How would you apply ${day.module} in a real-world project?`,
    `What are the biggest challenges in ${day.module} and how would you overcome them?`,
  ];

  return questions[Math.floor(Math.random() * questions.length)];
}

// ============================================================
// Agent 3: Evaluator
// Silently scores each user response out of 100.
// ============================================================

export function evaluateAnswer(
  question: string,
  answer: string,
  day: CurriculumDay,
  candidate: Candidate
): AnswerScore {
  const text = answer.toLowerCase().trim();
  const wordCount = text.split(/\s+/).length;

  // --- Technical Accuracy (0-40) ---
  // Check for domain-specific keywords
  const moduleKeywords: Record<string, string[]> = {
    RAG: ['retrieval', 'augmented', 'generation', 'embedding', 'chunk', 'context', 'vector', 'semantic', 'rerank', 'citation'],
    'Vector Databases': ['vector', 'embedding', 'index', 'hnsw', 'ivf', 'pinecone', 'weaviate', 'pgvector', 'cosine', 'similarity'],
    'Prompt Engineering': ['prompt', 'few-shot', 'chain-of-thought', 'react', 'template', 'instruction', 'context', 'token'],
    'Agentic AI': ['agent', 'tool', 'function', 'autonomous', 'multi-agent', 'orchestration', 'memory', 'state', 'crewai'],
    MCP: ['mcp', 'context', 'protocol', 'server', 'client', 'resource', 'provider', 'consumer', 'negotiation'],
    'AI Deployment': ['docker', 'fastapi', 'serverless', 'container', 'deploy', 'vercel', 'edge', 'cold start', 'scaling'],
    'Production AI': ['guardrail', 'safety', 'monitoring', 'cost', 'latency', 'streaming', 'sse', 'observability', 'logging'],
    'LLM Foundations': ['token', 'transformer', 'fine-tune', 'benchmark', 'evaluation', 'context window', 'hallucination'],
    Introduction: ['portfolio', 'career', 'interview', 'community', 'network', 'project', 'learning'],
  };

  const keywords = moduleKeywords[day.module] || [];
  const matchedKeywords = keywords.filter((k) => text.includes(k));
  const keywordRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0.3;
  let technicalAccuracy = Math.round(15 + keywordRatio * 25 + Math.random() * 5);
  technicalAccuracy = Math.min(40, Math.max(8, technicalAccuracy));

  // --- Depth (0-30) ---
  // Based on length, specificity, and presence of examples
  const hasExample = /\b(for example|instance|such as|like|e\.g\.|specifically)\b/i.test(answer);
  const hasComparison = /\b(versus|compared to|whereas|while|however|on the other hand|trade-?off)\b/i.test(answer);
  const hasSteps = /\b(first|then|next|finally|step|process|approach|workflow)\b/i.test(answer);

  let depth = 5;
  if (wordCount > 20) depth += 5;
  if (wordCount > 50) depth += 5;
  if (wordCount > 100) depth += 5;
  if (hasExample) depth += 5;
  if (hasComparison) depth += 4;
  if (hasSteps) depth += 4;
  depth += Math.round(Math.random() * 2);
  depth = Math.min(30, Math.max(4, depth));

  // --- Clarity (0-30) ---
  // Based on structure, sentence quality, and coherence
  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  let clarity = 10;
  if (sentences.length >= 2) clarity += 5;
  if (sentences.length >= 4) clarity += 5;
  if (avgSentenceLength > 5 && avgSentenceLength < 30) clarity += 5;
  if (wordCount > 15) clarity += 3;
  clarity += Math.round(Math.random() * 2);
  clarity = Math.min(30, Math.max(6, clarity));

  const total = technicalAccuracy + depth + clarity;

  return {
    technicalAccuracy,
    depth,
    clarity,
    total,
    explanation: generateScoreExplanation(technicalAccuracy, depth, clarity, day.module),
    improvement: generateImprovement(technicalAccuracy, depth, clarity, day.module),
    modelAnswer: generateModelAnswer(day),
  };
}

function generateScoreExplanation(acc: number, depth: number, clarity: number, module: string): string {
  const parts: string[] = [];
  if (acc >= 30) parts.push(`strong technical accuracy in ${module}`);
  else if (acc >= 20) parts.push(`adequate technical understanding of ${module}`);
  else parts.push(`limited technical depth in ${module}`);

  if (depth >= 22) parts.push(`excellent depth with concrete examples`);
  else if (depth >= 15) parts.push(`reasonable depth but could be more specific`);
  else parts.push(`surface-level explanation lacking detail`);

  if (clarity >= 22) parts.push(`clear and well-structured communication`);
  else if (clarity >= 15) parts.push(`generally clear but could be better organized`);
  else parts.push(`communication needs improvement`);

  return `This answer demonstrates ${parts.join(', ')}.`;
}

function generateImprovement(acc: number, depth: number, clarity: number, module: string): string {
  const improvements: string[] = [];
  if (acc < 25) improvements.push(`Review the core concepts of ${module} — focus on the underlying mechanisms, not just the surface-level definition.`);
  if (depth < 18) improvements.push(`Add concrete examples or real-world scenarios to illustrate your understanding. Mention specific tools, libraries, or architectures.`);
  if (clarity < 18) improvements.push(`Structure your answer with clear points. Use "first, second, finally" to guide the listener through your reasoning.`);
  if (improvements.length === 0) improvements.push(`Excellent answer. To go further, discuss edge cases, production considerations, or trade-offs versus alternative approaches.`);
  return improvements.join(' ');
}

function generateModelAnswer(day: CurriculumDay): string {
  const modelAnswers: Record<string, string> = {
    RAG: `A RAG pipeline consists of: (1) Document ingestion — splitting documents into chunks with overlap. (2) Embedding generation — converting chunks into vector representations using models like text-embedding-3-small. (3) Storage — inserting embeddings into a vector database like Pinecone or pgvector. (4) Retrieval — at query time, embed the user's question, perform semantic search to find top-k relevant chunks. (5) Augmentation — inject retrieved chunks into the LLM prompt as context. (6) Generation — the LLM generates an answer grounded in the retrieved context. Advanced RAG adds re-ranking, hybrid search, query transformation, and citation tracking.`,
    'Vector Databases': `HNSW (Hierarchical Navigable Small World) builds a multi-layer graph index. The top layers are sparse with long-range connections for fast navigation; lower layers are dense for precise matching. Search starts at the top layer and greedily moves toward the query, then descends to denser layers. This gives O(log n) approximate nearest neighbor search, far faster than brute-force O(n) comparison. The trade-off is memory usage and build time, but query latency is dramatically reduced, making it ideal for production semantic search at scale.`,
    'Prompt Engineering': `Chain-of-thought (CoT) prompting asks the model to reason step-by-step before producing a final answer. Instead of "What is 15 * 17?", you prompt "Let's think step by step: 15 * 17 = ...". CoT outperforms standard prompting on multi-step reasoning, math, and logic tasks because it forces the model to decompose problems and show intermediate reasoning. It's especially effective on larger models (70B+). Variants include few-shot CoT (with examples) and zero-shot CoT (just "think step by step"). The ReAct pattern extends this by interleaving reasoning with tool use.`,
    'Agentic AI': `An AI agent differs from a prompt chain in autonomy and adaptivity. A prompt chain is a fixed sequence of prompts — each step is predetermined. An agent uses an LLM as its reasoning engine to dynamically decide: what to do next, which tools to call, when to stop, and how to handle errors. Agents have a perception-action loop: observe → reason → act → observe result → repeat. Use prompt chains for predictable, linear workflows. Use agents when the path depends on intermediate results — e.g., research, coding, or multi-step data analysis where you can't pre-determine the steps.`,
    MCP: `The Model Context Protocol (MCP) standardizes how AI models receive context from external sources. It defines a protocol where MCP servers expose resources and tools, and MCP clients (like Claude) consume them. The problem it solves: every AI application previously needed custom integrations for each data source. MCP provides a universal interface — write an MCP server once, any MCP-compatible AI model can use it. Compared to REST APIs, MCP handles context negotiation, resource templating, and tool discovery automatically, reducing integration boilerplate.`,
    'AI Deployment': `For production AI deployment: (1) Build the service with FastAPI exposing a /predict endpoint. (2) Containerize with Docker, bundling model weights and dependencies. (3) Use Gunicorn/uvicorn workers for concurrency. (4) Deploy to a container platform (AWS ECS, GCP Cloud Run, or Railway). (5) Add a load balancer and auto-scaling. (6) Implement health checks and graceful shutdown. (7) Set up monitoring with Prometheus/Grafana for latency, error rates, and GPU utilization. (8) Use feature flags for safe rollouts. Serverless works for light inference but cold starts and GPU availability make containers better for heavy models.`,
    'Production AI': `Cost optimization strategies: (1) Model routing — use cheaper models (Haiku) for simple tasks, expensive models (Opus) only when needed. (2) Semantic caching — cache repeated queries by embedding similarity. (3) Token budgeting — set max_tokens per request and monitor usage. (4) Prompt compression — remove redundant context. (5) Batch API — use batch endpoints for non-real-time workloads at 50% cost reduction. (6) Quantization — use quantized models for inference. (7) Prompt caching — cache prompt prefixes. (8) Monitor cost per request and set billing alerts.`,
    'LLM Foundations': `Fine-tuning vs RAG vs prompt engineering: Use prompt engineering when you need quick iteration and the task fits within the model's capabilities. Use RAG when you need the model to access dynamic, domain-specific, or proprietary knowledge — it's cheaper and more updatable than fine-tuning. Use fine-tuning when you need to change the model's behavior, tone, or format consistently, or when the task requires deep domain specialization that prompting can't achieve. Fine-tuning is expensive and hard to update; RAG is flexible but adds latency; prompt engineering is cheapest but limited by context window.`,
    Introduction: `Building an AI engineering portfolio: (1) Ship 3-5 complete projects with live demos — e.g., a RAG-powered doc search, an agent-based research tool, a production AI feature. (2) Write technical blog posts explaining your architecture decisions. (3) Open-source your components on GitHub. (4) Contribute to AI open-source projects. (5) Share your work on LinkedIn and Twitter. (6) Prepare for interviews by practicing system design for AI, explaining trade-offs, and coding live. The key is showing you can build end-to-end systems, not just call APIs.`,
  };

  return modelAnswers[day.module] || `A strong answer would cover the core concepts of ${day.title}, explain the underlying mechanisms, provide a concrete example, and discuss production considerations or trade-offs. Key objectives from this day: ${day.objectives.join(', ')}.`;
}

// ============================================================
// Feedback Agent: Generates the final report
// ============================================================

export function generateFinalReport(
  candidate: Candidate,
  conversation: ChatMessage[],
  scores: AnswerScore[],
  daysCovered: number[]
): FinalReport {
  const userMessages = conversation.filter((m) => m.role === 'user');

  // Overall score
  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.total, 0) / scores.length)
    : 0;

  // Topic-wise scores
  const topicMap = new Map<string, { topic: string; score: number; day: number; count: number }>();
  userMessages.forEach((msg, i) => {
    const score = scores[i];
    if (!score || !msg.dayCovered) return;
    const day = curriculum.find((d) => d.day === msg.dayCovered);
    const topic = day?.module || 'Unknown';
    const existing = topicMap.get(topic);
    if (existing) {
      existing.score += score.total;
      existing.count += 1;
    } else {
      topicMap.set(topic, { topic, score: score.total, day: msg.dayCovered, count: 1 });
    }
  });

  const topicScores = Array.from(topicMap.values()).map((t) => ({
    topic: t.topic,
    score: Math.round(t.score / t.count),
    day: t.day,
  }));

  // Strengths
  const strengths: string[] = [];
  topicScores.filter((t) => t.score >= 70).forEach((t) => {
    strengths.push(`Strong performance in ${t.topic} (score: ${t.score}/100)`);
  });
  if (strengths.length === 0 && topicScores.length > 0) {
    const best = topicScores.reduce((a, b) => (a.score > b.score ? a : b));
    strengths.push(`Best performance in ${best.topic} (score: ${best.score}/100)`);
  }
  candidate.strengths.forEach((s) => {
    if (!strengths.some((st) => st.includes(s))) strengths.push(`Demonstrated knowledge in ${s.toLowerCase()}`);
  });

  // Growth areas
  const growthAreas: string[] = [];
  topicScores.filter((t) => t.score < 65).forEach((t) => {
    growthAreas.push(`${t.topic} needs improvement (score: ${t.score}/100) — review the curriculum materials and practice with hands-on projects`);
  });
  if (growthAreas.length === 0 && topicScores.length > 0) {
    const worst = topicScores.reduce((a, b) => (a.score < b.score ? a : b));
    growthAreas.push(`${worst.topic} is your weakest area (score: ${worst.score}/100) — focus your next study cycle here`);
  }
  candidate.weaknesses.forEach((w) => {
    if (!growthAreas.some((g) => g.includes(w))) growthAreas.push(`Continue building expertise in ${w.toLowerCase()}`);
  });

  // Model answers for questions
  const modelAnswers = userMessages.map((msg, i) => {
    const score = scores[i];
    const day = curriculum.find((d) => d.day === msg.dayCovered);
    const agentQuestion = conversation.filter((m) => m.role === 'agent')[i];
    return {
      question: agentQuestion?.content || '',
      answer: score?.modelAnswer || `Review the concepts from ${day?.title || 'this topic'}.`,
      day: msg.dayCovered || 0,
    };
  });

  // Summary
  const summary = `This interview covered ${daysCovered.length} curriculum days across ${topicScores.length} distinct topics over ${userMessages.length} questions. ${candidate.name} demonstrated ${overallScore >= 75 ? 'strong' : overallScore >= 60 ? 'solid' : 'developing'} understanding of the cohort material, with particular strength in ${topicScores[0]?.topic || 'core concepts'}.`;

  // Recommendation
  let recommendation: string;
  if (overallScore >= 80) {
    recommendation = `Excellent performance. ${candidate.name} is ready for advanced AI engineering roles. Focus on system design and leadership skills next.`;
  } else if (overallScore >= 65) {
    recommendation = `Good foundation. ${candidate.name} should deepen knowledge in growth areas and build more production-grade projects before interviewing for senior roles.`;
  } else if (overallScore >= 50) {
    recommendation = `Developing skills. ${candidate.name} should revisit the curriculum modules in the growth areas, complete more hands-on missions, and retry the interview after 2 weeks of focused practice.`;
  } else {
    recommendation = `Early stage. ${candidate.name} should focus on completing more cohort missions, especially in the identified growth areas, before attempting technical interviews.`;
  }

  return {
    overallScore,
    topicScores,
    strengths: strengths.slice(0, 6),
    growthAreas: growthAreas.slice(0, 6),
    modelAnswers,
    summary,
    recommendation,
  };
}

// ============================================================
// Session constraints
// ============================================================

export const MIN_QUESTIONS = 8;
export const MIN_DAYS = 4;

export function canEndInterview(questionCount: number, daysCovered: number[]): boolean {
  return questionCount >= MIN_QUESTIONS && new Set(daysCovered).size >= MIN_DAYS;
}
