'use server';

import { z } from 'zod';
import { generateText } from '@/core/ai/client';
import { requireUser } from '@/core/auth/session';
import { byLocale, outputLanguage } from '@/i18n/ai';
import { getT } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { loadActivity } from '../server';
import { codingConfigSchema } from './schema';

const inputSchema = z.object({
  activityId: z.string(),
  code: z.string().max(8000),
  failing: z.array(z.string().max(300)).max(12),
});

/** A nudge, not the answer. Uses the cheap model. */
export async function getCodingHint(input: z.infer<typeof inputSchema>): Promise<{ hint: string; mocked: boolean }> {
  const user = await requireUser();
  const { locale } = await getT();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      hint: byLocale(locale, 'Run the tests first, then ask me again.', '先运行一下测试，然后再来问我。'),
      mocked: true,
    };
  }
  const activity = await loadActivity(parsed.data.activityId, codingConfigSchema);
  if (!activity) {
    return { hint: byLocale(locale, 'I could not find this exercise.', '我找不到这个练习。'), mocked: true };
  }
  const { config } = localizeContent(activity, locale);
  const firstFail = parsed.data.failing[0];

  const { text, mocked } = await generateText(
    [
      {
        role: 'system',
        content: [
          'You are Pip, a patient coding tutor. Give ONE short hint (max 70 words) that helps the learner find the problem themselves.',
          'Point at the line or idea, ask a guiding question. Never paste a full corrected solution.',
          outputLanguage(locale),
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          `Task: ${config.instructions}`,
          config.hintContext ? `Context: ${config.hintContext}` : '',
          `Function: ${config.functionName}`,
          `Learner code:\n${parsed.data.code}`,
          `Failing tests:\n${parsed.data.failing.join('\n') || '(none run yet)'}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
    {
      feature: 'activities.coding_hint',
      userId: user.id,
      tier: 'fast',
      maxTokens: 200,
      mock: () =>
        locale === 'zh'
          ? firstFail
            ? `仔细看看失败的用例：${firstFail}。你的函数在那个输入下逐步返回了什么？可以在 return 之前加一行 console.log 试试。`
            : '先从最简单的测试用例开始。它应该返回什么？现在实际返回了什么？'
          : firstFail
            ? `Look closely at the failing case: ${firstFail}. What does your function return for that input, step by step? Try adding a console.log just before the return.`
            : 'Start with the simplest test case. What should the function return there, and what does it return now?',
    },
  );
  return { hint: text, mocked };
}
