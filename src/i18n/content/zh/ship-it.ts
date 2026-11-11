// Ship It: a bank of thirty review turns. Nine are drawn per run, three of each verdict,
// so the player cannot pattern-match "the agent is always wrong".
//
// Four verbs, four costs. Approving is free, rejecting costs a little, checking the tests
// costs time but no quality, and repairing costs the most. Roughly a third of the turns are
// correct as written: the lesson is calibration, not suspicion.
import type { ShipScenario, ShipRepair, ShipTurn } from '@/modules/scenarios/content/types';
import { SHIP_LINE_NOTES_ZH } from './ship-it-notes';

const approvalNote = '本来就没写错。AI 助手做出来的东西，不是个个都有问题。';

function repair(prompt: string, steps: ShipRepair['steps']): ShipRepair {
  return { prompt, steps };
}

/** Mirror of the helper in the English content file: attach the translated line notes. */
function withRisks(turn: ShipTurn): ShipTurn {
  const notes = SHIP_LINE_NOTES_ZH[turn.id];
  if (!notes) return turn;
  return {
    ...turn,
    risks: Object.entries(notes)
      .map(([line, note]) => ({ line: Number(line), note }))
      .sort((a, b) => a.line - b.line),
  };
}

const TURNS: ShipTurn[] = [
  // ------------------------------------------------------------------ correct as written
  {
    id: 'guard-input',
    title: '注册时的输入校验',
    claim: '邮箱和密码会先通过校验，之后才会执行其他逻辑。',
    diff: [
      'def signup(email, password):',
      '    if "@" not in email:',
      '        return Error("Enter a valid email.")',
      '    if len(password) < 8:',
      '        return Error("Use at least 8 characters.")',
      '    return create_user(email, password)',
    ],
    evidence: '$ pytest -q tests/signup\n  9 passed\n\n# 两个守卫分支都有覆盖',
    good: 'approve',
    minutes: { approve: 0, reject: 2, repair: 5, evidence: 1 },
    delta: { approve: 0, reject: -8, repair: -6, evidence: 0 },
    note: {
      approve: approvalNote + ' 每个分支都提前返回，并告诉用户该怎么做。',
      reject: '退回一份正确的改动要花一天，还会让团队习惯性地提防评审。',
      repair: '没有什么可修的。这个守卫的写法是对的。',
      evidence: '九项测试全过，两个分支都覆盖到了。说法站得住。',
    },
  },
  {
    id: 'const-time',
    title: '令牌比较',
    claim: '令牌比较不再泄露时间信息。',
    diff: [
      'def check_token(given: str, expected: str) -> bool:',
      '    return hmac.compare_digest(given, expected)',
    ],
    evidence:
      '$ grep -n "compare_digest" auth.py\n7:    return hmac.compare_digest(given, expected)\n\n# 常量时间比较，正确',
    good: 'approve',
    minutes: { approve: 0, reject: 2, repair: 4, evidence: 1 },
    delta: { approve: 0, reject: -10, repair: -8, evidence: 0 },
    note: {
      approve: approvalNote + ' compare_digest 就是该用的原语。',
      reject: '这正是针对时序攻击的专门修法。退回它，洞就又开了。',
      repair: '没什么可修的，自己手写的比较只会更糟。',
      evidence: '函数用对了，位置也对。通过。',
    },
  },
  {
    id: 'add-index',
    title: '给热点查询加索引',
    claim: '订单历史加载更快，行为没有变化。',
    diff: [
      'CREATE INDEX CONCURRENTLY orders_user_created_idx',
      '  ON orders (user_id, created_at DESC);',
    ],
    evidence:
      '$ EXPLAIN ANALYZE SELECT ... WHERE user_id = ?\nBefore: Seq Scan  (cost=0.00..8421.00)\nAfter : Index Only Scan (cost=0.29..8.31)',
    good: 'approve',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: 0, reject: -6, repair: -4, evidence: 0 },
    note: {
      approve: approvalNote + ' CONCURRENTLY 避开了写锁，这一点最容易被忽略。',
      reject: '执行计划好了三个数量级。退回它，就是退回这份测量结果。',
      repair: '没什么可修的。索引和查询条件完全吻合。',
      evidence: '规划器改成了只读索引扫描。这是实打实的收益。',
    },
  },
  {
    id: 'paginate-cap',
    title: '带上限的分页',
    claim: '列表接口不可能返回无限多的行。',
    diff: [
      'limit  = min(int(request.args.get("limit", 25)), 100)',
      'offset = max(int(request.args.get("offset", 0)), 0)',
      'rows = db.query(SQL_LIST + " LIMIT ? OFFSET ?", (limit, offset))',
    ],
    evidence:
      '$ curl "?limit=99999" | jq length\n100\n\n$ curl "?limit=-5" | jq length\n0\n\n# 两个边界都处理了',
    good: 'approve',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: 0, reject: -8, repair: -6, evidence: 0 },
    note: {
      approve: approvalNote + ' 上限和负数 offset 都处理了。',
      reject: '这是针对一种真实故障模式的修法。退回它，就是在赌自己不会遇到。',
      repair: '没什么可修的。两头都夹住了。',
      evidence: '最多返回一百行，负数 offset 会被压到零。',
    },
  },
  {
    id: 'idempotency',
    title: '扣款接口的幂等性',
    claim: '重试的扣款不会把同一张卡扣两次。',
    diff: [
      'def charge(req):',
      '    key = req.headers.get("Idempotency-Key")',
      '    existing = store.get(key)',
      '    if existing:',
      '        return existing',
      '    result = gateway.charge(req.total)',
      '    store.put(key, result)',
      '    return result',
    ],
    evidence:
      '$ pytest -q tests/idempotency\n  test_same_key_twice_charges_once  PASSED\n  test_missing_key_charges_twice   PASSED\n\n# 重放路径有覆盖',
    good: 'approve',
    minutes: { approve: 0, reject: 2, repair: 6, evidence: 2 },
    delta: { approve: 0, reject: -12, repair: -8, evidence: 0 },
    note: {
      approve: approvalNote + ' 按 key 保存结果，方向是对的，重放也有测试。',
      reject: '超时之后是一笔扣款还是两笔，差别就在这里。退回代价很大。',
      repair: '没什么可修的。不过真实系统还得给 key 存储加 TTL。',
      evidence: '重放测试通过了。行为是验证过的，不只是嘴上说说。',
    },
  },
  {
    id: 'request-timeout',
    title: '给上游调用加超时',
    claim: '上游再慢，也不会一直占着 worker。',
    diff: [
      'resp = requests.post(url, json=payload, timeout=(3.05, 10))',
      'if resp.status_code >= 500:',
      '    raise UpstreamError(resp.status_code)',
    ],
    evidence:
      '$ grep -n "timeout" client.py\n12: resp = requests.post(url, json=payload, timeout=(3.05, 10))\n\n# 连接和读取超时都设了',
    good: 'approve',
    minutes: { approve: 0, reject: 1, repair: 4, evidence: 1 },
    delta: { approve: 0, reject: -10, repair: -6, evidence: 0 },
    note: {
      approve: approvalNote + ' 两个超时都设了，这一点最关键。',
      reject: '调用没有超时，一个慢依赖就能把整个服务拖垮。',
      repair: '没什么可修的。两个超时，一个管连接，一个管读取。',
      evidence: '两个阶段都设了超时，5xx 会抛出来，而不是被吞掉。',
    },
  },
  {
    id: 'null-guard',
    title: '空购物车',
    claim: '空购物车不再抛异常了。',
    diff: [
      'def best_item(cart):',
      '    if not cart.items:',
      '        return None',
      '    return max(cart.items, key=lambda i: i.price)',
    ],
    evidence:
      '$ pytest -q tests/cart\n  test_empty_cart_returns_none  PASSED\n  test_single_item             PASSED\n\n# 边界情况有覆盖',
    good: 'approve',
    minutes: { approve: 0, reject: 1, repair: 4, evidence: 1 },
    delta: { approve: 0, reject: -8, repair: -6, evidence: 0 },
    note: {
      approve: approvalNote + ' 空的情况在 max 之前就处理了，以前正是这里出错。',
      reject: '这个守卫正是针对你看到的那个崩溃的修法。',
      repair: '没什么可修的。',
      evidence: '空的情况有单独的测试，而且通过了。',
    },
  },
  {
    id: 'redact-logs',
    title: '日志里的密钥脱敏',
    claim: '密码不再出现在请求日志里。',
    diff: [
      'MASK = {"password", "token", "authorization"}',
      'def scrub(d):',
      '    return {k: ("***" if k.lower() in MASK else v) for k, v in d.items()}',
      'log.info("request", extra={"body": scrub(body)})',
    ],
    evidence:
      '$ grep -n "log.info" handlers.py\n31: log.info("request", extra={"body": scrub(body)})\n\n# 唯一带 body 的日志行会经过 scrub',
    good: 'approve',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: 0, reject: -10, repair: -6, evidence: 0 },
    note: {
      approve: approvalNote + ' 按字段名打码，真正要紧的情况能盖住。',
      reject: '这堵上了一个真实的泄露口子。退回它，密码就还留在日志里。',
      repair: '嵌套 body 的情况得靠递归，但这个说法只讲顶层，顶层已经做到了。',
      evidence: '每一条带 body 的日志都过了 scrub。说法是准确的。',
    },
  },
  {
    id: 'feature-flag',
    title: '新代码放在开关后面',
    claim: '在开关打开之前，新的定价逻辑影响不到任何人。',
    diff: [
      'if flags.enabled("new_pricing", user):',
      '    return new_pricing(cart)',
      'return old_pricing(cart)',
    ],
    evidence:
      '$ grep -rn "new_pricing(" --include=*.py\ncheckout.py:44:  if flags.enabled("new_pricing", user):\n\n# 只有一个调用点，且在开关后面',
    good: 'approve',
    minutes: { approve: 0, reject: 1, repair: 4, evidence: 1 },
    delta: { approve: 0, reject: -8, repair: -4, evidence: 0 },
    note: {
      approve: approvalNote + ' 只有一个调用点，默认关闭，旧路径原样保留。定价改动就该这么发。',
      reject: '默认走旧路径的开关，就是这种改动的安全版本。',
      repair: '没什么可修的。',
      evidence: '只有一个调用点，而且在开关后面。没人打开之前，影响范围是零。',
    },
  },
  {
    id: 'failing-test-first',
    title: '一个复现了 bug 的测试',
    claim: '先给舍入问题补了一个回归测试，然后把问题修了。',
    diff: [
      'def test_total_rounds_half_up():',
      '    assert finalise(total=Decimal("10.005")) == Decimal("10.01")',
      '',
      '- cart.total = round(cart.total, 0)',
      '+ cart.total = cart.total.quantize(Decimal("0.01"))',
    ],
    evidence:
      '$ git log --oneline -1\na91c02e test then fix for rounding\n\n$ pytest -q tests/money.py\n  1 passed',
    good: 'approve',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: 0, reject: -10, repair: -6, evidence: 0 },
    note: {
      approve: approvalNote + ' 先写测试，再修问题，用 Decimal 而不是 float。三件事都对。',
      reject: '每个修复都该长这样。退回它，就是退回这套流程。',
      repair: '没什么可修的。',
      evidence: '只有一个提交，测试和修复放在一起，测试精确锁住了舍入行为。',
    },
  },

  // ------------------------------------------------------------------ reject
  {
    id: 'expiry',
    title: '优惠券模型',
    claim: '每一笔购物车都能正确应用折扣。',
    diff: [
      'def apply_coupon(cart, code):',
      '    c = find_coupon(code)',
      '    if c and c.active:',
      '        cart.total = cart.total * (1 - c.pct)',
      '    return cart.total',
    ],
    evidence:
      '$ pytest -q tests/coupons\nFAILED test_expired_coupon_rejected\n  1 failed, 11 passed\n\n# 失败的测试点出了缺口',
    good: 'reject',
    minutes: { approve: 0, reject: 2, repair: 6, evidence: 1 },
    delta: { approve: -22, reject: 0, repair: -8, evidence: 0 },
    note: {
      approve: '它只看了 active，从没比较 expires_at。过期优惠券照样在打折。',
      reject: '对。过期判断需要显式比较日期，顺手整理是整理不出来的。',
      repair: '你可以把检查补上，但这份改动本来就没想写对。',
      evidence: '失败的那个测试，名字正好点出了说法回避掉的缺口。',
    },
  },
  {
    id: 'stacking',
    title: '一个“贴心”的补充',
    claim: '叠加能用，总价也被夹住了。',
    diff: [
      '    cart.total *= (1 - c.pct)',
      '    cart.total *= (1 - cart.member_pct)',
      'return max(0, cart.total)',
    ],
    evidence: '$ git show --stat HEAD\n coupons.py | 2 +-\n\n# 两行折扣，没有测试覆盖叠加',
    good: 'reject',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: -20, reject: 0, repair: -6, evidence: 0 },
    note: {
      approve: '需求写的是每单只能用一张优惠券。它加了一条没人批准的策略。',
      reject: '对。有用不等于在需求范围内。',
      repair: '没有坏的东西要修。问题在于它做了没人要求的事。',
      evidence: '两行折扣乘法，没有任何测试。第二行不在需求里。',
    },
  },
  {
    id: 'rounding',
    title: '最后的整理',
    claim: '一次重构，行为不变。',
    diff: ['- cart.total = round(cart.total, 2)', '+ cart.total = round(cart.total, 0)'],
    evidence:
      '$ git diff\n-    cart.total = round(cart.total, 2)\n+    cart.total = round(cart.total, 0)\n\n# 第二个参数变了',
    good: 'reject',
    minutes: { approve: 0, reject: 1, repair: 4, evidence: 1 },
    delta: { approve: -12, reject: 0, repair: -5, evidence: 0 },
    note: {
      approve: 'round(x, 0) 会舍入到整数。价格最多会变 0.50，而且没人被告知。',
      reject: '对。舍入方式的改动就是定价改动，不管它叫什么名字。',
      repair: '你可以把它改回去，但这份改动根本就不该提出来。',
      evidence: 'diff 改的是精度参数。这就是行为变化。',
    },
  },
  {
    id: 'swallow',
    title: '支付外面的一层“安全网”',
    claim: '结账现在能扛住网关故障了。',
    diff: [
      'def charge(cart):',
      '    try:',
      '        return gateway.charge(cart.total)',
      '    except Exception:',
      '        return True',
    ],
    evidence: '$ grep -rn "test_charge_failure" tests/\n（无匹配）\n\n# 没有测试覆盖失败的扣款',
    good: 'reject',
    minutes: { approve: 0, reject: 2, repair: 6, evidence: 1 },
    delta: { approve: -30, reject: 0, repair: -10, evidence: 0 },
    note: {
      approve: '每一次失败的扣款都被报成了成功。卡没扣钱，订单却免费发了货。',
      reject: '对。支付失败必须让人看见，绝不能吞成一个 True。',
      repair: '重新抛出异常，只是在为一个不该存在的改动补正确的代码。',
      evidence: '没有任何测试覆盖失败路径。这个缺口本身就是发现。',
    },
  },
  {
    id: 'deleted-test',
    title: '删掉一个测试',
    claim: '现在测试套件是绿的，也稳定了。',
    diff: [
      '- def test_expired_coupon_rejected():',
      '-     c = make_coupon(expires=-1)',
      '-     assert apply_coupon(cart, c.code) == cart.total',
      '+ # removed: flaky',
    ],
    evidence:
      '$ git log --oneline -3 -- tests/coupons.py\nf3a91c2 remove flaky test\n8b2d1e0 add expiry handling\n\n# 删掉了，没有修',
    good: 'reject',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: -25, reject: 0, repair: -8, evidence: 0 },
    note: {
      approve: '测试是红的，因为过期 bug 还在。你删掉了唯一的信号。',
      reject: '对。失败的测试是一条线索，不是噪音。',
      repair: '你可以把它恢复，但该被要求的是让 AI 助手去修根因。',
      evidence: '这个提交删了三行，加了一条注释。什么都没修。',
    },
  },
  {
    id: 'sql-concat',
    title: '“灵活”的用户查询',
    claim: '用户查询现在支持按名字模糊匹配。',
    diff: ['q = "SELECT * FROM users WHERE name LIKE \'%" + name + "%\'"', 'return db.query(q)'],
    evidence: '$ curl "/users?name=%25\' OR 1=1 --" | jq length\n4821\n\n# 每一行都被返回了',
    good: 'reject',
    minutes: { approve: 0, reject: 2, repair: 7, evidence: 2 },
    delta: { approve: -35, reject: 0, repair: -12, evidence: 0 },
    note: {
      approve: '这里拼字符串就是 SQL 注入。构造一个名字，整张用户表都能拉回来。',
      reject: '对。这是漏洞，不是风格问题。',
      repair: '改成参数化确实能行，但一份从拼接开始的改动就该退回去。',
      evidence: '构造的输入把每一行都返回了。注入是真实存在的。',
    },
  },
  {
    id: 'md5-password',
    title: '更快的密码哈希',
    claim: '现在哈希更快了，注册也能快一些。',
    diff: [
      '- pw_hash = bcrypt.hashpw(pw.encode(), bcrypt.gensalt())',
      '+ pw_hash = hashlib.md5(pw.encode()).hexdigest()',
    ],
    evidence:
      '$ grep -n "md5" auth.py\n14: pw_hash = hashlib.md5(pw.encode()).hexdigest()\n\n# 无盐、快、可查表反推',
    good: 'reject',
    minutes: { approve: 0, reject: 2, repair: 6, evidence: 1 },
    delta: { approve: -40, reject: 0, repair: -15, evidence: 0 },
    note: {
      approve: 'MD5 快是设计使然，而这恰恰是密码最不需要的。无盐 MD5 用查表就能破。',
      reject: '对。这里的快就是漏洞，不是功能。',
      repair: '正确的做法是退回并继续用 bcrypt，而不是围着它打补丁。',
      evidence: '无盐 MD5。一张彩虹表就能盖住大部分用户。',
    },
  },
  {
    id: 'log-password',
    title: '更好的登录诊断',
    claim: '登录失败现在能记录足够的信息来排查了。',
    diff: [
      'if not user or not verify(user, pw):',
      '    log.warning(f"login failed: {email} / {pw}")',
      '    return Error("Wrong email or password")',
    ],
    evidence:
      '$ grep -n "login failed" auth.py\n22: log.warning(f"login failed: {email} / {pw}")\n\n# 密码就在日志行里',
    good: 'reject',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: -35, reject: 0, repair: -12, evidence: 0 },
    note: {
      approve: '明文密码进了日志，每一次失败都记，包括把真密码打错的那种。',
      reject: '对。诊断价值再大，也不能把凭据存进日志。',
      repair: '你可以把它擦掉，但这份改动一开始就不该写进去。',
      evidence: '密码被拼进了日志行。日志会被复制、传输、长期保留。',
    },
  },
  {
    id: 'verify-false',
    title: '“修好”证书错误',
    claim: '上游调用在预发环境又能用了。',
    diff: [
      '- resp = requests.get(url, timeout=5)',
      '+ resp = requests.get(url, timeout=5, verify=False)',
    ],
    evidence:
      '$ grep -n "verify=False" client.py\n9: resp = requests.get(url, timeout=5, verify=False)\n\n# TLS 校验已关闭',
    good: 'reject',
    minutes: { approve: 0, reject: 2, repair: 6, evidence: 1 },
    delta: { approve: -35, reject: 0, repair: -14, evidence: 0 },
    note: {
      approve: 'verify=False 会关掉证书校验。路径上的任何攻击者都能读到流量。',
      reject: '对。“现在能用了”不等于“修好了”。',
      repair: '真正的修法是补上 CA 证书包。被退回的改动，不该靠打补丁让它变得能接受。',
      evidence: 'TLS 校验被关了。错误只是被藏起来，并没有解决。',
    },
  },
  {
    id: 'retry-forever',
    title: '一直重试到成功',
    claim: '瞬时故障现在会自动处理了。',
    diff: [
      'while True:',
      '    try:',
      '        return gateway.charge(amount)',
      '    except GatewayError:',
      '        continue',
    ],
    evidence:
      '$ grep -n "while True" payments.py\n18: while True:\n\n# 没有尝试上限、没有退避、没有抖动',
    good: 'reject',
    minutes: { approve: 0, reject: 1, repair: 6, evidence: 1 },
    delta: { approve: -30, reject: 0, repair: -12, evidence: 0 },
    note: {
      approve: '没有上限的重试循环会猛砸一个已经出问题的网关，还会一直占着 worker。',
      reject: '对。重试需要上限、退避，以及一个放弃的出口。',
      repair: '加上上限的指数退避确实能用，但这个写法必须退回去。',
      evidence: '没有上限，没有退避。网关一挂，就变成自己给自己制造的流量洪峰。',
    },
  },

  // ------------------------------------------------------------------ repair
  {
    id: 'percentage',
    title: '整理过的数学',
    claim: '纯重构。行为不变。',
    diff: [
      '    if c and c.active and c.expires_at > now():',
      '        cart.total = cart.total - c.pct * 100',
      '    return cart.total',
    ],
    evidence:
      '$ pytest -q tests/coupons\nFAILED test_discount_is_percentage\n  assert 900.0 == 90.0\n1 failed, 11 passed',
    good: 'repair',
    minutes: { approve: 0, reject: 2, repair: 7, evidence: 1 },
    delta: { approve: -24, reject: -10, repair: 0, evidence: 0 },
    note: {
      approve: '一张 10% 的优惠券，现在会从每个购物车里减掉 1000。“没变”只是说法，不是事实。',
      reject: '你把它拦下来了，但里面顺手做的过期判断是对的。退回，等于把这一点也扔了。',
      repair: '',
      evidence: '测试期望 90，实际拿到 900。百分比变成了金额。',
    },
    repair: repair('算式错了。它应该变成什么样？', [
      {
        prompt: '第 4 行把百分比当成了金额。哪个版本才对？',
        options: [
          {
            id: 'mul',
            label: 'cart.total * (1 - c.pct)',
            ok: true,
            note: '对。比例要乘，不能减。',
          },
          {
            id: 'div',
            label: 'cart.total / (1 + c.pct)',
            ok: false,
            note: '完全换了个运算，而且会把总价抬高。',
          },
          {
            id: 'minus',
            label: 'cart.total - c.pct',
            ok: false,
            note: '从总价里减掉 0.10。还是错的，只是错得更隐蔽。',
          },
        ],
      },
      {
        prompt: '说法是“行为没变”。怎样才能证明它到底变没变？',
        options: [
          {
            id: 'test',
            label: '一个测试：100 上用 10% 优惠券，结果应为 90',
            ok: true,
            note: '把期望写具体，这个说法才可检验。',
          },
          {
            id: 'read',
            label: '再更仔细地读一遍 diff',
            ok: false,
            note: '靠读发现了这一次的 bug。测试才能一直发现它。',
          },
          {
            id: 'trust',
            label: '让 AI 助手再确认一次',
            ok: false,
            note: '这等于让说法的来源去验证这个说法。',
          },
        ],
      },
    ]),
  },
  {
    id: 'remove-coupon',
    title: '移除优惠券',
    claim: '移除优惠券会恢复原来的总价。',
    diff: [
      'def remove_coupon(cart):',
      '    cart.coupon = None',
      '    cart.total = cart.subtotal',
      '    return cart.total',
    ],
    evidence:
      '$ pytest -q tests/coupons\nFAILED test_remove_restores_total\n  assert 88.0 == 108.0    # 少了运费 10 和税 8\n1 failed, 11 passed',
    good: 'repair',
    minutes: { approve: 0, reject: 2, repair: 6, evidence: 1 },
    delta: { approve: -18, reject: -8, repair: 0, evidence: 0 },
    note: {
      approve: 'total 里已经加过运费和税。把 subtotal 抄回去，等于悄悄把这两项删了。',
      reject: '说得过去，但这一轮是可以修的：重新算，而不是照抄。',
      repair: '',
      evidence: '失败的断言显示少了 20：运费 10 和税 8，再加上舍入。',
    },
    repair: repair('重置的方式错了。应该改成怎么做？', [
      {
        prompt: '总价应该怎么重新算？',
        options: [
          {
            id: 'recompute',
            label: '从明细重新算，再加上运费和税',
            ok: true,
            note: '对。抄一个数不等于重新算。',
          },
          {
            id: 'store',
            label: '用变量记住之前的总价',
            ok: false,
            note: '连续用两张优惠券之前都行，之后存下的值已经打过折了。',
          },
          {
            id: 'clamp',
            label: '把总价夹住，不让它低于零',
            ok: false,
            note: '负数没了，运费和税还是丢的。',
          },
        ],
      },
    ]),
  },
  {
    id: 'concurrency',
    title: '防止重复打折的守卫',
    claim: '两个结账不能给同一个购物车重复打折。',
    diff: [
      'def apply_coupon(cart, code):',
      '    if cart.coupon == code:',
      '        return cart.total',
      '    ...apply...',
      '    cart.coupon = code',
    ],
    evidence: '$ grep -n "lock\\|for_update" coupons.py\n（无匹配）\n\n# 读状态的守卫不是锁',
    good: 'repair',
    minutes: { approve: 0, reject: 2, repair: 8, evidence: 2 },
    delta: { approve: -26, reject: -6, repair: 0, evidence: 0 },
    note: {
      approve: '两个请求都在对方写入之前读到了 None。结果两边都打了折。',
      reject: '安全，但本意是对的，修法也很清楚。',
      repair: '',
      evidence: '整个文件里没有任何锁。这个检查只是一次读，而读会竞争。',
    },
    repair: repair('这个守卫只是读状态。它真正需要的是什么？', [
      {
        prompt: '靠什么让这个检查变成原子的？',
        options: [
          {
            id: 'lock',
            label: '在事务里执行 SELECT ... FOR UPDATE',
            ok: true,
            note: '在行锁里读取，检查才能在并发下站住。',
          },
          {
            id: 'retry',
            label: '优惠券不一致就重试整个请求',
            ok: false,
            note: '两个请求还是先打了折。重试只是把工作量翻倍。',
          },
          {
            id: 'cache',
            label: '把优惠券缓存到 session 上',
            ok: false,
            note: '两个 session 还是两个 session。',
          },
        ],
      },
      {
        prompt: '你会怎么证明修好了？',
        options: [
          {
            id: 'concurrent',
            label: '一个同时发两个请求的测试',
            ok: true,
            note: '只有并发测试才能抓到这个。',
          },
          {
            id: 'sequential',
            label: '连续调用两次，检查总价',
            ok: false,
            note: '顺序调用就算守卫是坏的也会过。所以它才上线了。',
          },
          {
            id: 'manual',
            label: '在浏览器里快速点两次按钮',
            ok: false,
            note: '很难复现，也没法留成回归测试。',
          },
        ],
      },
    ]),
  },
  {
    id: 'n-plus-one',
    title: '加载订单列表',
    claim: '订单历史现在会显示客户名了。',
    diff: [
      'orders = db.query("SELECT * FROM orders WHERE user_id = ?", (uid,))',
      'for o in orders:',
      '    o.customer = db.query("SELECT name FROM users WHERE id = ?", (o.user_id,))',
    ],
    evidence:
      '$ grep -c "db.query" orders.py\n2\n\n$ tail -1 logs/slow.log\nGET /orders  user=8841  queries=101  ms=2380',
    good: 'repair',
    minutes: { approve: 0, reject: 2, repair: 7, evidence: 2 },
    delta: { approve: -18, reject: -8, repair: 0, evidence: 0 },
    note: {
      approve: '每张订单一次查询。一百张订单就是一百零一次往返。',
      reject: '退回也能解决问题，但改成 join 只是个小改动，而且很清楚。',
      repair: '',
      evidence: '两行查询，一行在循环里，一个页面记了 101 次查询。',
    },
    repair: repair('问题出在循环上。用什么替代它？', [
      {
        prompt: '怎么用一次往返就拿到客户名？',
        options: [
          {
            id: 'join',
            label: 'JOIN users on orders.user_id',
            ok: true,
            note: '对。一次查询、一次往返，规划器还能用上索引。',
          },
          {
            id: 'in',
            label: '先收集 id，再单独跑一次 WHERE id IN (...)',
            ok: true,
            note: '也对：两次查询代替 101 次。join 更简单，但这个也能用。',
          },
          {
            id: 'cache',
            label: '把客户名缓存到订单行上',
            ok: false,
            note: '反范式只是把查询藏起来，名字会变旧。',
          },
        ],
      },
    ]),
  },
  {
    id: 'off-by-one',
    title: '页码',
    claim: '分页现在从 1 开始，UI 传的就是这个。',
    diff: ['offset = page * limit', 'rows = db.query(SQL + " LIMIT ? OFFSET ?", (limit, offset))'],
    evidence:
      '$ pytest -q tests/paging\nFAILED test_first_page_has_no_offset\n  assert offset == 0 but got 25\n1 failed',
    good: 'repair',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: -14, reject: -6, repair: 0, evidence: 0 },
    note: {
      approve: '页码从 1 开始，offset 却从 0 开始，结果第 1 页直接跳过了第一页。',
      reject: '退回也没问题，但这只是一个字符的修法。',
      repair: '',
      evidence: '第 1 页算出的 offset 是 25，所以第一页结果永远不会显示。',
    },
    repair: repair('第一页被跳过了。第 N 页的 offset 该是多少？', [
      {
        prompt: '哪个表达式能让第 1 页的 offset 为 0？',
        options: [
          {
            id: 'minus',
            label: '(page - 1) * limit',
            ok: true,
            note: '对。第 1 页没有偏移，第 2 页正好跳过一页。',
          },
          {
            id: 'plus',
            label: '(page + 1) * limit',
            ok: false,
            note: '在第一条结果之前就跳过了两页。',
          },
          {
            id: 'same',
            label: '用 page * limit，把 UI 改成从 0 开始',
            ok: false,
            note: '这样是自洽了，但 UI 传的本来就是从 1 开始的页码。',
          },
        ],
      },
    ]),
  },
  {
    id: 'float-money',
    title: '总价改用 Decimal',
    claim: '修掉了购物车总价里的舍入漂移。',
    diff: [
      '- total = 0.0',
      '- for item in items: total += item.price * item.qty',
      '+ total = Decimal("0")',
      '+ for item in items: total += item.price * item.qty',
      'return total',
    ],
    evidence:
      '$ pytest -q tests/money.py\nFAILED test_three_times_ten_percent\n  assert 0.3 == 0.30000000000000004\n1 failed',
    good: 'repair',
    minutes: { approve: 0, reject: 2, repair: 6, evidence: 1 },
    delta: { approve: -16, reject: -8, repair: 0, evidence: 0 },
    note: {
      approve: 'Decimal 只加在了累加器上。参与运算的还是 float，漂移照旧。',
      reject: '退回会把正确的思路一起丢掉。累加器只是修复的一半。',
      repair: '',
      evidence: '断言还是失败：0.30000000000000004。只改动了累加器。',
    },
    repair: repair('累加器已经是 Decimal 了，漂移却还在。为什么？', [
      {
        prompt: '还有什么也必须是 Decimal？',
        options: [
          {
            id: 'operands',
            label: 'item.price 和 item.qty，在读取它们的边界处',
            ok: true,
            note: '对。float 和 Decimal 混着算还是会带出 float 误差，所以在边界处就转换。',
          },
          {
            id: 'str',
            label: '返回前把总价格式化成两位小数',
            ok: false,
            note: '只把漂移藏在显示层，存下来的值还是错的。',
          },
          {
            id: 'round',
            label: '最后调用 round(total, 2)',
            ok: false,
            note: '显示上能用，一旦聚合就会丢钱。',
          },
        ],
      },
    ]),
  },
  {
    id: 'missing-return',
    title: '空分支',
    claim: '处理了列表为空的情况。',
    diff: [
      'def list_items(user):',
      '    items = db.query(SQL, (user.id,))',
      '    if not items:',
      '        return',
      '    return [to_json(i) for i in items]',
    ],
    evidence:
      '$ curl /items | jq\nnull\n\n$ curl /items | jq length\njq: error: null has no length',
    good: 'repair',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: -14, reject: -6, repair: 0, evidence: 0 },
    note: {
      approve:
        '裸 return 就是 None。调用方会去遍历结果，在空列表这种情况下崩掉——而这正是它要修的情况。',
      reject: '退回是安全的，但修法只有一行。',
      repair: '',
      evidence: '接口返回了 null，而不是空数组。客户端还在它上面调 .length。',
    },
    repair: repair('空的情况也必须能遍历。它应该返回什么？', [
      {
        prompt: '调用方期望的是什么？',
        options: [
          {
            id: 'empty',
            label: '空列表',
            ok: true,
            note: '对。每个分支都返回同一种类型，调用方就不用特判。',
          },
          {
            id: 'none',
            label: '返回 None，让调用方自己判断',
            ok: false,
            note: '等于把分支推给每个调用方。总有一个会忘。',
          },
          { id: 'err', label: '抛一个 404', ok: false, note: '空集合不是资源不存在。' },
        ],
      },
    ]),
  },
  {
    id: 'naive-time',
    title: '存时间戳',
    claim: '创建时间戳现在存对了。',
    diff: ['created_at = datetime.now()', 'db.insert(orders, created_at=created_at)'],
    evidence:
      '$ grep -n "datetime" models.py\n4: created_at = datetime.now()\n\n# 没有附带时区；用的是服务器本地时间',
    good: 'repair',
    minutes: { approve: 0, reject: 1, repair: 6, evidence: 1 },
    delta: { approve: -16, reject: -8, repair: 0, evidence: 0 },
    note: {
      approve:
        'datetime.now() 是不带时区的本地时间。服务器一换区域，同一张订单就会拿到不同的时间戳。',
      reject: '可以修：把这一处调用改成带时区的 UTC。',
      repair: '',
      evidence: '哪里都没有 tzinfo。服务器一搬，这些行的时间就有歧义了。',
    },
    repair: repair('不带时区的本地时间戳没法跨区域比较。怎么修？', [
      {
        prompt: '哪个调用记录的是一个没有歧义的时刻？',
        options: [
          {
            id: 'utc',
            label: 'datetime.now(timezone.utc)',
            ok: true,
            note: '对。带时区的 UTC，换区域也不怕。',
          },
          {
            id: 'local',
            label: 'datetime.now().astimezone()',
            ok: false,
            note: '带时区了，但还是服务器本地时区。两个区域就是两个时钟。',
          },
          {
            id: 'str',
            label: '改成存格式化字符串',
            ok: false,
            note: '比较和索引都更差，而且仍然没有时区。',
          },
        ],
      },
    ]),
  },
  {
    id: 'unbounded-scan',
    title: '导出所有行',
    claim: '导出接口会高效地把所有数据流式发出去。',
    diff: [
      'rows = db.query("SELECT * FROM events").fetchall()',
      'return "\\n".join(to_csv(r) for r in rows)',
    ],
    evidence: '$ curl /export > /dev/null\n# worker RSS 从 340MB 涨到 4.1GB，然后 OOM',
    good: 'repair',
    minutes: { approve: 0, reject: 2, repair: 7, evidence: 2 },
    delta: { approve: -22, reject: -8, repair: 0, evidence: 0 },
    note: {
      approve: 'fetchall 会把整张表读进内存。说法里写的是“流式”，可这里根本没有流。',
      reject: '退回在方向上是正确的，修法也很常见。',
      repair: '',
      evidence: '内存从 340MB 涨到 4.1GB，worker 挂了。没有任何东西被流式处理。',
    },
    repair: repair('这里没有任何流式处理。怎么做才算？', [
      {
        prompt: '怎么发送一大张表，又不把它整个放进内存？',
        options: [
          {
            id: 'cursor',
            label: '用服务端游标，把行逐个产出到响应里',
            ok: true,
            note: '对。不管表多大，内存都有上限。',
          },
          {
            id: 'chunk',
            label: '用 LIMIT/OFFSET 分页读取再拼接',
            ok: true,
            note: '内存也有上限，只是翻到表深处时 OFFSET 会变慢。',
          },
          {
            id: 'raise',
            label: '调高 worker 的内存上限',
            ok: false,
            note: '只是把悬崖挪远，没有搬走。',
          },
        ],
      },
    ]),
  },
  {
    id: 'mutable-default',
    title: '带默认值的辅助函数',
    claim: '一个小辅助函数，用来拼查询过滤条件。',
    diff: [
      'def build_filter(fields=[]):',
      '    fields.append("deleted_at IS NULL")',
      '    return " AND ".join(fields)',
    ],
    evidence:
      "$ python -c \"from q import build_filter as b; print(b(['a'])); print(b(['b']))\"\na AND deleted_at IS NULL\nb AND deleted_at IS NULL AND deleted_at IS NULL",
    good: 'repair',
    minutes: { approve: 0, reject: 1, repair: 5, evidence: 1 },
    delta: { approve: -18, reject: -6, repair: 0, evidence: 0 },
    note: {
      approve: '默认列表在定义时只创建一次，然后被共用。条件会在每次调用之间累积。',
      reject: '退回也能解决，但这是 Python 里最典型的一行修法。',
      repair: '',
      evidence: '第二次调用带着第一次的条件，又加了一条。',
    },
    repair: repair('默认参数在多次调用之间是共用的。怎么修？', [
      {
        prompt: '怎么让这个参数每次调用都拿到全新的默认值？',
        options: [
          {
            id: 'none',
            label: 'def build_filter(fields=None): fields = fields or []',
            ok: true,
            note: '对。哨兵值每次调用都会新建。',
          },
          {
            id: 'tuple',
            label: 'def build_filter(fields=()): 再拼成 tuple + (...)',
            ok: true,
            note: '也对：不可变的默认值没法原地修改。',
          },
          {
            id: 'copy',
            label: '在函数里复制一份列表',
            ok: false,
            note: '复制之前，修改已经发生了。',
          },
        ],
      },
    ]),
  },
];

export const SHIP_IT_ZH: ShipScenario = {
  key: 'ship-it',
  title: '发布时刻',
  tagline: '花评审时间，守住项目质量',
  summary:
    '三十个评审回合，每局抽九个，三种判定各三个。通过不花时间，退回要花一点，读测试会花时间但从不伤质量，修复花得最多。三分之一的回合本来就写对了。',
  meta: '30 个回合中抽 9 个',
  minutes: 30,
  weights: { quality: 0.65, time: 0.35 },
  drawCount: 9,
  drawMix: { approve: 3, reject: 3, repair: 3 },
  turns: TURNS.map(withRisks),
};
