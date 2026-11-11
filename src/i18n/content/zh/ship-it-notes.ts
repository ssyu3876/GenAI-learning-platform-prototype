// Chinese copy of the per-line notes in src/modules/scenarios/content/ship-it-notes.ts.
// Keyed by turn id and 0-based diff line, so the two files can be checked side by side.
// `src/i18n/content/zh/ship-it.ts` merges these into its turns, and the content dictionary
// then swaps the English notes for these at render time.
export const SHIP_LINE_NOTES_ZH: Record<string, Record<number, string>> = {
  // ---- 本来就没写错 ----
  'guard-input': {
    3: '长度检查在 create_user 之前就返回了，正常路径上绕不过八位这条规则。',
  },
  'const-time': {
    1: 'compare_digest 用固定时间遍历两个字符串，响应时间不会泄露匹配了多少位令牌。',
  },
  'add-index': {
    0: '容易被忘掉的是 CONCURRENTLY：没有它，建索引会锁住一张还在接单的表。',
  },
  'paginate-cap': {
    0: '上限在查询之前就生效，limit=99999 也要不到整张表。',
    1: '下限同样重要：负的 offset 否则会变成数据库报错，或者一个未定义的页。',
  },
  idempotency: {
    5: '扣款只发生一次，结果按 key 存下来；重试返回这个结果，而不是再扣一次。',
  },
  'request-timeout': {
    0: '两个超时，一个管连接、一个管读取。只设一个，另一个阶段就没有上限。',
  },
  'null-guard': {
    1: '判空发生在 max() 之前，空购物车原来就是在那里抛错的。',
  },
  'redact-logs': {
    2: '按字段名打码，不管值长什么样，password、token、authorization 都能盖住。',
  },
  'feature-flag': {
    0: '默认关闭、只有一个调用点、旧路径还在：没人打开之前，影响范围是零。',
  },
  'failing-test-first': {
    4: 'quantize 精确到分。被替换的那行会四舍五入到整数，偏差就是这么上线的。',
  },

  // ---- 该退回 ----
  expiry: {
    2: 'active 只是个开关，不是日期。没有任何地方比较 expires_at，去年过期的券照样能打折。',
  },
  stacking: {
    1: '没人要求的第二重折扣。需求写的是一车一张券，这里悄悄又加了一张。',
  },
  rounding: {
    1: '第二个参数是精度。它从 2 变成了 0，所有总价现在都取整到元。',
  },
  swallow: {
    4: '扣款失败却返回 True。调用方当成已付款，卡没扣钱，货照样发。',
  },
  'deleted-test': {
    0: '测试红是因为过期 bug 还在。删掉它只是拿掉了唯一的信号，并没有修好原因。',
  },
  'sql-concat': {
    0: '名字被直接拼进 SQL。像 \' OR 1=1 -- 这样的值，会把按名字查询变成整表导出。',
  },
  'md5-password': {
    1: 'MD5 天生就快，这里还没加盐。这两点恰恰是密码哈希最不能有的。',
  },
  'log-password': {
    1: '明文密码进了日志，包括真实密码打错的那几次；日志会被复制、会被长期保留。',
  },
  'verify-false': {
    1: 'verify=False 关掉了证书校验。报错消失了，防中间人的那层保护也一起消失了。',
  },
  'retry-forever': {
    4: 'continue 没有次数上限、没有退避、没有等待：出问题的网关会被一直打到 worker 被杀。',
  },

  // ---- 该修复 ----
  percentage: {
    1: '把比例当成金额来减。10% 的券在 100 元的购物车上减掉 1000，而不是 10%。',
  },
  'remove-coupon': {
    2: '把小计直接抄给总价，运费和税就没了。总价要重算，不是重置。',
  },
  concurrency: {
    1: '两个请求都可能在对方写入前读到旧值，于是都通过。读不是锁；这里需要 SELECT ... FOR UPDATE。',
  },
  'n-plus-one': {
    2: '循环里每单查一次。一百单就是 101 次往返；一个 join 只要一次。',
  },
  'off-by-one': {
    0: '第 1 页算出的 offset 是 25，第一页永远不会出现。offset 应该是 (page - 1) * limit。',
  },
  'float-money': {
    2: '只有累加器变成了 Decimal，参与运算的还是浮点数，所以偏差还在。',
  },
  'missing-return': {
    3: '空的 return 就是 None。调用方要遍历结果，空列表这一支照样崩，而这正是它想修的 case。',
  },
  'naive-time': {
    0: 'datetime.now() 不带时区，取的是服务器本地时间。换一个区域，同一行就代表另一个时刻。',
  },
  'unbounded-scan': {
    0: 'fetchall() 把整张表装进内存。不管说明怎么写，这个 diff 里没有任何流式处理。',
  },
  'mutable-default': {
    0: '这个列表在函数定义时创建一次，之后每次调用都共用同一个。',
  },
};
