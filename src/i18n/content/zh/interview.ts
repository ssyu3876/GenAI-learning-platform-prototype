// Interview Coach: a practice interview, not a hiring tool. One question at a time, a
// three-step hint ladder when the learner stalls, then a debrief that quotes what they
// actually said. Scoring is deterministic so the same answer always scores the same.

export type InterviewKind =
  | 'behavioral'
  | 'engineering'
  | 'agent-workflow'
  | 'review'
  | 'product'
  | 'hr'
  | 'career-switch';

export interface InterviewQuestion {
  id: string;
  prompt: string;
  competency: string;
  /** Three hints, from a nudge to a strong scaffold. Never the answer. */
  hints: [string, string, string];
  /** What a strong answer contains. Used in the debrief, never shown mid-interview. */
  listenFor: string[];
}

export interface InterviewType {
  id: InterviewKind;
  name: string;
  blurb: string;
  competencies: string[];
  questions: InterviewQuestion[];
}

export const INTERVIEW_TYPES_ZH: InterviewType[] = [
  {
    id: 'behavioral',
    name: '行为与软技能',
    blurb: '出问题时，你怎样和人一起把事做好。',
    competencies: ['结构化', '证据', '责任感', '沟通'],
    questions: [
      {
        id: 'disagree',
        prompt: '讲一次你和同事在技术决策上意见不一致的经历。',
        competency: '结构化',
        hints: [
          '挑一次真实的意见分歧，不要泛泛而谈。',
          '用一个简单的脉络：当时的情况、你想要什么、对方想要什么、你实际做了什么。',
          '也要讲你改变了自己立场的那部分，而不只是你赢了的地方。',
        ],
        listenFor: ['讲出了具体情境和真实的决策', '对另一方的立场描述公允'],
      },
      {
        id: 'proud',
        prompt: '说一件你交付过、但自己并不满意的事。它为什么会发生？',
        competency: '责任感',
        hints: [
          '说出具体的东西，而不是感受。',
          '把决策和结果分开看：当时你就知道吗？',
          '最后说说事后你做了哪些具体的改变。',
        ],
        listenFor: ['如实叙述，没有过度指责别人', '有具体的流程改进'],
      },
      {
        id: 'feedback',
        prompt: '当同事的工作不够好时，你怎样给他反馈？',
        competency: '沟通',
        hints: [
          '先说说你真正会开口讲的那句话。',
          '把工作和人分开。',
          '说说你怎样确认对方真的接收到了反馈。',
        ],
        listenFor: ['针对的是具体产出', '有验证改进的办法'],
      },
      {
        id: 'failure',
        prompt: '讲一个失败的项目。你在其中起了什么作用？',
        competency: '责任感',
        hints: [
          '选一次真正的失败，而不是只是延期了的成功。',
          '说出你漏掉了什么，或者哪里判断错了。',
          '最后讲讲回到那个决策点，你会怎么做。',
        ],
        listenFor: ['是一次有具体原因的真实失败', '把自己的失误和运气分开'],
      },
      {
        id: 'help',
        prompt: '你怎么判断什么时候该找人帮忙，而不是自己硬扛？',
        competency: '结构化',
        hints: [
          '各想一个最近的例子：一次你选择求助，一次你自己解决。',
          '说出你依据的信号：花了多少时间、风险多大、能不能回退。',
          '不只讲求助省了什么，也讲讲它的代价。',
        ],
        listenFor: ['给出具体标准，而不是“看情况”', '意识到打断别人是有成本的'],
      },
    ],
  },
  {
    id: 'engineering',
    name: '软件工程基础',
    blurb: '需求、设计、测试与权衡。',
    competencies: ['需求', '设计', '测试', '权衡'],
    questions: [
      {
        id: 'fast',
        prompt: '业务方说这个应用要“快”。你怎么把它变成能开发、能测试的东西？',
        competency: '需求',
        hints: [
          '先说说对不同用户来说，“快”可能分别指什么。',
          '试着套这个句式：在什么条件下、哪个可观测的指标、允许的误差是多少。',
          '挑出最关键的那个交互，再定一个分位数。',
        ],
        listenFor: ['把形容词换成一个数字加一个场景', '意识到“快”背后藏着一个决策'],
      },
      {
        id: 'layer',
        prompt: '你怎么判断一段业务逻辑该放在哪一层？',
        competency: '设计',
        hints: [
          '想想除了这个调用方，还有谁需要这条规则。',
          '考虑所有调用方都会经过的最底层。',
          '说说这条规则放在 UI 里会出什么问题。',
        ],
        listenFor: ['给出的是一条原则，而不是个人偏好', '意识到重复的规则会慢慢走样'],
      },
      {
        id: 'tests',
        prompt: '你怎么知道你的测试真的在起作用？',
        competency: '测试',
        hints: [
          '有用的测试是能失败的。什么情况会让你的测试变红？',
          '想想那些几乎对任何输出都能通过的断言。',
          '考虑覆盖率和信心之间的差距。',
        ],
        listenFor: ['测试必须有可能失败', '对拿覆盖率当替代指标保持警惕'],
      },
      {
        id: 'week',
        prompt: '你只有一周时间，三个功能里有两个只做了一半。你怎么决定上线什么？',
        competency: '权衡',
        hints: [
          '把“没有就不能用”和“有了更好”分开。',
          '说出哪些东西被移出这次发布。',
          '说说这个取舍需要谁点头。',
        ],
        listenFor: ['保住必须上线的部分', '明确说出砍掉的范围'],
      },
      {
        id: 'api',
        prompt: '一个改动新增了对外部 API 的调用，你会怎么评审？',
        competency: '设计',
        hints: [
          '先想失败的情况：超时、重试、限流。',
          '考虑“只是变慢、并没有挂掉”的情况。',
          '也说说不用真实服务时怎么测。',
        ],
        listenFor: ['先看失败处理，再看正常路径', '有不依赖线上服务的测试方案'],
      },
    ],
  },
  {
    id: 'agent-workflow',
    name: '和 AI 智能体一起工作',
    blurb: '怎么委派、怎么描述、怎么检查，以及怎么对结果负责。',
    competencies: ['委派', '描述', '判断力', '尽责'],
    questions: [
      {
        id: 'which',
        prompt: '你的工作里，哪些部分会交给 AI 智能体，哪些一定自己留着？',
        competency: '委派',
        hints: [
          '从风险和能不能回退来判断，而不是看任务大小。',
          '说出一件你绝不会委派出去的事，以及为什么。',
          '想想中间那种做法：智能体出草稿，你来定。',
        ],
        listenFor: ['给出的是一条规则，不是一种感觉', '至少有一件事坚持由人来做'],
      },
      {
        id: 'describe',
        prompt: '把你要交给智能体的登录函数描述，直接说出来。',
        competency: '描述',
        hints: [
          '覆盖语言、函数签名、数据结构和出错时的行为。',
          '再补上“绝对不能发生什么”，这一点常被人跳过。',
          '想想你不写的话，智能体会自己假设什么。',
        ],
        listenFor: ['至少覆盖五个要素里的四个', '意识到你没说的部分会变成默认假设'],
      },
      {
        id: 'check',
        prompt: 'AI 写的代码，你怎么检查？',
        competency: '判断力',
        hints: [
          '先看那些不会出声报错的地方：边界、异常、权限。',
          '也讲讲对着需求读 diff，而不只是跑一遍。',
          '说说当总结听起来很笃定时，你会怎么做。',
        ],
        listenFor: ['有一套可以重复的检查顺序', '对自信满满的总结保持怀疑'],
      },
      {
        id: 'record',
        prompt: '你怎么记录 AI 在一个项目里做了什么？',
        competency: '尽责',
        hints: [
          '想想如果有人问“这段是谁写的”，你需要能拿出什么。',
          '考虑提示词、diff，以及保留还是弃用的决定。',
          '说说在团队里和独自一人时有什么不同。',
        ],
        listenFor: ['留下具体记录，而不是“我记得”', '是为了负责，不只是记账'],
      },
      {
        id: 'citation',
        prompt: '智能体说它是照着文档做的。你接下来做什么？',
        competency: '判断力',
        hints: [
          '说出了出处，只是一个说法，不是事实。',
          '打开那一节，和代码对一遍。',
          '想想模型最容易把哪些错误说得很有说服力。',
        ],
        listenFor: ['去核对出处，而不是看总结', '具体不等于准确'],
      },
    ],
  },
  {
    id: 'review',
    name: '代码评审与需求',
    blurb: '看懂别人的工作，问出对的问题。',
    competencies: ['审读', '严重程度', '提问质量', '语气'],
    questions: [
      {
        id: 'password',
        prompt: '你在评审一个第一次要存密码的改动。你会重点看什么？',
        competency: '审读',
        hints: [
          '从攻击者想要什么出发，而不是从代码风格出发。',
          '看看这个值是怎么存、怎么比的。',
          '别忘了日志：密码有没有被写进不该写的地方？',
        ],
        listenFor: ['把安全当作首要问题', '能说出具体的机制'],
      },
      {
        id: 'severity',
        prompt: '你怎么判断一条评审意见是必须改，还是可改可不改？',
        competency: '严重程度',
        hints: [
          '按会坏掉什么来定严重程度，而不是按它让你多不舒服。',
          '把缺陷和个人偏好分开。',
          '想想格式这类事该由谁把关。',
        ],
        listenFor: ['有明确说出来的定级规则', '肯放过纯风格的问题'],
      },
      {
        id: 'cancel',
        prompt: '需求里写着“用户可以取消订单”。写代码之前你会问什么？',
        competency: '提问质量',
        hints: [
          '问取消之后订单处于什么状态，而不只是问这个动作。',
          '考虑可恢复性：能不能撤回，多久之内可以？',
          '问还有谁受影响：支付、库存、通知。',
        ],
        listenFor: ['关注后置状态和恢复方式', '看出这句话说得不够清楚'],
      },
      {
        id: 'volume',
        prompt: '一个 pull request 里有一个真问题，还有二十个小毛病。你怎么回应？',
        competency: '语气',
        hints: [
          '先把那个重要的说清楚，并说明原因。',
          '想想一个人一次能处理多少条意见。',
          '想想你希望对方接下来做什么。',
        ],
        listenFor: ['只给一个明确的阻塞点，而不是一堵墙', '说的是代码，不是人'],
      },
      {
        id: 'refactor',
        prompt: '一个声称“行为不变”的重构，你会怎么评审？',
        competency: '审读',
        hints: [
          '“这是重构”本身就是一句需要验证的话。',
          '找那些不出声的变化：顺序、默认值、取整。',
          '也说说测试：它们能把行为固定住吗？',
        ],
        listenFor: ['把这句话当作还没被证实', '有具体办法证明前后等价'],
      },
    ],
  },
  {
    id: 'product',
    name: '产品思维',
    blurb: '做什么、砍什么，以及你怎么知道做对了。',
    competencies: ['问题界定', '优先级', '衡量', '沟通'],
    questions: [
      {
        id: 'export',
        prompt: '用户要一个导出按钮。动手做之前你会做什么？',
        competency: '问题界定',
        hints: [
          '问他想完成什么事，而不是问他要什么功能。',
          '找找这个需求背后有哪些手工活。',
          '想想有没有比直接做出来更省事的验证办法。',
        ],
        listenFor: ['把要求和需求分开', '先做更省事的验证，再动手开发'],
      },
      {
        id: 'five',
        prompt: '有五个需求，你只能做两个。你怎么选？',
        competency: '优先级',
        hints: [
          '先看哪些是产品能用起来的前提。',
          '说出你的标准：影响多少人、多严重、能不能回退。',
          '把你砍掉的部分，明确说出来。',
        ],
        listenFor: ['有明确的标准', '说出被砍掉的工作'],
      },
      {
        id: 'success',
        prompt: '你怎么知道一个功能算是做成功了？',
        competency: '衡量',
        hints: [
          '上线前就用可观察的方式定义成功。',
          '把“被使用”和“有结果”分开。',
          '再想一个反向指标：什么现象说明它在帮倒忙？',
        ],
        listenFor: ['用事前就定好的衡量方式', '意识到一个功能看着不错也可能是有害的'],
      },
      {
        id: 'three-percent',
        prompt: '你上线的功能只有百分之三的用户在用。你会得出什么结论？',
        competency: '衡量',
        hints: [
          '把“没人需要”和“没人发现”分开。',
          '看看这百分之三都是些什么人。',
          '想想这个指标测的是不是你想测的东西。',
        ],
        listenFor: ['分得清是没人发现还是没价值', '给出的是判断规则，不是一种感觉'],
      },
      {
        id: 'delay',
        prompt: '一次技术延期，对方根本不关心原因，你怎么解释？',
        competency: '沟通',
        hints: [
          '先讲这对他们意味着什么。',
          '给一个日期，再给一个选择。',
          '给建议，而不是念进度报告。',
        ],
        listenFor: ['先讲影响', '给建议，而不是按时间讲经过'],
      },
    ],
  },
  {
    id: 'hr',
    name: '动机与匹配',
    blurb: '为什么做这行、你怎么工作、接下来想要什么。',
    competencies: ['自我认知', '动机', '结构化', '沟通'],
    questions: [
      {
        id: 'why',
        prompt: '为什么想做这类岗位，又为什么是现在？',
        competency: '动机',
        hints: [
          '把一段具体的过往经历和一个具体的兴趣连起来。',
          '别讲空泛的热情，说清楚你真正喜欢做什么。',
          '也说说你有意在远离什么。',
        ],
        listenFor: ['理由有经历作依据', '对自己在做什么取舍有所意识'],
      },
      {
        id: 'environment',
        prompt: '在什么样的环境里，你的状态最好？',
        competency: '自我认知',
        hints: [
          '描述具体条件，而不是形容词。',
          '举一个奏效的地方，再举一个不奏效的。',
          '诚实说出你需要什么，哪怕听起来不体面。',
        ],
        listenFor: ['有条件、有依据', '坦诚，但不提过分的要求'],
      },
      {
        id: 'learned',
        prompt: '讲讲你最近主动学的一样东西，没人要求你去学的那种。',
        competency: '动机',
        hints: [
          '挑一件你能聊上两分钟的事。',
          '说说是什么触发了它，你又拿它做了什么。',
          '也说说它有没有改变你的工作方式。',
        ],
        listenFor: ['真实的好奇心，而且真的做下去了', '有结果，而不只是看了学了'],
      },
      {
        id: 'weakness',
        prompt: '你正在努力改进的一个缺点是什么？',
        competency: '自我认知',
        hints: [
          '挑一个真实的，别把优点换个说法。',
          '说具体行为，而不是性格标签。',
          '说说你在怎么做，又怎么衡量进展。',
        ],
        listenFor: ['是真实的缺点，也有应对办法', '有已经尝试过的证据'],
      },
      {
        id: 'three-years',
        prompt: '三年后你想处在什么位置？从现在到那里，下一步是什么？',
        competency: '动机',
        hints: [
          '说的是某种能力，而不是职位名称。',
          '描述具体的下一步，而不是终点。',
          '诚实地把它和这个岗位能提供的东西对上。',
        ],
        listenFor: ['有方向，也有下一步', '对这个岗位能给什么有现实判断'],
      },
    ],
  },
  {
    id: 'career-switch',
    name: '转行进入软件行业',
    blurb: '给从其他领域转过来的人。',
    competencies: ['可迁移的证据', '学习', '技术基础', '沟通'],
    questions: [
      {
        id: 'no-degree',
        prompt: '你没有计算机专业的学位。你凭什么觉得自己能做这份工作？',
        competency: '可迁移的证据',
        hints: [
          '说一件你已经做出来或交付过的具体东西。',
          '把上一个领域里的一项技能和工程工作连起来。',
          '诚实承认差距，不要硬说没有差距。',
        ],
        listenFor: ['有交付过东西的证据', '坦然承认差距，而不是急着辩解'],
      },
      {
        id: 'learn',
        prompt: '你怎么学一个新的技术主题？拿最近的例子讲一遍。',
        competency: '学习',
        hints: [
          '挑一个主题，讲你按什么顺序学的。',
          '说说你怎么确认自己真的懂了。',
          '也讲一个没走通的办法。',
        ],
        listenFor: ['有一套可以重复的方法', '有验证，而不只是看和听'],
      },
      {
        id: 'index',
        prompt: '假设我完全不懂技术，解释一下数据库索引是做什么的。',
        competency: '技术基础',
        hints: [
          '用一个实物来打比方。',
          '然后说说索引的代价，不要只讲好处。',
          '再想想你的解释能不能经得住追问。',
        ],
        listenFor: ['比方打得对，而不是堆术语', '对代价这一面有认识'],
      },
      {
        id: 'chance',
        prompt: '为什么要冒险录用一个没有传统背景的人？',
        competency: '沟通',
        hints: [
          '用证据说话，而不是靠热情。',
          '承认你要做成，需要哪些条件成立。',
          '说说第一个月你会做什么来降低这个风险。',
        ],
        listenFor: ['论证时考虑到了风险', '有具体的第一个月计划'],
      },
      {
        id: 'ai-first-role',
        prompt: '在你的第一份工程岗位上，你会怎么用 AI 工具？',
        competency: '学习',
        hints: [
          '说说你会用它们做什么，不会用来做什么。',
          '说说你会怎么检查它给出的结果。',
          '想想怎么保证自己还在学，而不是把理解外包出去。',
        ],
        listenFor: ['有一条想清楚的边界', '意识到把“理解”外包出去是个坑'],
      },
    ],
  },
];

export function interviewType(id: string): InterviewType | undefined {
  return INTERVIEW_TYPES_ZH.find((t) => t.id === id);
}
