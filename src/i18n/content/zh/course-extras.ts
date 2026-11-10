// Smaller courses that make the studio, admin review queue and "made by you" sections
// look realistic in the demo.
import type { CourseDraft } from '@/core/content/draft';

export const photographyCourseZh: CourseDraft = {
  title: '三节课入门摄影',
  summary: '用手机照片讲清楚光线、构图和曝光三角。由一位学习者用 "Learn anything" 生成。',
  subject: '摄影',
  level: 'beginner',
  audience: 'everyone',
  tags: ['摄影', '爱好'],
  emoji: '📷',
  color: 'butter',
  lessons: [
    {
      title: '光线就是一切',
      estimatedMinutes: 8,
      content: `同一个场景，正午拍出来可能平平的，日落前一小时却像有魔法。摄影师把那一小时叫作**黄金时刻**：低低的、暖暖的、柔柔的光，轻轻裹住人的脸。\n\n- 硬光（正午的太阳）会留下很重的影子\n- 柔光（阴天的天空、窗边的光）对脸更友好\n- 把光放在拍摄对象的*侧面*，才看得出形状`,
      activities: [
        {
          type: 'quiz',
          title: '光线小测',
          xpReward: 15,
          config: {
            questions: [
              {
                prompt: '拍人像时，哪种光通常最讨喜？',
                options: ['从侧面照进来的柔和窗光', '正午直射的太阳', '闪光灯正对着脸打'],
                answerIndex: 0,
                explanation: '柔和的侧光能显出轮廓，又不会留下生硬的影子。',
              },
            ],
          },
        },
      ],
    },
    {
      title: '用三分法构图',
      estimatedMinutes: 8,
      content: `想象在照片上铺一张 3×3 的网格。把主体放在其中一条线上（而不是正中间），画面通常会更自然。大多数手机相机都能在设置里打开这个网格。`,
      activities: [
        {
          type: 'sort',
          title: '放中间还是放三分线上？',
          xpReward: 15,
          config: {
            instructions: '你通常会把主体放在哪里？',
            buckets: ['放在三分线上', '居中更好看'],
            items: [
              { text: '一个人在海边散步', bucket: '放在三分线上' },
              { text: '一栋完全对称的建筑', bucket: '居中更好看' },
              { text: '海面上的日落', bucket: '放在三分线上' },
              { text: '护照式的证件照', bucket: '居中更好看' },
            ],
          },
        },
      ],
    },
  ],
};

export const databasesDraftZh: CourseDraft = {
  title: '用大白话讲数据库',
  summary: '表、行，以及为什么每个应用都需要一个记事的地方。Dr. Chan 的草稿。',
  subject: '软件工程',
  level: 'beginner',
  audience: 'non_cs',
  tags: ['基础', '数据'],
  emoji: '🗄️',
  color: 'sky',
  lessons: [
    {
      title: '数据库就是一张特别有条理的表',
      estimatedMinutes: 10,
      content: `如果你用过 Excel，其实已经懂了大半数据库：**表**（就是工作表）、**行**（一条记录，比如一笔订单）和**列**（关于它的一项信息，比如价格）。\n\n区别在于：数据库是为很多人同时读写而造的，而且不会乱。`,
      activities: [],
    },
    {
      title: '键：表与表怎么互相指路',
      estimatedMinutes: 10,
      content: `每一行都有一个 **id**。另一张表可以存下这个 id，用来说“这笔订单属于*那位*学生”。这种关联就叫**外键**。`,
      activities: [],
    },
  ],
};

export const gitCourseZh: CourseDraft = {
  title: '学 Git 不流泪',
  summary: '写给怕命令行的人：commit、分支和 pull request。',
  subject: '软件工程',
  level: 'beginner',
  audience: 'everyone',
  tags: ['git', '团队协作', '基础'],
  emoji: '🌿',
  color: 'mint',
  lessons: [
    {
      title: 'commit 就是存档点',
      estimatedMinutes: 8,
      content: `一次 **commit** 就是你整个项目的存档点，还带一条说明，讲清楚改了什么。好的说明又短又具体：\`fix(cart): keep items after refresh\`。`,
      activities: [
        {
          type: 'sequence',
          title: 'pull request 的流程',
          xpReward: 20,
          config: {
            instructions: '把用 pull request 提交一次改动的步骤排好顺序。',
            steps: ['新建一个分支', '完成改动并 commit', '把分支 push 上去', '发起 pull request', '队友来 review', '合并进 main'],
          },
        },
      ],
    },
  ],
};
