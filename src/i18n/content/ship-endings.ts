// Ship It has three endings whose body sentence is composed from the run's numbers, so the
// string dictionary cannot match it. The UI asks for a localised ending by key instead.
import type { Locale } from '../config';

export interface ShipEndingData {
  repaired: number;
  approvedClean: number;
  wrong: number;
  quality: number;
  minutes: number;
}

export interface ShipEndingText {
  key: string;
  title: string;
  body: string;
  insight: string;
  takeaway: string;
  data?: ShipEndingData;
}

const ZH: Record<string, { title: string; body: (d: ShipEndingData) => string; insight: string; takeaway: string }> = {
  clean: {
    title: '发布顺利，没有出问题',
    body: (d) =>
      `有 ${d.repaired} 处改动先修复后发布，${d.approvedClean} 处按原样通过，应该被拒绝的改动一处都没有被批准。质量守住了，还剩下 ${d.minutes} 分钟。`,
    insight:
      '批准是最省事的操作，所以最该警惕。代价最大的那几轮，往往唯一正确的做法是先读测试，或者先把产出改好再决定。',
    takeaway: '无法验证的说法还不能拿来做决定。先核查，再决定。',
  },
  partial: {
    title: '发布上线，但留下了损伤',
    body: (d) => `有 ${d.wrong} 次操作拉低了质量，还剩 ${d.minutes} 分钟没有用完。版本发出去了，bug 列表也变长了。`,
    insight:
      '省下来的时间最终没有逃过账单。质量与评审时间此消彼长，而评分规则故意不宽容草率批准。',
    takeaway: '如果没有时间检查一处改动，那就没有时间发布它。',
  },
  incident: {
    title: '带病上线',
    body: (d) => `质量最终停在 ${d.quality}，还剩 ${d.minutes} 分钟没有用完。事故复盘发现的是一连串批准，而不是某一次糟糕的判断。`,
    insight:
      '每一个错误选择在当下都比正确选择更省事，这正是陷阱：错误批准的代价会晚些到来，而且由别人承担。',
    takeaway: '当下最省事的操作，往往是这个季度最昂贵的。',
  },
};

export function localizeShipEnding<T extends ShipEndingText>(ending: T, locale: Locale): T {
  if (locale === 'en') return ending;
  const zh = ZH[ending.key];
  if (!zh || !ending.data) return ending;
  return { ...ending, title: zh.title, body: zh.body(ending.data), insight: zh.insight, takeaway: zh.takeaway };
}
