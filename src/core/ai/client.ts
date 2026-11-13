// The only place that talks to an LLM provider. Every feature calls these helpers with a
// `feature` name (for usage logs) and a `mock` fallback, so the app keeps working with no
// API key, when the daily limit is hit, or when the provider errors.
//
// Provider: any OpenAI-compatible Chat Completions API (DeepSeek by default).
// Server-side only: never import this from a 'use client' file (the API key lives here).
import { and, count, eq, gte } from 'drizzle-orm';
import type { z } from 'zod';
import { getDb } from '@/core/db/client';
import { aiUsage } from '@/core/db/schema';
import { newId } from '@/core/ids';

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** fast = cheap bulk work (quizzes, summaries), smart = role-play, course generation */
export type ModelTier = 'fast' | 'smart';

interface BaseOptions {
  feature: string;
  userId?: string | null;
  tier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
}

const config = () => ({
  apiKey: process.env.AI_API_KEY ?? '',
  baseUrl: (process.env.AI_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, ''),
  models: {
    fast: process.env.AI_MODEL_FAST ?? 'deepseek-flash',
    smart: process.env.AI_MODEL_SMART ?? process.env.AI_MODEL_FAST ?? 'deepseek-flash',
  },
  // DeepSeek-V4.1-Flash supports low/high/max. "max" is slower but the best fit for
  // course generation, which is the one feature where quality matters more than latency.
  reasoningEffort: process.env.AI_REASONING_EFFORT ?? 'max',
  jsonMode: process.env.AI_JSON_MODE !== 'false',
  dailyLimit: Number(process.env.AI_DAILY_LIMIT_PER_USER ?? 200),
});

export function isAiConfigured(): boolean {
  return config().apiKey.length > 0;
}

async function logUsage(entry: {
  feature: string;
  userId?: string | null;
  model: string;
  mocked: boolean;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
}) {
  try {
    const db = await getDb();
    await db.insert(aiUsage).values({
      id: newId('aiUsage'),
      feature: entry.feature,
      userId: entry.userId ?? null,
      model: entry.model,
      mocked: entry.mocked,
      promptTokens: entry.promptTokens ?? 0,
      completionTokens: entry.completionTokens ?? 0,
      latencyMs: entry.latencyMs,
    });
  } catch (err) {
    console.error('[ai] failed to log usage', err);
  }
}

/** Decide whether this call should hit the real provider. */
async function shouldUseProvider(userId?: string | null): Promise<boolean> {
  const cfg = config();
  if (!cfg.apiKey) return false;
  if (!userId) return true;
  const db = await getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.mocked, false), gte(aiUsage.createdAt, since)));
  return (row?.n ?? 0) < cfg.dailyLimit;
}

async function callProvider(
  messages: ChatMessage[],
  opts: BaseOptions & { json?: boolean; stream?: boolean },
): Promise<Response> {
  const cfg = config();
  const body: Record<string, unknown> = {
    model: cfg.models[opts.tier ?? 'fast'],
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1200,
    stream: opts.stream ?? false,
  };
  if (opts.stream) body.stream_options = { include_usage: true };
  if (opts.json && cfg.jsonMode) body.response_format = { type: 'json_object' };
  if (cfg.reasoningEffort) body.reasoning_effort = cfg.reasoningEffort;
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    throw new Error(`AI provider ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res;
}

/** One-shot text completion. */
export async function generateText(
  messages: ChatMessage[],
  opts: BaseOptions & { mock: () => string },
): Promise<{ text: string; mocked: boolean }> {
  const started = Date.now();
  const model = config().models[opts.tier ?? 'fast'];
  if (await shouldUseProvider(opts.userId)) {
    try {
      const res = await callProvider(messages, opts);
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? '';
      await logUsage({
        ...opts,
        model,
        mocked: false,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        latencyMs: Date.now() - started,
      });
      if (text) return { text, mocked: false };
    } catch (err) {
      console.error(`[ai] ${opts.feature} failed, using mock`, err);
    }
  }
  await logUsage({ ...opts, model: 'mock', mocked: true, latencyMs: Date.now() - started });
  return { text: opts.mock(), mocked: true };
}

/** Pulls the first JSON object out of a model reply (handles ```json fences and chatter). */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object in model output');
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Structured output validated with zod. Retries once with the validation error, then
 * falls back to the mock. The prompt must describe the JSON shape; the schema enforces it.
 */
export async function generateJson<T>(
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  opts: BaseOptions & { mock: () => T },
): Promise<{ data: T; mocked: boolean }> {
  const started = Date.now();
  const model = config().models[opts.tier ?? 'fast'];
  if (await shouldUseProvider(opts.userId)) {
    let convo = [...messages];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await callProvider(convo, { ...opts, json: true });
        const body = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const raw = body.choices?.[0]?.message?.content ?? '';
        await logUsage({
          ...opts,
          model,
          mocked: false,
          promptTokens: body.usage?.prompt_tokens,
          completionTokens: body.usage?.completion_tokens,
          latencyMs: Date.now() - started,
        });
        const parsed = schema.safeParse(extractJson(raw));
        if (parsed.success) return { data: parsed.data, mocked: false };
        convo = [
          ...convo,
          { role: 'assistant', content: raw },
          {
            role: 'user',
            content: `That JSON did not match the required shape: ${parsed.error.message.slice(0, 800)}. Reply with corrected JSON only.`,
          },
        ];
      } catch (err) {
        console.error(`[ai] ${opts.feature} attempt ${attempt + 1} failed`, err);
      }
    }
  }
  await logUsage({ ...opts, model: 'mock', mocked: true, latencyMs: Date.now() - started });
  return { data: opts.mock(), mocked: true };
}

/**
 * Streaming chat for tutor / role-play. Returns a plain-text ReadableStream you can hand
 * straight to `new Response(stream)` in a route handler. The client reads it with
 * `res.body.getReader()`.
 */
export async function streamText(
  messages: ChatMessage[],
  opts: BaseOptions & { mock: () => string },
): Promise<ReadableStream<Uint8Array>> {
  const started = Date.now();
  const model = config().models[opts.tier ?? 'fast'];
  const encoder = new TextEncoder();

  const mockStream = () => {
    const words = opts.mock().split(/(\s+)/);
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        await logUsage({ ...opts, model: 'mock', mocked: true, latencyMs: 0 });
        for (const w of words) {
          controller.enqueue(encoder.encode(w));
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      },
    });
  };

  if (!(await shouldUseProvider(opts.userId))) return mockStream();

  let res: Response;
  try {
    res = await callProvider(messages, { ...opts, stream: true });
  } catch (err) {
    console.error(`[ai] ${opts.feature} stream failed, using mock`, err);
    return mockStream();
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        await logUsage({
          ...opts,
          model,
          mocked: false,
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          latencyMs: Date.now() - started,
        });
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const chunk = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
            usage?: typeof usage;
          };
          if (chunk.usage) usage = chunk.usage;
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          // partial line, ignore
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}
