# 数据模型

> English version: [DATA_MODEL.md](DATA_MODEL.md)。唯一真相来源：`src/core/db/schema.ts`（核心）和 `src/modules/*/schema.ts`（模块表）。下面的字段名是 TypeScript 名称；SQL 列名是 snake_case 版本。

## 1. 约定

- 主键：`newId()` 生成的带前缀文本 id：`usr_`、`crs_`、`lsn_`、`act_`、`att_`、`evt_`、`cls_`、`aiu_`。
- 每张表都有 `createdAt`；可变表还有 `updatedAt`（每次更新都要设置）。
- 枚举存成 `text` + TypeScript 联合类型（比 Postgres enum 更容易扩展）。
- 灵活的、类型特定的数据放在 `jsonb` 里，用 zod 在边界验证（`activities.config`、`activity_attempts.detail`、`learning_events.payload`）。
- 删除父行会级联删除子行（course → lessons → activities → attempts）。

## 2. 核心表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `users` | 账号 | `id`、`email`（unique, lowercase）、`name`、`role`（`learner`/`instructor`/`admin`）、`avatarSeed`、`lastActiveAt` |
| `learner_profiles` | 入门测评答案 + 个性化路径 | `userId`（PK）、`background`（`non_cs`/`cs_student`/`cs_graduate`/`other`）、`goal`（`understand`/`career`/`build`/`ai_skills`）、`codingLevel` 0-3、`interests[]`、`track`（`explorer`/`builder`）、`recommendedCourseIds[]`、`welcomeNote` |
| `courses` | 一门迷你课程 | `slug`（unique）、`title`、`summary`、`subject`（任意领域）、`level`、`audience`（`everyone`/`non_cs`/`cs`）、`tags[]`、`color`、`emoji`、`status`（`draft`/`pending_review`/`published`/`archived`）、`visibility`（`public`/`class`/`private`）、`source`（`seed`/`manual`/`ai`/`learner_ai`）、`ownerId`、`forkedFromId` |
| `lessons` | 课程的有序页面 | `courseId`、`position`（0-based）、`title`、`content`（Markdown）、`estimatedMinutes` |
| `activities` | 课时里的交互任务 | `lessonId`、`position`、`type`（见 §4）、`title`、`config`（jsonb）、`xpReward` |
| `enrollments` | 学生 ↔ 课程 | PK（`userId`、`courseId`）、`enrolledAt`、`completedAt` |
| `activity_attempts` | 每个学生每个活动的最佳结果 | unique（`userId`、`activityId`）、`courseId`、`bestScore` 0-100、`attemptCount`、`xpEarned`、`detail` |
| `lesson_completions` | 已完成的课时 | PK（`userId`、`lessonId`）、`courseId` |
| `learning_events` | **仅追加日志**，XP 和分析的数据源 | `userId`、`type`、`courseId?`、`lessonId?`、`activityId?`、`xp`、`payload`、`createdAt` |
| `classes` | 教师的班级 | `name`、`instructorId`、`inviteCode`（6 字符，unique） |
| `class_members` | 学生 ↔ 班级 | PK（`classId`、`userId`） |
| `class_courses` | 分配给班级的课程 | PK（`classId`、`courseId`） |
| `ai_usage` | 每次 AI 调用一行 | `userId?`、`feature`、`model`、`mocked`、`promptTokens`、`completionTokens`、`latencyMs` |

谁能看到一门课程（`src/core/content/queries.ts`）：published + public → 所有人；分配给你的班级 → 班级成员；`ownerId` = 你 → 你；admin → 全部。

## 3. 学习事件

XP **永远不存在 user 表上**。总 XP = `sum(learning_events.xp)`。周 XP = 过去 7 天的 sum。这样排行榜、连续天数和仪表盘保持一致。

| `type` | 由谁写入 | `xp` | `payload` |
|---|---|---|---|
| `activity.completed` | `completeActivity()` | 只有相比上次最佳的提升部分 | `{ score, attempt }` |
| `lesson.completed` | `completeLesson()` | 10 | — |
| `course.completed` | `completeLesson()`（最后一节课） | 50 | — |
| `course.enrolled` | `enrollInCourse()` | 0 | — |
| `course.generated` | 自学生成 | 0 | `{ courseId }` |
| `onboarding.completed` | 入门测评 | 0 | `{ track }` |
| `tutor.asked` | AI 助教 | 0 | `{ lessonId? }` |
| `class.joined` | 班级 | 0 | `{ classId }` |
| `review.answered` | review | 到期卡片答对得 2，否则 0 | `{ itemId, questionIndex, correct, box }` |

XP 规则（`src/core/progress/xp.ts`）：分数 ≥ 60 获得活动的 `xpReward`，100 分获得 120%，低于 60 按比例获得。等级：Seed 0、Sprout 100、Seedling 250、Sapling 500、Young Tree 900、Tree 1400、Grove 2100、Forest 3000。连续天数按 UTC 天计算，只要有任何事件就算。

添加新事件类型时，在 `src/core/events.ts` 的 `EVENT_TYPES` 和这个表里同时加。

## 4. 活动类型（`activities.type` + `activities.config`）

每种类型是一个 `ActivityDefinition`（`src/core/activity-types.ts`），带一个 zod `schema` 验证 `config`。内置类型（`src/modules/activities/`）：

| `type` | 学生做什么 | Config（简要） |
|---|---|---|
| `quiz` | 多选题 + 解释 | `{ questions: [{ prompt, options[], answerIndex, explanation }] }` |
| `sort` | 把卡片放进正确的桶 | `{ instructions, buckets[], items: [{ text, bucket }] }` |
| `sequence` | 把步骤按正确顺序排列 | `{ instructions, steps[] }`（存成正确顺序，展示时乱序） |
| `coding` | 写一个 JS 函数，在浏览器里跑测试 | `{ instructions, starterCode, functionName, tests: [{ args[], expected, label? }] }` |
| `slides` | AI 朗读的幻灯片（text-to-speech） | `{ slides: [{ heading, bullets[], narration }] }` |
| `roleplay` | 和 AI 角色对话，之后打分 | `{ scenario, persona, personaRole, goals[], opening, rubric[], maxTurns }` |

## 5. 模块拥有的表

| 表 | 模块 | 用途 |
|---|---|---|
| `leaderboard_prefs` | leaderboard | 每个用户的显示选择：真名或昵称、退出排行榜 |
| `leaderboard_class_settings` | leaderboard | 教师开关：是否显示班级排行榜 |
| `lesson_adaptations` | courses | 缓存的"换个方式讲"改写，按 lesson × 学生 track |
| `review_items` | review | 每个学生答错的测验题，含 Leitner 盒子和下次复习时间（来自 `activity_attempts.detail.answers`） |
| `class_insight_summaries` | classes | 每个班级最新一次 AI 常见误区总结，及其依据的作答数 |

添加新表时，在同一个 PR 里给这里加一行。
