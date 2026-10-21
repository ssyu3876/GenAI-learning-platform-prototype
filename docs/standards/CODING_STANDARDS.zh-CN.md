# 编码规范

> 适用于每个原型和最终应用。English version: [CODING_STANDARDS.md](CODING_STANDARDS.md)。如果你的 AI agent 写的代码违反了这里的规则，让它改代码，而不是改规则。

## 1. 为什么有这些规则

三个人、三个原型、不同的 AI agent。10.19 评审后我们选**一个**原型作为基础，把另外两个里的最佳特性迁移进来。只有当每个特性都是一个**自包含的模块**，通过小而稳定的契约插入应用时，这件事才可行。下面的规则主要是为了保持这个契约不变。

## 2. 架构

```
src/
├── app/                  路由文件（很薄）。Next.js App Router。
│   ├── (auth)/           login, signup
│   ├── (app)/            登录后的页面，被应用外壳包住
│   └── api/              route handlers（流式 AI 端点）
├── core/                 共享基础。不知道模块的存在。
│   ├── db/               schema.ts（核心表）+ client.ts（getDb）
│   ├── auth/             session（requireUser）、密码、登录 / 注册 action
│   ├── ai/               唯一的 LLM 客户端（generateText / generateJson / streamText）
│   ├── progress/         XP、等级、连续天数、completeActivity、选课
│   ├── content/          课程查询 + AI 课程草稿生成
│   ├── events.ts         recordEvent() 写入 learning_events 日志
│   ├── activity-types.ts 交互活动类型的契约
│   ├── ids.ts            newId('course') → "crs_k3j9x2m1q8wz"
│   └── types.ts          ModuleManifest, NavItem, HomeWidget, ActionResult, SessionUser
├── components/ui/        共享 UI 组件（Button、Card、Pip、Avatar…）。无业务逻辑。
├── registry/             连接模块的两个清单：modules.ts、activities.ts
├── shell/                应用框架（侧边栏、顶栏）。读取 registry。
└── modules/<name>/       每个功能模块一个文件夹（见 §3）
scripts/                  migrate、seed、reset
drizzle/                  生成的 SQL 迁移（不要手动编辑）
docs/standards/           这些文档
```

### 依赖方向（由 ESLint 强制）

```
app  ──►  shell  ──►  registry  ──►  modules  ──►  core + components/ui
```

- `core/` 和 `components/ui/` 永远不从 `modules/`、`registry/` 或 `app/` 导入。
- 一个模块永远不导入另一个模块。可以导入 `core`、`components/ui` 和 `@/registry/activities`（渲染活动播放器）。
- `app/` 路由文件从模块、core 和 registry 导入。

## 3. 模块：插件契约

### 3.1 文件夹布局

```
src/modules/leaderboard/
├── manifest.ts        必须。nav items、home widgets、shell add-ons（见 ModuleManifest）
├── schema.ts          可选。这个模块拥有的表（被 drizzle.config.ts 扫到）
├── queries.ts         读取函数（仅服务器）
├── actions.ts         'use server' 变更
├── components/        React 组件（kebab-case 文件）
├── pages/             src/app 路由渲染的完整页面组件（可选）
└── *.test.ts          单元测试，紧挨着被测试的代码
```

### 3.2 模块如何插入

| 需要 | 怎么做 | 在模块外你要碰的文件 |
|---|---|---|
| 侧边栏链接 | manifest 里的 `navItems` | `src/registry/modules.ts`（一行，一次） |
| 首页卡片 | manifest 里的 `homeWidgets` | 同一行 |
| 每个页面都显示的东西（如悬浮助教） | manifest 里的 `shellAddons` | 同一行 |
| 新的交互活动类型 | 导出一个 `ActivityDefinition` | `src/registry/activities.ts`（一行） |
| 页面 | 创建 `src/app/(app)/<route>/page.tsx`，渲染你的组件 | 路由文件 |
| 响应学习活动 | 读取 `learning_events`（仅追加日志） | 无 |
| 报告学习活动 | 从 `@/core/events` 调用 `recordEvent()` | 无 |
| 你自己的数据 | `src/modules/<name>/schema.ts` + `npm run db:generate` | 无 |

### 3.3 把模块迁移到另一个原型

1. 拷贝 `src/modules/<name>/` 和 `src/app/` 下的路由文件。
2. 把 manifest 加到 `src/registry/modules.ts`（活动类型加到 `src/registry/activities.ts`）。
3. 如果模块有 `schema.ts`，跑 `npm run db:generate && npm run db:migrate`。
4. `npm run check`。如果失败，说明模块伸手到契约外面了：改模块。

### 3.4 规则

- 和其他特性**通过数据对话，不是通过 import**：核心表、`learning_events`、registry。例子：leaderboard 从不调用 courses 模块；它汇总 `learning_events` 里的 `xp`，而 `completeActivity()` 会写那个表。
- 永远不要为某个模块给核心表加列。创建一个模块表，主键指向核心 id。
- 路由文件 ≤ 20 行：`requireUser()`、读取 `params`、渲染一个模块组件。
- 服务器专用文件（DB、AI）不能被 `'use client'` 文件 import。通过 props 传数据或调用 server action。

## 4. 命名

| 东西 | 约定 | 例子 |
|---|---|---|
| 文件和文件夹 | kebab-case | `course-card.tsx`、`self-learn/` |
| React 组件 | PascalCase，named export | `export function CourseCard()` |
| Hooks | camelCase with `use` | `useCountdown` |
| 函数、变量 | camelCase，函数以动词开头 | `getCourseOutline`、`isPublished` |
| 常量 | UPPER_SNAKE_CASE | `LESSON_COMPLETE_XP` |
| 类型 / 接口 | PascalCase，无 `I` 前缀 | `CourseOutline`、`ActivityPlayerProps` |
| Zod schema | camelCase + `Schema` | `quizConfigSchema` |
| Server actions | 动词 + 名词 | `enrollInCourse`、`publishCourse` |
| 数据库表 | snake_case，复数 | `learning_events`、`class_members` |
| 数据库列 | SQL 里 snake_case，TS 里 camelCase（drizzle 自动映射） | `created_at` / `createdAt` |
| ID | `newId()` 生成的带前缀字符串 | `crs_…`、`usr_…`、`act_…` |
| 事件类型 | `domain.past_tense` | `activity.completed`、`class.joined` |
| AI feature 名 | `module.action` | `tutor.chat`、`studio.generate_course` |
| 路由（URL） | kebab-case，复数名词 | `/courses/[slug]/lessons/[lessonId]` |
| 模块 id | kebab-case = 文件夹名 | `ai-tutor` |
| 环境变量 | UPPER_SNAKE_CASE | `AI_MODEL_FAST` |
| 分支 | `feat/<module>-<short-desc>`、`fix/…`、`docs/…` | `feat/leaderboard-weekly-tab` |

布尔值读起来像问句：`isDraft`、`hasProfile`、`canEdit`。

## 5. TypeScript & React

- `strict` 和 `noUncheckedIndexedAccess` 开着。不要用 `any`、`as any` 或 `// @ts-ignore` 消除错误。边界处用 `unknown` + zod。
- 用 zod 验证**每一个**外部输入（表单数据、JSON body、AI 输出）。
- 优先用 **Server Components**。只在需要 state、effects 或浏览器 API 时才加 `'use client'`，并保持 client component 小（叶子组件）。
- 数据获取在 server component 或 `queries.ts` 里，不在 `useEffect` 里。
- 变更是 `actions.ts` 里的 **server actions**。只在流式响应时才用 route handler（`src/app/api/`）。
- 所有地方用 named export，除了 Next.js 要求 default export 的文件（`page.tsx`、`layout.tsx`、`route.ts`）。
- Import：当前文件夹外的东西用 `@/` 别名。顺序：外部包、`@/core`、`@/components`、`@/registry`、相对路径。
- 注释解释**为什么**，不是做什么。每个模块文件开头有 1–3 行注释说明它的用途（如果名字不够明显的话）。

### Server action 模式

```ts
'use server';

const schema = z.object({ courseId: z.string(), title: z.string().trim().min(1).max(100) });

export async function renameCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['instructor', 'admin']);            // 1. 认证
  const parsed = schema.safeParse(Object.fromEntries(formData));       // 2. 验证
  if (!parsed.success) return { ok: false, error: 'Give the course a title.' };
  const course = await getCourseById(parsed.data.courseId);            // 3. 授权
  if (!course || !(await canEditCourse(user, course))) return { ok: false, error: 'Not allowed.' };
  const db = await getDb();                                            // 4. 写入
  await db.update(courses).set({ title: parsed.data.title, updatedAt: new Date() }).where(eq(courses.id, course.id));
  revalidatePath(`/studio/${course.id}`);                              // 5. 刷新
  return { ok: true, message: 'Saved.' };
}
```

客户端：`const [state, action] = useActionState(renameCourse, null)`，用 `<Notice tone="error">` 显示 `state.error`。

## 6. 代码里的 AI 使用

- 只从 `@/core/ai/client` 导入。选一个层级：`fast`（批量、便宜）或 `smart`（角色扮演、整门课程生成）。
- 总是传 `feature: '<module>.<action>'`、`userId` 和一个 `mock` 函数，离线时返回合理内容。应用在没有 API key 时必须完全可点击。
- 结构化输出：`generateJson(messages, zodSchema, ...)`。在 system prompt 里描述 JSON 形状；schema 强制执行它。
- Prompt 和特性放在同一个模块里，作为导出的常量或构造函数。
- 生成的内容存进数据库。不要每次查看都重新生成同样的东西。

## 7. 错误和加载

- 预期的失败（验证、权限）→ 返回 `{ ok: false, error }`，内联显示。
- 意外的失败 → throw；Next.js 显示最近的 `error.tsx`。
- 每个 action 按钮显示 pending 状态（`<SubmitButton pendingText="Saving…">`）。
- 每个列表有空状态（`<EmptyState>`）。

## 8. 测试

- 用 Vitest 给纯逻辑写单元测试（打分、XP、解析、排序）：`*.test.ts` 紧挨着源文件。
- 提 PR 前：`npm run check`（typecheck + lint + tests）必须通过。
- 用演示账号手动点一遍你的特性，分别作为 learner、instructor 和 admin。

## 9. Git

- 从 `main` 开分支：`feat/<module>-<desc>`。每个 PR 一个特性，PR 要小。
- Commit message（Conventional Commits）：`feat(leaderboard): add weekly tab`、`fix(studio): keep lesson order after delete`、`docs: update data model`。
- 用**你自己的 GitHub 账号** commit。你的 commit 就是你的贡献记录。
- PR 描述：改了什么、怎么测的、哪部分是 AI 写的、你改了什么。
- 永远不要 commit `.env.local`、`.data/` 或 API key。

### 分支里的数据库迁移

Drizzle 只执行**比数据库里最新一条迁移记录更新**的迁移，更旧的会被直接跳过，不报任何错。所以两个人在各自分支里生成迁移，可能出现编号冲突（两个 `0003_…` 文件），或者某个迁移在生产环境里永远不会执行。

如果你的分支新增或修改了 `schema.ts`：

1. 提 PR 前，先把最新的 `main` 合并进你的分支。
2. 删掉**你自己**在 `drizzle/` 里生成的迁移文件（`.sql` 文件和对应的 `drizzle/meta/*_snapshot.json`），并从 `drizzle/meta/_journal.json` 里删掉你的那几条记录。不要动来自 `main` 的迁移。
3. 重新执行 `npm run db:generate`。这样你的迁移会拿到下一个编号和最新的时间戳。
4. 在本地执行 `npm run db:reset` 和 `npm run check`，通过后再 push。
5. 如果 PR 合并前 `main` 又更新了，并且新提交里也有迁移，重复第 1–4 步。

预览部署用的是独立的 Neon 数据库分支，测试预览不会改动生产数据库。除非全组同意、并且有人先确认过当前状态，否则不要手动对生产数据库执行迁移或 SQL。

## 10. 提 PR 前的检查清单

- [ ] 代码在我的模块里（加上薄路由文件 / registry 一行）
- [ ] 没有新依赖、没有硬编码的颜色、没有直接调 LLM
- [ ] 输入用 zod 验证了、action 调了 `requireUser()`
- [ ] 如果加了迁移：已经在最新的 `main` 基础上重新生成（见 §9）
- [ ] 没有 `AI_API_KEY` 也能跑（mock 路径）
- [ ] 空、加载和错误状态都有
- [ ] `npm run check` 通过
- [ ] diff 里的每个文件我都能解释
