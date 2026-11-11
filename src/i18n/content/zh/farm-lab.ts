import type { FarmCopy } from '@/modules/scenarios/content/farm-lab';
import type { FarmLevel, FarmQuestion } from '@/modules/scenarios/content/farm-engine';

const BRIEF_Q: FarmQuestion[] = [
  { id: 'brief-1', concept: '目标与限制', prompt: '一份好的任务说明，开头应该是什么？', options: ['目标、限制，以及你打算怎么检查结果', '具体敲哪些键', '仓库里每个文件的清单'], answerIndex: 0, explanation: 'agent 需要知道终点、路上的规则，以及完成的判定。' },
  { id: 'brief-2', concept: '模糊的任务', prompt: '任务说明只写“把设置页做得更好一点”，通常会怎样？', options: ['agent 自己猜“更好”是什么意思，然后改错地方', 'agent 会先问三个澄清问题', 'agent 会拒绝开工'], answerIndex: 0, explanation: 'agent 很少停下来问。目标模糊就会变成猜测，猜测就会变成 diff。' },
  { id: 'brief-3', concept: '上下文', prompt: '哪种上下文对 agent 最有用？', options: ['文件路径、可以照抄的现有模式，以及失败的测试', '一段很长的项目历史故事', '提醒它“写干净点”'], answerIndex: 0, explanation: '指到文件、模式和失败处。故事是讲给人听的。' },
  { id: 'brief-4', concept: '范围', prompt: '什么内容不值得写进任务说明？', options: ['agent 自己能想明白的操作步骤', '完成的定义', '不能妥协的限制'], answerIndex: 0, explanation: '给终点和规则，不要给手指动作。' },
  { id: 'brief-5', concept: '完成的定义', prompt: '哪个“完成标准”是可以检验的？', options: ['空购物车显示 0，并且结账测试通过', '页面看起来更舒服', '代码质量很高'], answerIndex: 0, explanation: '别人能跑的检查，胜过没人能衡量的形容词。' },
  { id: 'brief-6', concept: '先要计划', prompt: '任务要改五个文件。任务说明里应该先要什么？', options: ['动手前先给一个简短计划', '一次改完五个文件', '重写整个模块'], answerIndex: 0, explanation: '计划评审起来很便宜；改完二十处才发现计划错了，很贵。' },
];

const DELEGATE_Q: FarmQuestion[] = [
  { id: 'delegate-1', concept: '可以交出去什么', prompt: '哪类任务最适合交给 agent？', options: ['照着现有模式做的重复表单', '决定要不要砍掉一个功能', '选择鉴权模型'], answerIndex: 0, explanation: '有清晰模式的样板代码适合 agent；判断类决定留给自己。' },
  { id: 'delegate-2', concept: '什么要留在手里', prompt: '哪个决定必须由人来做？', options: ['谁能读到另一个用户的数据', '给局部变量改名', '加一个加载动画'], answerIndex: 0, explanation: '安全和权限是责任决定，不是杂活。' },
  { id: 'delegate-3', concept: '交接', prompt: '什么才算好的交接？', options: ['目标、相关文件、限制和检查方式', '一个截止时间加一句“你看着办”', '把整个仓库粘进提示词'], answerIndex: 0, explanation: '一个初级同事会问的四件事，agent 也需要。' },
  { id: 'delegate-4', concept: '需求不清', prompt: '需求还没说清，你该怎么做？', options: ['先澄清，再交出去', '先交出去看看回来什么', '让 agent 自己决定'], answerIndex: 0, explanation: '把不清的需求交出去，只会得到一个自信的错误答案。' },
  { id: 'delegate-5', concept: '检查交回来的活', prompt: 'agent 交回一个能跑的功能，接下来呢？', options: ['读 diff，检查边界情况，再合并', '演示能跑就合并', '问 agent 它觉得好不好'], answerIndex: 0, explanation: '能演示不等于评审过。diff 和边界才是。' },
  { id: 'delegate-6', concept: '心智模型', prompt: '哪种比喻最适合 coding agent？', options: ['一个很快、但没参加昨天会议的初级同事', '一个永远正确的编译器', '一个带聊天框的搜索引擎'], answerIndex: 0, explanation: '像对初级同事那样交代，也像对初级同事那样评审。' },
];

const REVIEW_Q: FarmQuestion[] = [
  { id: 'review-1', concept: '证据', prompt: 'agent 说“测试全过”。你先查什么？', options: ['测试覆盖了什么，是否真的跑到这次改动', '测试有多少个', 'agent 的语气自不自信'], answerIndex: 0, explanation: '测试绿只说明测试过了，不说明测对了东西。' },
  { id: 'review-2', concept: '读 diff', prompt: 'agent 的 PR，第一眼该读什么？', options: ['逐个文件读 diff，包括你没想到会改的文件', 'agent 写的总结', '改了多少行'], answerIndex: 0, explanation: '总结是声明，diff 是证据。' },
  { id: 'review-3', concept: '范围蔓延', prompt: '你只要改按钮颜色，diff 却顺手改了 API。这是什么？', options: ['范围蔓延：拒绝，要求拆成单独的改动', '贴心的附赠：合并', '重构：永远欢迎'], answerIndex: 0, explanation: '没被要求的改动会藏风险。拆出来，专门评审。' },
  { id: 'review-4', concept: '边界情况', prompt: '购物车总价，应该检查哪个边界？', options: ['空购物车、缺失价格、负数数量', '一件商品的正常路径', '总价的颜色'], answerIndex: 0, explanation: '正常路径是演示，边界才是 bug 住的地方。' },
  { id: 'review-5', concept: '要证据', prompt: 'agent 说修好了。最便宜的证据是什么？', options: ['它跑的命令和输出，或一个修前失败、修后通过的测试', '更长的解释', '代码截屏'], answerIndex: 0, explanation: '命令和输出可以核对，解释不能。' },
  { id: 'review-6', concept: '负责', prompt: 'agent 写的改动把线上搞挂了。回顾会上该说什么？', options: ['下次你在流程上要改什么', '这是 agent 写的', '没人告诉我要测'], answerIndex: 0, explanation: 'agent 不会来开回顾会。负责，就是你能做出的改变。' },
];

const BRIEFING: FarmLevel = {
  id: 'briefing',
  name: '第一块田 · 任务说明',
  brief: '六块成熟的地，对应六个任务说明要点。开上去、答题、再收割。',
  lesson: { title: '把任务说明写清楚：怎么给 agent 交代任务', href: '/courses/working-with-ai-coding-agents' },
  width: 7,
  height: 5,
  start: { x: 0, y: 2, dir: 1 },
  tiles: [1, 2, 3, 4, 5, 6].map((x, i) => ({ x, y: 2, crop: 'ripe' as const, questionId: BRIEF_Q[i]!.id })),
  questions: BRIEF_Q,
  goal: 'harvest',
  target: 6,
  maxSteps: 24,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

const DELEGATION: FarmLevel = {
  id: 'delegation',
  name: '第二块田 · 委派',
  brief: '六块地分布在顶边和右边。写一段程序，再循环它。',
  lesson: { title: '委派：什么交给 agent，什么留在自己手里', href: '/courses/working-with-ai-coding-agents' },
  width: 5,
  height: 5,
  start: { x: 0, y: 0, dir: 1 },
  tiles: [
    { x: 1, y: 0, crop: 'ripe', questionId: 'delegate-1' },
    { x: 2, y: 0, crop: 'ripe', questionId: 'delegate-2' },
    { x: 3, y: 0, crop: 'ripe', questionId: 'delegate-3' },
    { x: 3, y: 1, crop: 'ripe', questionId: 'delegate-4' },
    { x: 3, y: 2, crop: 'ripe', questionId: 'delegate-5' },
    { x: 3, y: 3, crop: 'ripe', questionId: 'delegate-6' },
  ],
  questions: DELEGATE_Q,
  goal: 'harvest',
  target: 6,
  maxSteps: 40,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

const REVIEW: FarmLevel = {
  id: 'review',
  name: '第三块田 · 评审',
  brief: '六块地排成一行。只收割你能说清理由的。',
  lesson: { title: '辨别与尽责：评审 agent 写的代码', href: '/courses/working-with-ai-coding-agents' },
  width: 7,
  height: 4,
  start: { x: 0, y: 1, dir: 1 },
  tiles: [1, 2, 3, 4, 5, 6].map((x, i) => ({ x, y: 1, crop: 'ripe' as const, questionId: REVIEW_Q[i]!.id })),
  questions: REVIEW_Q,
  goal: 'harvest',
  target: 6,
  maxSteps: 24,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

export const FARM_LAB_ZH: FarmCopy = {
  key: 'farm-lab',
  title: '农场实验室',
  tagline: '一道题一块地，把 Agents 课收回家。',
  summary:
    '《和 AI 编程 agent 一起工作》的复习地图：给无人机编程序，开到成熟的地块上答题，答对才能收割。三块田，十八个概念。',
  meta: '3 块田 · 18 道题 · 约 12 分钟',
  minutes: 12,
  labels: {
    run: '运行程序',
    reset: '重置',
    stop: '停止',
    program: '程序',
    commands: '指令',
    empty: '从下面的指令里添加。',
    loop: '重复',
    harvest: '收割',
    plant: '播种',
    forward: '前进',
    left: '左转',
    right: '右转',
    levelLabel: '田地',
    goal: '已收割',
    steps: '步数',
    success: '这块田清空了，这些概念归你了。',
    tryAgain: '还差一点。改改程序，再跑一次。',
    tooMany: '步数用完了。',
    hint: '提示：把一条边写进程序，然后循环它。',
    next: '下一块田',
    question: '复习题',
    correct: '答对了，收割它。',
    wrong: '还不对。',
    mastered: '概念',
    weak: '薄弱点',
    reviewLesson: '复习这一课',
    close: '关闭',
    retry: '再试一次',
  },
  levels: [BRIEFING, DELEGATION, REVIEW],
};
