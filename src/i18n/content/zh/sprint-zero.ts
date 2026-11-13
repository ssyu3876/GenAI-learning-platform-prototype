// Sprint Zero: three weeks running a small product team.
//
// Each week has a bank of twelve questions and draws eight of them, three from the opening
// act, three from the middle, two from the end. So the order still reads like a week, but
// two playthroughs are not the same week. Some options are traps: they end the run on the
// spot, and the summary says why.
import type { SprintEnding, SprintScenario, SprintStep } from '@/modules/scenarios/content/types';

// ---------------------------------------------------------------------------
// Week 1 — Build it
// ---------------------------------------------------------------------------

const W1: SprintStep[] = [
  {
    id: 'w1-scope', act: 1,
    title: '三个功能，六周时间',
    body: '客户带来一份清单：三个功能，全是“必须做”，六周时间，两个人。',
    choices: [
      { id: 'all', label: '三个全接', cost: '快，但很重', effects: { budget: -6, morale: -16, users: 8, quality: -20 }, outcome: '到第四周，两个功能都只做了一半。没有一个做完，团队心里清楚。' },
      { id: 'one', label: '只上线一个，但做好', cost: '慢，但扎实', effects: { budget: 2, morale: 14, users: 3, quality: 14 }, outcome: '一个功能做得很漂亮。客户不太高兴，但代码库还能用。' },
      { id: 'proto', label: '先要一周做原型', cost: '耗时间', effects: { budget: -10, morale: 4, users: 1, quality: 8 }, outcome: '原型证明第三个功能根本不需要。没人因为这省下的一周谢你。' },
    ],
  },
  {
    id: 'w1-ceiling', act: 1,
    title: '客户又加了一个“小”需求',
    body: '他们又回来要一个功能，“很小”，“就一个按钮”。',
    choices: [
      { id: 'accept', label: '加上吧，听起来不大', cost: '范围蔓延', effects: { budget: -4, morale: -10, users: 6, quality: -12 }, outcome: '它需要一套新的权限模型。哪里都不“小”。' },
      { id: 'show', label: '把排期给他看，问他要砍哪个', cost: '一次谈话', effects: { budget: -2, morale: 6, users: 2, quality: 8 }, outcome: '他们放弃了按钮，保住了导出功能。这份排期替你争完了。' },
      { id: 'silent', label: '嘴上答应，悄悄少做一个别的', cost: '不诚实', effects: { budget: 0, morale: -14, users: -4, quality: -6 }, outcome: '后来他们发现导出功能没了。失去的信任，比这个功能贵得多。' },
    ],
  },
  {
    id: 'w1-agent', act: 1,
    title: 'AI 助手说它能写支付模块',
    body: '一位同事建议让 AI 助手无人值守地把整个支付模块做完。“那都是样板代码。”支付代码从来不是样板代码。',
    choices: [
      { id: 'unattended', label: '让它无人值守地跑', cost: '省下几天', effects: { budget: 12, morale: 8, users: 0, quality: -26 }, outcome: '顺利路径能跑通。退款路径一次都没执行过。' },
      { id: 'review', label: '让它起草，每个改动都审', cost: '慢一些，稳一些', effects: { budget: -4, morale: -4, users: 0, quality: 16 }, outcome: '审查抓出了货币换算里的一处差一错误。' },
      { id: 'self', label: '自己写', cost: '最慢', effects: { budget: -10, morale: -10, users: 0, quality: 20 }, outcome: '搭进去三天。代码是对的，可那位同事在旁边什么也没学到。' },
    ],
  },
  {
    id: 'w1-burnout', act: 1,
    title: '你的队友已经快烧干了',
    body: '已经晚上十一点。他从早上七点干到现在，犯着平时绝不会犯的错。',
    seconds: 12, timeoutChoice: 2,
    choices: [
      { id: 'push', label: '硬撑，今晚做完', cost: '今晚就能上线', effects: { budget: 0, morale: -24, users: 0, quality: -14 }, outcome: '上线了。他请了两天病假，下一个功能花了两倍时间。' },
      { id: 'home', label: '让他回家，明天再弄', cost: '一天', effects: { budget: -5, morale: 18, users: 0, quality: 6 }, outcome: '第二天他二十分钟就找到了问题。十一点那版里有个坏掉的校验。' },
      { id: 'silent', label: '什么都不说，让他自己定', cost: '时间流走', effects: { budget: 0, morale: -12, users: 0, quality: -6 }, outcome: '他继续干，因为没人叫他停。沉默会被理解成“继续”。' },
    ],
  },
  {
    id: 'w1-auth', act: 1,
    title: '没人愿意听的鉴权漏洞',
    body: '一次迟到的评审发现了一个真实的授权漏洞。修它会让内测推迟一周，而资助方等的就是这个内测。',
    choices: [
      { id: 'fix', label: '现在就修，内测推迟', cost: '一周', effects: { budget: -14, morale: -8, users: -4, quality: 22 }, outcome: '资助方不高兴。可这个漏洞会让任何用户读到别人的账单。' },
      { id: 'later', label: '先上内测，下周再补', cost: '守住时间点', effects: { budget: 6, morale: 4, users: 14, quality: -24 }, outcome: '注册量跳了一截。这个漏洞在生产环境里活了六天。' },
      { id: 'ship-anyway', label: '直接上线，瞒着资助方', cost: '沉默的风险', effects: { budget: 8, morale: -20, users: 10, quality: -30 }, outcome: '一直管用，直到有人读到了不属于自己的账单。', fatal: { title: '内测被叫停', body: '一名测试者改了网址里的一个数字，就打开了别的账户的账单。资助方是从他那里知道的，不是从你这里。资助暂停了。' } },
    ],
  },
  {
    id: 'w1-pricing', act: 1,
    title: '用户喜欢，但没人付钱',
    body: '每周有一百五十人在用。收入是零，账上的钱只够撑六周。',
    choices: [
      { id: 'free', label: '继续免费，把用户做多', cost: '没有收入', effects: { budget: -22, morale: 6, users: 38, quality: -4 }, outcome: '用量涨，服务器账单也涨。没有收入的增长，就是在倒计时。' },
      { id: 'paywall', label: '今天就把付费墙立起来', cost: '马上有收入', effects: { budget: 26, morale: -10, users: -22, quality: 2 }, outcome: '一周内走了三分之一用户。留下的人真付钱。' },
      { id: 'freemium', label: '免费版加付费版', cost: '更多工作量', effects: { budget: 10, morale: -4, users: 14, quality: -8 }, outcome: '做两档套餐，花掉了你本来没有的一周。转化率 4%，不算高，但足够要紧。' },
    ],
  },
  {
    id: 'w1-enterprise', act: 2,
    title: '大客户要 SSO，不然就走人',
    body: '你最大的客户需要单点登录（SSO）。为一个贡献五分之一收入的客户花一个月。',
    choices: [
      { id: 'build', label: '老老实实做 SSO', cost: '一个月', effects: { budget: -18, morale: -8, users: 6, quality: 14 }, outcome: '客户留下了，另外两家企业也签了，因为 SSO 同样是他们的拦路石。' },
      { id: 'hack', label: '只给他们做一版', cost: '一周，很脆', effects: { budget: -6, morale: -4, users: 2, quality: -14 }, outcome: '一直能用，直到他们的身份服务商改了个字段名，然后凌晨两点成了你的问题。' },
      { id: 'drop', label: '让他们走', cost: '丢掉收入', effects: { budget: -16, morale: 6, users: -18, quality: 4 }, outcome: '你丢了五分之一收入，保住了一份服务所有人的路线图。' },
    ],
  },
  {
    id: 'w1-churn', act: 2,
    title: '第一周就流失六成用户',
    body: '人们注册、用两次，然后再也不回来。激活流程还是你们当初给自己做的那套。',
    choices: [
      { id: 'onboarding', label: '围绕一件真事重做新手引导', cost: '两周', effects: { budget: -12, morale: 6, users: 20, quality: 8 }, outcome: '新用户第一分钟就完成了一件有用的事。留存翻倍。' },
      { id: 'email', label: '发一组邮件', cost: '便宜，但绕', effects: { budget: -4, morale: -2, users: 4, quality: -2 }, outcome: '打开率还行，点击不行。一个把价值藏起来的产品，邮件救不了。' },
      { id: 'features', label: '再加些功能让人去找', cost: '越做越糟', effects: { budget: -10, morale: -8, users: -4, quality: -10 }, outcome: '产品越大，越难上手。你在一个漏水的漏斗上又加了几层。' },
    ],
  },
  {
    id: 'w1-marketing', act: 2,
    title: '市场部想宣传一个你还没有的功能',
    body: '发布文案里写着“自动报表”。自动报表并不存在，做出来要一个月。',
    choices: [
      { id: 'shipcopy', label: '先发文案，之后再补', cost: '以后再讲真话', effects: { budget: 12, morale: -12, users: 16, quality: -16 }, outcome: '注册量猛涨。然后客服收到一百条消息，问这个功能在哪。' },
      { id: 'honest', label: '把宣传砍到只讲已有的', cost: '诚实，声量更小', effects: { budget: -2, morale: 8, users: 4, quality: 8 }, outcome: '注册少一些，也没有愤怒的客户。注册的人拿到的东西，跟承诺的一样。' },
      { id: 'minimal', label: '这周赶个最简版', cost: '赶工', effects: { budget: -14, morale: -6, users: 10, quality: -8 }, outcome: '定时邮件不是自动报表，但也没人闹起来。' },
    ],
  },
  {
    id: 'w1-discount', act: 2,
    title: '最大的客户要打七折',
    body: '他们占收入的四成，续约时会重新评估。',
    choices: [
      { id: 'commit', label: '给折扣，换一年签约', cost: '用价格换确定', effects: { budget: 8, morale: -2, users: 4, quality: 0 }, outcome: '你用利润换来了可预期的收入。明年他们还会再问一次。' },
      { id: 'value', label: '守住价格，加送上手服务', cost: '有风险', effects: { budget: 0, morale: 8, users: -6, quality: 6 }, outcome: '他们留下了，有点不爽，你的定价守住了。' },
      { id: 'yes', label: '立刻答应', cost: '开了先例', effects: { budget: -6, morale: -10, users: 6, quality: -2 }, outcome: '他们续约了，一个月内其他所有客户都知道了这件事。' },
    ],
  },
  {
    id: 'w1-rewrite', act: 3,
    title: '你的工程师想重写鉴权',
    body: '他说现在的模块拖住了所有事。它能跑，也有测试，就是丑。',
    choices: [
      { id: 'rewrite', label: '让他用三周重写', cost: '路线图停摆', effects: { budget: -16, morale: 12, users: -4, quality: 16 }, outcome: '路线图停了三周。新模块更好，工程师也留下了。' },
      { id: 'incremental', label: '接口不变，在内部重构', cost: '慢一些，稳一些', effects: { budget: -8, morale: 4, users: 0, quality: 10 }, outcome: '没有大爆炸式改造。六周后内部全换了，没人察觉。' },
      { id: 'no', label: '拒绝，它能用', cost: '眼下省事', effects: { budget: 0, morale: -18, users: 0, quality: -8 }, outcome: '工程师去更新简历了。这个模块越来越没人敢碰。' },
    ],
  },
  {
    id: 'w1-hire', act: 3,
    title: '一个资深，还是两个初级',
    body: '两边花一样的预算，而团队里除了他们只有你。',
    choices: [
      { id: 'senior', label: '招那个资深的', cost: '快，但窄', effects: { budget: -20, morale: 10, users: 8, quality: 14 }, outcome: '第一周就能出货，还能审查所有人的代码。但他一走项目就完蛋的风险依旧吓人。' },
      { id: 'juniors', label: '招两个初级的', cost: '慢，但面广', effects: { budget: -20, morale: -6, users: 2, quality: -6 }, outcome: '两个人都需要带，而你没时间带。到第三个月他们才真正有用。' },
      { id: 'mixed', label: '资深加一个兼职初级', cost: '把预算撑到极限', effects: { budget: -24, morale: 6, users: 10, quality: 8 }, outcome: '你稍微超了预算，但覆盖面和人盯人都有了。' },
    ],
  },
  {
    id: 'w1-arch', act: 3,
    title: '两个人，两套架构',
    body: '一个要单体，因为上线快。一个要微服务，因为现在没法独立部署。',
    choices: [
      { id: 'pick', label: '选一个，全力押上去', cost: '清楚，但不讨好', effects: { budget: -6, morale: -6, users: 4, quality: 12 }, outcome: '一半人不同意，但所有人都知道该做什么。一个月内速度回来了。' },
      { id: 'both', label: '各做各的', cost: '避开冲突', effects: { budget: -4, morale: 6, users: 2, quality: -16 }, outcome: '两套系统、两条部署路径，以及中间对不上的数据模型。' },
      { id: 'review', label: '开一次设计评审，一起定', cost: '开头慢一点', effects: { budget: -10, morale: 10, users: 4, quality: 10 }, outcome: '双方都看清了取舍。决定能站得住，因为是大家一起做的。' },
    ],
  },
  {
    id: 'w1-investor', act: 1,
    title: '投资人要看每周数据',
    body: '有人可能会投你。在那之前，他们要一份周报：用户、收入、烧钱、留存。',
    choices: [
      { id: 'manual', label: '每周五手工拉一遍', cost: '每周一小时', effects: { budget: -4, morale: -6, users: 0, quality: 0 }, outcome: '每周一小时，从三个来源拼同一张表。' },
      { id: 'script', label: '写个小脚本，只写一次', cost: '两天', effects: { budget: -8, morale: 4, users: 0, quality: 8 }, outcome: '现在花两天，以后只要几秒。而且数字可复现，这一点后来比省下的时间更重要。' },
      { id: 'promise', label: '先答应，再发估算数', cost: '眼下不用做', effects: { budget: 0, morale: -10, users: 0, quality: -8 }, outcome: '你发了一组整数。他们拿去和银行流水对了一遍。', fatal: { title: '数字对不上', body: '投资人发现你的估算和真实数字差了百分之十二。融资就停在那里，而给出的理由不是数字本身，而是那个数字是编出来的。' } },
    ],
  },
  {
    id: 'w1-free-help', act: 1,
    title: '朋友愿意免费来帮忙',
    body: '一个很能干的朋友正好空出两周，说可以帮忙做点东西。没合同，没交接。',
    choices: [
      { id: 'take', label: '接受，把支付模块给他', cost: '免费劳力', effects: { budget: 6, morale: 8, users: 2, quality: -14 }, outcome: '他很快做完就走了。没人审过这段代码，也没人知道它为什么这么写。' },
      { id: 'scope', label: '接受，但只给他一块独立的东西', cost: '小心划范围', effects: { budget: 0, morale: 10, users: 2, quality: 6 }, outcome: '一个设置页，有审查，有文档。帮上忙，也没留下麻烦。' },
      { id: 'decline', label: '客气地拒绝', cost: '没人帮忙', effects: { budget: 0, morale: -2, users: 0, quality: 0 }, outcome: '代码库保持了一致，代价是丢了两周的免费劳动。' },
    ],
  },
  {
    id: 'w1-bug-report', act: 2,
    title: '最大用户报来一个 bug',
    body: '他们说有些情况下导出的最后一行会丢。你复现不出来。',
    choices: [
      { id: 'repro', label: '照他的描述原样写个测试', cost: '半天', effects: { budget: -4, morale: 4, users: 6, quality: 14 }, outcome: '测试跑到第三次才复现出它：行数正好是分页大小整数倍时，有一处差一错误。' },
      { id: 'ask', label: '请他录个屏', cost: '等一天', effects: { budget: 0, morale: -4, users: 2, quality: 4 }, outcome: '他发来了视频。证明的正是测试本来就能查出来的东西，只是晚了一天。' },
      { id: 'cannot', label: '告诉他复现不了', cost: '眼下不用做', effects: { budget: 0, morale: 0, users: -14, quality: -10 }, outcome: '他听到的是“这不是我们的问题”。两周后他流失了，理由写的就是导出。' },
    ],
  },
  {
    id: 'w1-hosting', act: 2,
    title: '服务器账单翻了一倍',
    body: '流量涨了两成，账单涨了一倍。有东西没有跟着线性增长。',
    choices: [
      { id: 'investigate', label: '先查清了再付钱', cost: '一天', effects: { budget: -2, morale: 4, users: 0, quality: 12 }, outcome: '一次迁移之后，某个定时任务不再走索引了。改一行，账单又掉回一半。' },
      { id: 'pay', label: '先付了，下季度再说', cost: '花钱', effects: { budget: -18, morale: -2, users: 4, quality: -4 }, outcome: '账单被吞了下去。该走的索引还是没走，而且会随流量一起涨。' },
      { id: 'cut', label: '砍功能来降负载', cost: '用户少了东西', effects: { budget: -4, morale: -8, users: -10, quality: 2 }, outcome: '账单降了，用量也降了。你除掉了一个症状，也除掉了一个用它的理由。' },
    ],
  },
  {
    id: 'w1-framework', act: 3,
    title: '团队想换框架',
    body: '一半人觉得现在的技术栈拖住了他们。另一半觉得重写会毁掉这个季度。',
    choices: [
      { id: 'no', label: '这个季度不行，把理由写下来', cost: '一个决定', effects: { budget: 0, morale: -6, users: 0, quality: 4 }, outcome: '你把取舍写了下来。一半人失望，但所有人都知道原因。' },
      { id: 'pilot', label: '在一个内部页面上试点', cost: '两周', effects: { budget: -10, morale: 8, users: 0, quality: 6 }, outcome: '试点用证据而不是用意见回答了问题。答案是“还不是时候，但理由和我们想的不一样”。' },
      { id: 'rewrite', label: '整个重写', cost: '整个季度', effects: { budget: -26, morale: -6, users: -18, quality: -16 }, outcome: '六周过去，迁移做了一半，两个版本都不稳定。' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Week 2 — Make it pay
// ---------------------------------------------------------------------------

const W2: SprintStep[] = [
  {
    id: 'w2-pricing-page', act: 1,
    title: '定价页转化率只有 1%',
    body: '每周一千人落到这个页面，十个人注册。现在的问题不在产品，在这个页面。',
    choices: [
      { id: 'rewrite', label: '重写页面，测三个版本', cost: '两周', effects: { budget: -10, morale: 4, users: 18, quality: 2 }, outcome: '第三个版本转化率 3.4%。前两个教会你哪一句话才是关键的。' },
      { id: 'trial', label: '改成加免费试用', cost: '把门槛放低', effects: { budget: -4, morale: 0, users: 12, quality: -4 }, outcome: '注册上来了，客服压力也上来了，因为人们在还没看懂之前就进来了。' },
      { id: 'cheap', label: '降到每月五块', cost: '更便宜，收入更少', effects: { budget: -2, morale: -6, users: 22, quality: 0 }, outcome: '付钱的人多了，每人付得少了，而每个客户的客服成本一点没变。' },
    ],
  },
  {
    id: 'w2-competitor', act: 1,
    title: '对手上线了你的招牌功能',
    body: '他们上周发布了你最出名的那项功能，还带着一份你追不上的市场预算。',
    choices: [
      { id: 'newfeature', label: '做点他们没有的', cost: '重新攒势能', effects: { budget: -16, morale: 10, users: 14, quality: -6 }, outcome: '靠功能做差异化像在跑步机上跑，但跑一个季度还是管用的。' },
      { id: 'compare', label: '发一页只讲事实的对比', cost: '便宜', effects: { budget: -2, morale: 4, users: 8, quality: 4 }, outcome: '搜索流量稳稳地来。不惊险，也不费钱。' },
      { id: 'ignore', label: '不理他们，去和用户聊', cost: '没有防线', effects: { budget: 0, morale: 2, users: -10, quality: 2 }, outcome: '你学到了一些真值得知道的事，也丢了那些本来就想找理由走的客户。' },
    ],
  },
  {
    id: 'w2-support', act: 1,
    title: '客服工单涨了三倍',
    body: '两个人现在每周花一半时间回答同样的六个问题。',
    choices: [
      { id: 'hire', label: '招一个客服', cost: '多一个编制', effects: { budget: -22, morale: 14, users: 10, quality: 0 }, outcome: '团队把一周的时间拿回来了。新来的客服问的也是那六个问题——这本身就是个发现。' },
      { id: 'selfserve', label: '把答案做进产品里', cost: '慢', effects: { budget: -12, morale: -4, users: 8, quality: 12 }, outcome: '三周时间永久消掉一半工单。另一半是 bug。' },
      { id: 'docs', label: '写一个帮助中心', cost: '便宜，但没用', effects: { budget: -2, morale: -10, users: -4, quality: -2 }, outcome: '没人看。工单照样来，只是现在附了一个他们跳过的页面链接。' },
    ],
  },
  {
    id: 'w2-viral', act: 1,
    title: '一条帖子一夜带来一万个注册',
    body: '基础设施是按三百个用户配的。现在是凌晨三点，数据库已经到 95%。',
    seconds: 20, timeoutChoice: 2,
    choices: [
      { id: 'capacity', label: '现在就花钱加容量', cost: '贵，但快', effects: { budget: -26, morale: 6, users: 26, quality: 0 }, outcome: '账单涨到三倍，但什么都没挂。这波浪你接住了，没有丢掉。' },
      { id: 'ratelimit', label: '限制新注册的速度', cost: '保住核心', effects: { budget: -4, morale: -4, users: 10, quality: 6 }, outcome: '老用户毫无感觉。这波人大部分在等，三分之一再也没回来。' },
      { id: 'nothing', label: '什么都不做，指望它撑住', cost: '赌一把', effects: { budget: 0, morale: -16, users: -8, quality: -18 }, outcome: '凌晨四点它挂了。状态页的访问量比那条帖子还高。' },
    ],
  },
  {
    id: 'w2-enterprise', act: 1,
    title: '合同里有一条数据条款',
    body: '一家企业客户希望他们的数据放在单独的数据库里。你的表结构只有一个租户字段。',
    choices: [
      { id: 'separate', label: '正经做租户隔离', cost: '三周', effects: { budget: -20, morale: -8, users: 8, quality: 18 }, outcome: '很贵，但正确。因此又打通了三笔企业订单。' },
      { id: 'promise', label: '答应隔离，然后加个过滤', cost: '看起来做完了', effects: { budget: 4, morale: -6, users: 12, quality: -26 }, outcome: '加过滤不等于隔离。漏一个 WHERE 条件，那就不是 bug，是数据泄露。', fatal: { title: '跨租户泄露', body: '一条报表查询跳过了租户过滤。一个客户看到了另一个客户的数据行。合同里那条条款之所以存在，是因为他们以前被烧过，现在你也被烧了。' } },
      { id: 'decline', label: '拒绝这条，把这单做小', cost: '丢掉这单', effects: { budget: -10, morale: 4, users: -6, quality: 6 }, outcome: '你丢掉这单，保住了一个诚实的架构。等它真的存在了，他们还会回来。' },
    ],
  },
  {
    id: 'w2-churn', act: 2,
    title: '企业客户要 SSO，不然就走',
    body: '一个占五分之一收入的客户需要单点登录。一个月的活。',
    choices: [
      { id: 'build', label: '老老实实做 SSO', cost: '一个月', effects: { budget: -18, morale: -8, users: 6, quality: 14 }, outcome: '客户留下了，另外两家也签了，因为 SSO 同样卡着他们。' },
      { id: 'hack', label: '只给他们做一版', cost: '一周，很脆', effects: { budget: -6, morale: -4, users: 2, quality: -14 }, outcome: '一直能用，直到他们的身份服务商改了个字段名。' },
      { id: 'drop', label: '让他们走', cost: '丢掉收入', effects: { budget: -16, morale: 6, users: -18, quality: 4 }, outcome: '你丢了五分之一收入，保住了一份服务所有人的路线图。' },
    ],
  },
  {
    id: 'w2-discount', act: 2,
    title: '有客户来要你给过的折扣',
    body: '他们听说上一单打了七折，也想要。上一单是一年预付换的。',
    choices: [
      { id: 'match', label: '直接给，不提条件', cost: '立了一条规则', effects: { budget: -12, morale: -6, users: 6, quality: -2 }, outcome: '现在人人都来问。你公布的价钱不再有任何意义。' },
      { id: 'terms', label: '同样的折扣，同样的条件', cost: '一致', effects: { budget: 6, morale: 4, users: 2, quality: 2 }, outcome: '他们接受一年预付。规则是条件，不是数字。' },
      { id: 'refuse', label: '拒绝，只报原价', cost: '死板', effects: { budget: 0, morale: -4, users: -8, quality: 0 }, outcome: '他们走了，还把原因讲给了另外两个潜在客户。' },
    ],
  },
  {
    id: 'w2-marketing', act: 2,
    title: '市场部定了一个你赶不上的发布日',
    body: '他们按三周后排好了发布。这个功能要五周。',
    choices: [
      { id: 'move', label: '请他们把日期挪一挪', cost: '眼下有点尴尬', effects: { budget: -2, morale: 8, users: 0, quality: 10 }, outcome: '他们改了。改一个发布日期，比搞砸一次发布便宜。' },
      { id: 'crunch', label: '加班硬赶', cost: '士气', effects: { budget: -8, morale: -20, users: 10, quality: -14 }, outcome: '按期上线了，带着两个已知缺陷，和一支不再主动揽活的团队。' },
      { id: 'partial', label: '只发布做完的那一半', cost: '故事小一点', effects: { budget: -4, morale: 4, users: 8, quality: 4 }, outcome: '一次规模更小、但句句为真的发布。市场部失望，客服队列很安静。' },
    ],
  },
  {
    id: 'w2-offer-type', act: 2,
    title: '大客户想要一份定制报表',
    body: '他们愿意为一份只属于他们的报表付不少钱。',
    choices: [
      { id: 'bespoke', label: '专门为他们做', cost: '偏离路线图', effects: { budget: 22, morale: -10, users: 2, quality: -12 }, outcome: '你多拿到一个季度的钱，代价是路线图属于一个客户了。' },
      { id: 'config', label: '做一个可配置的版本', cost: '更难做', effects: { budget: 12, morale: -4, users: 10, quality: 2 }, outcome: '两倍的工作量，但以后每个客户都能用。' },
      { id: 'decline', label: '拒绝，守住路线图', cost: '不赚钱', effects: { budget: -6, morale: 10, users: 4, quality: 8 }, outcome: '你推掉了真金白银。团队把计划好的东西做了出来。' },
    ],
  },
  {
    id: 'w2-lawyer', act: 3,
    title: '服务条款是从模板抄的',
    body: '一个潜在客户的法务来问责任和数据的保留期限。你的条款是从示例里抄的。',
    choices: [
      { id: 'lawyer', label: '花钱请律师写真正能用的条款', cost: '贵', effects: { budget: -18, morale: 2, users: 8, quality: 14 }, outcome: '无聊、必要，而且它打通了这一单和另外三单。' },
      { id: 'edit', label: '自己改一改模板', cost: '便宜，有风险', effects: { budget: -2, morale: 0, users: 4, quality: -10 }, outcome: '读起来通顺，但一句都执行不了。法务注意到了。' },
      { id: 'ignore', label: '原样发过去', cost: '眼下不用做', effects: { budget: 0, morale: -8, users: -6, quality: -16 }, outcome: '对方把它转给了自己的律师，律师用两段话就回了过来。' },
    ],
  },
  {
    id: 'w2-arch', act: 3,
    title: '两个团队想要互相冲突的架构',
    body: '一个要单体，因为上线快。一个要微服务，因为他们老互相卡着。',
    choices: [
      { id: 'pick', label: '选一个，定下来', cost: '清楚，但不讨好', effects: { budget: -6, morale: -6, users: 4, quality: 12 }, outcome: '一半人不同意，但所有人都知道该做什么。' },
      { id: 'both', label: '让每个团队自己选', cost: '避开冲突', effects: { budget: -4, morale: 6, users: 2, quality: -16 }, outcome: '两套系统，中间对不上的数据模型。' },
      { id: 'review', label: '在评审里一起决定', cost: '开头慢一点', effects: { budget: -10, morale: 10, users: 4, quality: 10 }, outcome: '决定站得住，因为是大家一起做的。' },
    ],
  },
  {
    id: 'w2-hire', act: 3,
    title: '你还能再招一个人',
    body: '客服、销售，还是工程。三块都撑得很紧。',
    choices: [
      { id: 'eng', label: '招一个工程师', cost: '做得更快', effects: { budget: -20, morale: 8, users: 4, quality: 12 }, outcome: '积压动起来了，客服队列没有。' },
      { id: 'sales', label: '招一个做销售的', cost: '收入', effects: { budget: 14, morale: -2, users: 8, quality: -4 }, outcome: '签下两单你本来不会去追的生意。交付变得更紧。' },
      { id: 'support', label: '招客服', cost: '保住团队', effects: { budget: -18, morale: 14, users: 6, quality: 4 }, outcome: '工程师不用再答工单。一个月来积压第一次开始动。' },
    ],
  },
  {
    id: 'w2-reseller', act: 1,
    title: '有代理商想做白标',
    body: '一家代理公司愿意用自己的品牌把你的产品卖给他们自己的客户，条件是给一个合作折扣。',
    choices: [
      { id: 'yes', label: '签下来，给七折', cost: '新渠道', effects: { budget: 16, morale: 4, users: 12, quality: -6 }, outcome: '一个月来了三个客户。每个都想要一点不一样的东西。' },
      { id: 'pilot', label: '先跟一个客户试', cost: '慢一些', effects: { budget: 6, morale: 6, users: 6, quality: 4 }, outcome: '一个客户、一套需求，花小代价学明白。这条路走得通，你也知道它的成本。' },
      { id: 'no', label: '拒绝，只做直销', cost: '没有渠道', effects: { budget: -2, morale: -4, users: -4, quality: 4 }, outcome: '你守住了定价权，也丢掉了一个本来还得你自己去支持的渠道。' },
    ],
  },
  {
    id: 'w2-abuse', act: 1,
    title: '免费版被滥用了',
    body: '一个账号跑着你全部后台任务的四成。它在免费套餐上。',
    choices: [
      { id: 'limit', label: '给免费版加一条合理使用上限', cost: '一周', effects: { budget: -6, morale: 4, users: -6, quality: 8 }, outcome: '少数重度用户走了，基础设施安静下来。这条上限写下来了，对所有人一样。' },
      { id: 'special', label: '悄悄只限那一个账号', cost: '一个野路子', effects: { budget: -2, morale: -4, users: 0, quality: -8 }, outcome: '管用，直到另一个人也这么干，而你指不出一条规则来。' },
      { id: 'convert', label: '请他们换成付费套餐', cost: '一次谈话', effects: { budget: 10, morale: 2, users: 0, quality: 2 }, outcome: '他们同意了，因为值得为四成的任务量付钱。其他用户什么都没察觉。' },
    ],
  },
  {
    id: 'w2-refund', act: 2,
    title: '有客户要求退款',
    body: '他们付了一年的钱，用了两次，现在想要回来。你的条款写的是三十天。',
    choices: [
      { id: 'refund', label: '超期也退', cost: '一个先例', effects: { budget: -8, morale: 4, users: 2, quality: 0 }, outcome: '他们满意地走了，还跟人讲了。下周第二个客户来要同样的待遇。' },
      { id: 'terms', label: '按条款办，给账户余额', cost: '硬，但公平', effects: { budget: 0, morale: 0, users: -4, quality: 2 }, outcome: '他们接受了余额，留下了。规则守住了，也没人觉得自己被抢。' },
      { id: 'ignore', label: '不再回复', cost: '不花代价', effects: { budget: 0, morale: -6, users: -8, quality: -6 }, outcome: '他们发起了争议。支付服务商在调查期间冻结了账户一周。' },
    ],
  },
  {
    id: 'w2-spam', act: 2,
    title: '新手邮件进了垃圾箱',
    body: '六成新注册用户从没打开第一封邮件，因为它根本没到收件箱。',
    choices: [
      { id: 'dns', label: '把 SPF、DKIM 和 DMARC 配好', cost: '一天', effects: { budget: -2, morale: 4, users: 14, quality: 8 }, outcome: '无聊、正确，而且你以后发的所有邮件送达率都跟着好了。' },
      { id: 'inapp', label: '把新手引导搬进产品里', cost: '一周', effects: { budget: -8, morale: 6, users: 10, quality: 6 }, outcome: '不再有人依赖收件箱。邮件从唯一的路变成了一次轻推。' },
      { id: 'resend', label: '换个发信地址', cost: '一次瞎猜', effects: { budget: 0, morale: -4, users: -2, quality: -6 }, outcome: '管用了一周，然后又进垃圾箱了，现在你的域名下有两个发信地址。' },
    ],
  },
  {
    id: 'w2-parttime', act: 3,
    title: '有同事想转兼职',
    body: '出于个人原因，他想一周上三天。他是你产能第二高的人。',
    choices: [
      { id: 'yes-adjust', label: '同意，并按这个重排计划', cost: '产能少了', effects: { budget: -6, morale: 18, users: -4, quality: 6 }, outcome: '你每周少了两天人力，留下了一个熟悉代码库的人，而且他在的那几天是全力投入的。' },
      { id: 'no', label: '请他全职做到发布之后', cost: '拖延', effects: { budget: 0, morale: -14, users: 0, quality: -4 }, outcome: '他答应了，但悄悄地不再上心。发布之后他还是走了，按他自己的时间。' },
      { id: 'contract', label: '同意，但改成外包合作', cost: '重新安排', effects: { budget: -4, morale: -4, users: 0, quality: 2 }, outcome: '这套安排在纸面上成立，但他不再来参加规划会了，因为外包不邀请参加。' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Week 3 — Keep it alive
// ---------------------------------------------------------------------------

const W3: SprintStep[] = [
  {
    id: 'w3-scale', act: 1,
    title: '周中数据库就到了 80%',
    body: '流量翻了一倍，下季度还会再翻。你可以加机器，也可以修查询。',
    choices: [
      { id: 'hardware', label: '把机器配得更大', cost: '花钱买时间', effects: { budget: -20, morale: 4, users: 8, quality: -4 }, outcome: '买来两个季度。那些查询还是在做全表扫描，只是机器更大了。' },
      { id: 'queries', label: '做性能剖析，修掉热点查询', cost: '两周', effects: { budget: -10, morale: -4, users: 4, quality: 18 }, outcome: 'CPU 降到 30%，账单也跟着降。' },
      { id: 'cache', label: '给仪表盘加缓存', cost: '只补了个症状', effects: { budget: -6, morale: 0, users: 10, quality: 2 }, outcome: '仪表盘很快，其他一切还是慢。' },
    ],
  },
  {
    id: 'w3-legacy', act: 1,
    title: '最老的模块没有测试',
    body: '没人敢碰计费模块。它已经“禁止改动”八个月了。',
    choices: [
      { id: 'characterise', label: '先写描述现有行为的测试', cost: '慢，但安全', effects: { budget: -14, morale: 2, users: 0, quality: 22 }, outcome: '两周时间把现有行为钉住。下一次改动花一小时，而不是一个周末。' },
      { id: 'rewrite', label: '从零重写', cost: '有风险', effects: { budget: -24, morale: -10, users: -8, quality: -14 }, outcome: '重写覆盖了九成情况。剩下的一成是企业账单。' },
      { id: 'delete', label: '删掉模块，在线上重建', cost: '不可逆', effects: { budget: 0, morale: -20, users: -20, quality: -30 }, outcome: '账单历史根本没有备份。', fatal: { title: '账单没了', body: '你在迁移数据之前就把模块删了。三年的账单再也找不回来。这个月公司没法开票。' } },
    ],
  },
  {
    id: 'w3-resign', act: 1,
    title: '你最强的工程师辞职了',
    body: '他拿到了一个薪水高两成、职级你给不了的 offer。',
    choices: [
      { id: 'counter', label: '用更高的薪水挽留', cost: '贵', effects: { budget: -22, morale: -6, users: 0, quality: 6 }, outcome: '他留了一年，而所有人都学到：辞职才是涨薪的办法。' },
      { id: 'ask', label: '问他真正想留下需要什么', cost: '一次谈话', effects: { budget: -8, morale: 12, users: 0, quality: 8 }, outcome: '从来就不是钱。他想拥有一块自己的东西，于是你把平台的工作交给了他。' },
      { id: 'go', label: '放他走，把交接写清楚', cost: '风险', effects: { budget: -6, morale: -10, users: -6, quality: 4 }, outcome: '你丢掉六周产能，换来一个日后愿意替你说好话的人。' },
    ],
  },
  {
    id: 'w3-outage', act: 1,
    title: '最重要的一次演示，系统挂了',
    body: '在你遇到过最大的潜在客户面前演示了四十分钟，仪表盘突然打不开了。',
    seconds: 15, timeoutChoice: 2,
    choices: [
      { id: 'honest', label: '直说它挂了，放录制好的视频', cost: '诚实', effects: { budget: 0, morale: 6, users: 6, quality: 4 }, outcome: '他们尊重这份坦白，问题也问得更到位。一个月后他们签了。' },
      { id: 'stall', label: '拖着，一直重试到它恢复', cost: '赌一把', effects: { budget: 0, morale: -10, users: -8, quality: -4 }, outcome: '十四分钟的闲聊。它恢复了。他们没有签。' },
      { id: 'blame', label: '怪他们的网络', cost: '看起来省事', effects: { budget: 0, morale: -14, users: -14, quality: -8 }, outcome: '他们的工程师就在通话里，而且知道不是网络的问题。' },
    ],
  },
  {
    id: 'w3-regulator', act: 1,
    title: '监管机构来问个人数据',
    body: '他们要一份书面说明：你们存了什么、存在哪、存多久。',
    choices: [
      { id: 'audit', label: '全部审一遍，再完整回答', cost: '三周', effects: { budget: -16, morale: -4, users: 2, quality: 20 }, outcome: '审计发现两个字段存的时间比你说的更长。在别人再问之前，你改好了。' },
      { id: 'minimal', label: '只答最低要求的部分', cost: '快，但单薄', effects: { budget: -4, morale: 0, users: 0, quality: -10 }, outcome: '技术上合规，实际上没什么用。下一封来函就没那么客气了。' },
      { id: 'consultant', label: '请个顾问来处理', cost: '贵', effects: { budget: -20, morale: 2, users: 0, quality: 6 }, outcome: '一份公司内部没人看得懂的文件。' },
    ],
  },
  {
    id: 'w3-security', act: 2,
    title: '有个依赖出了已知漏洞',
    body: '公告发出两天了。打补丁意味着要在没人想碰的那块做一周回归测试。',
    choices: [
      { id: 'patch', label: '打补丁，认真做回归', cost: '一周', effects: { budget: -16, morale: -6, users: -2, quality: 22 }, outcome: '安静的一周，没有事故。这条公告用一个能证明它的测试正式关掉了。' },
      { id: 'defer', label: '排到下个月', cost: '指望它别出事', effects: { budget: 0, morale: 2, users: 2, quality: -18 }, outcome: '一个月后，这个漏洞还在，而且已经公开了。' },
      { id: 'mitigate', label: '在边缘挡住攻击路径', cost: '部分', effects: { budget: -6, morale: 0, users: 0, quality: 8 }, outcome: '它诚实地买来了一些时间，你在工单里也这么写了。' },
    ],
  },
  {
    id: 'w3-vendor', act: 2,
    title: '一个核心依赖涨价五倍',
    body: '你的产品压在一家供应商上。他们的新定价把你的利润抹掉了。',
    choices: [
      { id: 'migrate', label: '迁到更便宜的供应商', cost: '六周', effects: { budget: -18, morale: -8, users: -4, quality: 12 }, outcome: '很痛，但你现在有了一层抽象，下次再换就便宜了。' },
      { id: 'absorb', label: '吞下成本，提高价格', cost: '转嫁出去', effects: { budget: -8, morale: -4, users: -10, quality: 0 }, outcome: '客户在为你选的供应商买单。' },
      { id: 'negotiate', label: '谈一个量价折扣', cost: '看你有多少筹码', effects: { budget: -6, morale: 2, users: 0, quality: 2 }, outcome: '你拿到七折，可对方是涨了五倍。利润还是薄。' },
    ],
  },
  {
    id: 'w3-arch', act: 2,
    title: '两个团队想要互相冲突的架构',
    body: '一个要单体，因为上线快。一个要微服务，因为他们老互相卡着。',
    choices: [
      { id: 'pick', label: '选一个，定下来', cost: '清楚，但不讨好', effects: { budget: -6, morale: -6, users: 4, quality: 12 }, outcome: '一半人不同意，但所有人都知道该做什么。' },
      { id: 'both', label: '让每个团队自己选', cost: '避开冲突', effects: { budget: -4, morale: 6, users: 2, quality: -16 }, outcome: '两套系统，中间对不上的数据模型。' },
      { id: 'review', label: '在评审里一起决定', cost: '开头慢一点', effects: { budget: -10, morale: 10, users: 4, quality: 10 }, outcome: '决定站得住，因为是大家一起做的。' },
    ],
  },
  {
    id: 'w3-burnout', act: 2,
    title: '你已经四个月没休过一天',
    body: '每个决定都卡在你这里，每个改动的最后一道审查也是你。',
    choices: [
      { id: 'off', label: '休一周，让别人拍板', cost: '信任', effects: { budget: 0, morale: 14, users: 0, quality: 6 }, outcome: '有人做了一个错决定，又撤了回来。你休息回来了，团队发现自己其实能运转。' },
      { id: 'push', label: '硬撑到发布', cost: '熟悉的做法', effects: { budget: 0, morale: -16, users: 4, quality: -12 }, outcome: '你按时发布了，也做了三个休息好时绝不会做的决定。' },
      { id: 'head', label: '招一个工程负责人', cost: '贵', effects: { budget: -24, morale: 8, users: 2, quality: 10 }, outcome: '一个月找到人，两个月建立信任，然后你不再是瓶颈。' },
    ],
  },
  {
    id: 'w3-offer', act: 3,
    title: '有人来谈收购',
    body: '一家更大的公司出价四倍收入。这能让所有人回本，也会让这家公司结束。',
    choices: [
      { id: 'consider', label: '认真考虑', cost: '分心', effects: { budget: 8, morale: -10, users: -4, quality: -6 }, outcome: '三个月的尽调，和一份没人敢改的路线图。最后因为条款谈崩了。' },
      { id: 'decline', label: '拒绝，改去融资', cost: '押注独立', effects: { budget: 26, morale: 10, users: 12, quality: 4 }, outcome: '你按自己的条件融到了钱，也有了一个要超越的数字。' },
      { id: 'wait', label: '要更高的价，一年后再谈', cost: '留着选择', effects: { budget: 4, morale: 2, users: 6, quality: 0 }, outcome: '他们稍微加了点。你有一年时间决定。' },
    ],
  },
  {
    id: 'w3-talent', act: 3,
    title: '团队里有两人正在外面面试',
    body: '你是听别人说的。他们俩谁都没跟你提过。',
    choices: [
      { id: 'ask', label: '直接问他们，什么能让他们留下', cost: '不太好开口', effects: { budget: -8, morale: 14, users: 0, quality: 8 }, outcome: '一个已经走了。另一个等了四个月，就等人来问这一句。' },
      { id: 'raise', label: '先给所有人加薪', cost: '贵', effects: { budget: -24, morale: 10, users: 0, quality: 0 }, outcome: '两个人都留下了，其他人也是。账上的钱少了一个月。' },
      { id: 'nothing', label: '等他们自己来说', cost: '回避', effects: { budget: 0, morale: -16, users: -4, quality: -6 }, outcome: '一个月内两个人都走了，你是在他们最后一天才知道的。' },
    ],
  },
  {
    id: 'w3-final', act: 3,
    title: '融资、卖掉，还是继续做',
    body: '三条路，数字都足以支持任何一条。',
    choices: [
      { id: 'raise', label: '融资，激进扩张', cost: '更大压力', effects: { budget: 34, morale: -8, users: 24, quality: -12 }, outcome: '更大的融资、更大的团队、更大的烧钱速度。增长来得比组织能吸收的速度更快。' },
      { id: 'independent', label: '保持独立，持续盈利', cost: '慢，但稳', effects: { budget: 18, morale: 16, users: 8, quality: 12 }, outcome: '你按自己能撑住的节奏增长。没人给你写专访，但所有人都留下了。' },
      { id: 'sell', label: '卖掉', cost: '终局', effects: { budget: 44, morale: -4, users: 6, quality: 0 }, outcome: '价格不错。产品在别人的路线图下继续。' },
    ],
  },
  {
    id: 'w3-questionnaire', act: 1,
    title: '收到一份安全问卷',
    body: '一个潜在客户发来一百二十个关于你们基础设施的问题。另外两笔生意也在等同一件事。',
    choices: [
      { id: 'do', label: '认真答完，然后复用', cost: '一周', effects: { budget: -12, morale: -4, users: 8, quality: 16 }, outcome: '一周的活变成了一份可复用的文件，还顺带暴露了两件你从没写过文档的事。' },
      { id: 'copy', label: '从网上的模板抄答案', cost: '快，但是错的', effects: { budget: -2, morale: 0, users: 4, quality: -18 }, outcome: '你声称有静态加密，其实没有。这个回答现在是白纸黑字。', fatal: { title: '这个说法被核查了', body: '对方核了其中两个答案。一个不实。生意结束了，而这份问卷现在成了你虚假陈述安全控制的证据。' } },
      { id: 'partial', label: '只答安全那一部分', cost: '部分', effects: { budget: -4, morale: 0, users: 2, quality: 4 }, outcome: '他们暂时接受部分回答，签合同时又来要剩下的。' },
    ],
  },
  {
    id: 'w3-two-incidents', act: 1,
    title: '一周两次事故',
    body: '两次都不长，两次用户都看得见，团队现在很紧张。',
    choices: [
      { id: 'postmortem', label: '各写一份简短的复盘，不追责', cost: '两天', effects: { budget: -8, morale: 10, users: 2, quality: 18 }, outcome: '触发点不同，原因相同：一次跳过了检查的部署。改一处，两个都关掉了。' },
      { id: 'freeze', label: '冻结发布一周', cost: '停止交付', effects: { budget: -6, morale: -12, users: -6, quality: 4 }, outcome: '没有新事故，也没有新功能。解冻的时候，缺的那个检查还是缺着。' },
      { id: 'moveon', label: '两个都修了，然后继续往前', cost: '快', effects: { budget: -2, morale: -4, users: 0, quality: -12 }, outcome: '两个修复、两个症状、一个没变的原因。第三次事故一个月后到。' },
    ],
  },
  {
    id: 'w3-reorg', act: 2,
    title: '董事会想调整组织架构',
    body: '他们想要有名有姓的团队和清晰的责任归属。现在是所有人都得做所有事。',
    choices: [
      { id: 'teams', label: '拆成两个团队，各有一个负责人', cost: '协作成本', effects: { budget: -8, morale: 6, users: 2, quality: 12 }, outcome: '两个清楚的负责人、两份路线图，还有一场专门防止两边走偏的周会。' },
      { id: 'keep', label: '保持扁平，并说明理由', cost: '会有反对', effects: { budget: 0, morale: 4, users: 0, quality: 0 }, outcome: '九个人的时候，扁平还是行得通。你写了下来，还写了到多少人就不行。' },
      { id: 'titles', label: '改成给每个人新头衔', cost: '纸上改动', effects: { budget: -2, morale: -8, users: 0, quality: -6 }, outcome: '头衔变了，责任没变。现在有两个人以为同一件事归自己。' },
    ],
  },
  {
    id: 'w3-exit-access', act: 2,
    title: '离职员工还有访问权限',
    body: '他六周前就走了。账号还开着，还在生产环境的那个组里。',
    choices: [
      { id: 'revoke', label: '立刻收回，然后查所有人', cost: '一个下午', effects: { budget: -4, morale: 2, users: 0, quality: 20 }, outcome: '删掉一个账号，然后拉出一份所有有生产权限的名单，其中大部分人都不该有。' },
      { id: 'revoke-only', label: '只删那一个账号', cost: '一分钟', effects: { budget: 0, morale: 0, users: 0, quality: 4 }, outcome: '眼前这个洞堵上了。下一个离职的人会重演同样的六周。' },
      { id: 'later', label: '放进下个迭代的清单', cost: '眼下不用做', effects: { budget: 0, morale: -6, users: 0, quality: -20 }, outcome: '一个带生产权限的账号又敞开了两周。', fatal: { title: '有人登录了', body: '这个账号从一个谁都不认识的地址被登录过。你无法证明丢了什么，也什么都证明不了，因为审计日志只保留九天。' } },
    ],
  },
  {
    id: 'w3-keynote', act: 3,
    title: '有人请你去讲一场主题演讲',
    body: '一个大会想请你讲怎么用 AI 助手做产品。要准备三天。',
    choices: [
      { id: 'yes', label: '去，认真准备', cost: '三天', effects: { budget: -6, morale: 10, users: 18, quality: 0 }, outcome: '招人变容易了，还有三个主动上门的线索。代价是路线图上少了三天。' },
      { id: 'reuse', label: '用现成的材料讲', cost: '一天', effects: { budget: -2, morale: 4, users: 8, quality: 0 }, outcome: '一场坦白承认是旧内容的演讲。仍然有用，只花了一天。' },
      { id: 'no', label: '推掉，专心交付', cost: '没有曝光', effects: { budget: 0, morale: -4, users: -4, quality: 8 }, outcome: '功能上线了。除了你的用户，没人知道。' },
    ],
  },
];

/**
 * Everything in Sprint Zero that a learner can read. Kept apart from the three pure
 * functions below so the text can be translated as data (see src/i18n/content).
 */
export interface SprintZeroCopy {
  key: string;
  title: string;
  tagline: string;
  summary: string;
  meta: string;
  minutes: number;
  stats: SprintScenario['stats'];
  weeks: SprintScenario['weeks'];
  endings: Record<'collapse' | 'sustainable' | 'pyrrhic', Omit<SprintEnding, 'key'>>;
}

export const SPRINT_ZERO_COPY_ZH: SprintZeroCopy = {
  key: 'sprint-zero',
  title: '三周小队',
  tagline: '带一支三个人的新小队，过完头三周',
  summary:
    '你是这支小队的新负责人。每周八个决定——砍范围、招人、要不要让 AI 智能体接手——这周结束时的数字，就是你下周的起点。',
  meta: '3 周 · 24 个决定',
  minutes: 20,
  stats: [
    { key: 'budget', label: '预算', max: 160, danger: 25 },
    { key: 'morale', label: '士气', max: 100, danger: 30 },
    { key: 'users', label: '用户', max: 100, danger: 1 },
    { key: 'quality', label: '质量', max: 100, danger: 30 },
  ],
  weeks: [
    { id: 'build', title: '第一周：把它做出来', tagline: '六周时间，两个人，没有钱。', bank: W1, draw: [3, 3, 2] },
    { id: 'pay', title: '第二周：让它赚钱', tagline: '用户有了，收入没有。', bank: W2, draw: [3, 3, 2] },
    { id: 'alive', title: '第三周：让它活下去', tagline: '活过你自己的成功。', bank: W3, draw: [3, 3, 2] },
  ],
  endings: {
    collapse: {
      title: '它没能活下来',
      body: '钱烧完了，或者团队散了，或者代码库垮了。没有第四周可以写。',
      insight:
        '不是哪一个决定造成的。是累积：一个你完成不了的范围、一个被你推了两次的质量问题，还有一支不再相信计划的团队。',
      takeaway: '早点护住士气和质量。这两样维持起来很便宜，弄丢了再捡回来很贵。',
    },
    sustainable: {
      title: '你做出来的东西留住了',
      body: '它上线了，能赚钱，有人在用，团队也还站着。',
      insight:
        '决定这个结局的都是些无聊的数字：质量高于六十，士气高于四十五。这两样在周报里都不好看，但它们决定第十二个月还存不存在。',
      takeaway: '能留到最后的那个结局，是你每周至少说过一次“不”的那个。',
    },
    pyrrhic: {
      title: '它活下来了，代价是团队',
      body: '产品有了，用户也有。但士气或质量已经贴地，下个季度只会更糟。',
      insight:
        '交付不是唯一的产物。一个留下没人想碰的代码库、一支安静在外面面试的团队的产品，是为了赶一个日期而借的债。',
      takeaway: '烧掉团队的发布是一笔贷款，不是胜利。',
    },
  },
};
