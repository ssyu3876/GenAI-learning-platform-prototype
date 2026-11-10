// English strings composed inside the scenario engines (not in the content files), keyed by
// their English text so the same dictionary walk can translate results and stored history.
// Keep the keys EXACTLY as they appear in src/modules/scenarios/engine.ts.
export const ENGINE_ZH: Record<string, string> = {
  'Read the tests.': '先读测试。',
  'Repaired, then shipped. This is the sequence a bad turn needs.':
    '先修复，再发布。这正是有问题的改动应该走的流程。',
  'The repair worked and then you rejected it. The work is wasted.':
    '修复确实有效，但你最后还是拒绝了它。这番功夫白费了。',
  'Shipped, and nothing broken': '发布顺利，没有出问题',
  'Approving is the cheapest action available, which is why it is the one to distrust. The turns that cost the most were the ones where the only correct move was to read the tests first, or to make the output better before deciding.':
    '批准是最省事的操作，所以最该警惕。代价最大的那几轮，往往唯一正确的做法是先读测试，或者先把产出改好再决定。',
  'A claim you cannot verify is not a decision yet. Check, then decide.':
    '无法验证的说法还不能拿来做决定。先核查，再决定。',
  'It shipped with damage': '发布上线，但留下了损伤',
  'The time you saved did not survive the invoice. Quality and review time trade against each other, and the weighting is deliberately unkind to approving in a hurry.':
    '省下来的时间最终没有逃过账单。质量与评审时间此消彼长，而评分规则故意不宽容草率批准。',
  'If there is no time to check a change, there is no time to ship it.':
    '如果没有时间检查一处改动，那就没有时间发布它。',
  'It shipped broken': '带病上线',
  'Every wrong turn was cheaper than the right one at the moment you took it. That is the trap: the cost of a bad approval arrives later and lands on someone else.':
    '每一个错误选择在当下都比正确选择更省事，这正是陷阱：错误批准的代价会晚些到来，而且由别人承担。',
  'The cheapest action in the moment is usually the most expensive one in the quarter.':
    '当下最省事的操作，往往是这个季度最昂贵的。',
  'Morale is close to breaking. Anything that buys the team a day is worth more than a feature this week.':
    '团队士气已经濒临崩溃。这周能给团队多争取一天的事，比任何功能都值得做。',
  'Quality is low enough that the next bug will be expensive. Spend a decision on it rather than on scope.':
    '质量已经低到下一个 bug 会很昂贵。把一次决策用在质量上，而不是用在扩大范围上。',
  'The runway is the constraint now. Every decision should either earn or save, and neither is free.':
    '现在真正的约束是现金流。每个决策要么挣钱，要么省钱，而两者都不是免费的。',
  'Almost nobody is using it yet. The team is building for a group that has not arrived.':
    '几乎还没有人在用它。团队正在为一群尚未出现的人做东西。',
  'Nothing is on fire. That is the best moment to spend a decision on the thing you keep postponing.':
    '眼下没有着火。这正是把一次决策用在你一直拖延的事情上的最佳时机。',
  'This was not a slow decline. It was a single decision that could not be undone, taken when the easier option was one click away.':
    '这不是缓慢的衰退，而是一个无法撤回的决定——当时更轻松的选择就在一次点击之外。',
  'Some options are survivable and some are not. Reversibility is the question to ask first.':
    '有些选择可以扛过去，有些不能。先问一句：这个决定可逆吗？',
};
