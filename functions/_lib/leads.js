/**
 * functions/_lib/leads.js —— 客户留言 / 需求收集的公共逻辑
 *
 * 说明：
 *   · 目录名以下划线开头，Cloudflare Pages Functions 不会把它当成路由，只做模块引用。
 *   · 运行时不依赖任何第三方包，只用标准 Request/Response + D1。
 *   · 所有 SQL 都用参数绑定（prepare().bind()），不拼字符串。
 */

/* 留言状态：新 / 已联系 / 已报价 / 成交 / 放弃 */
export const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

export const STATUS_LABEL = {
  new: '新留言',
  contacted: '已联系',
  quoted: '已报价',
  won: '成交',
  lost: '已放弃',
};

/* ---------------- 基础工具 ---------------- */

export function json(data, status, extra) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  };
  if (extra) {
    for (const k in extra) headers[k] = extra[k];
  }
  return new Response(JSON.stringify(data), { status: status || 200, headers });
}

/** 去空白、去控制字符、截断超长输入（防止有人塞 10MB 文本进库） */
export function clean(v, max) {
  if (v == null) return '';
  let s = String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  const lim = max || 500;
  if (s.length > lim) s = s.slice(0, lim);
  return s;
}

export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(s) && s.length <= 120;
}

/** 宽松的电话/WhatsApp 判断：允许 + - ( ) 空格，纯数字位数 7–15 */
export function isPhone(s) {
  if (!/^[+()\-\s\d.]+$/.test(s)) return false;
  const digits = (s.match(/\d/g) || []).length;
  return digits >= 7 && digits <= 15;
}

/** 看起来像不像「有效联系方式」——邮箱或电话都算 */
export function looksLikeContact(s) {
  return isEmail(s) || isPhone(s);
}

export async function sha256Hex(str) {
  const buf = new TextEncoder().encode(String(str));
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 定长比较，避免用时间差猜测口令 */
export function safeEqual(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** ISO 时间，形如 2026-10-20T04:55:00.000Z */
export function nowIso() {
  return new Date().toISOString();
}

/** n 秒前的 ISO 时间，用于限流窗口 */
export function isoAgo(seconds) {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

/* ---------------- 数据库 ---------------- */

/**
 * 建表（幂等）。第一次被调用时执行，之后同一 isolate 内直接命中缓存。
 * 这样即使部署时忘了跑 schema，第一个留言也会自动把表建好。
 */
let schemaReady = null;

export async function ensureSchema(env) {
  if (!env || !env.DB) throw new Error('no_db');
  if (!schemaReady) {
    schemaReady = (async () => {
      await env.DB.exec(
        'CREATE TABLE IF NOT EXISTS leads (' +
          'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
          "created_at TEXT NOT NULL," +
          "status TEXT NOT NULL DEFAULT 'new'," +
          "name TEXT NOT NULL DEFAULT ''," +
          "contact_type TEXT NOT NULL DEFAULT 'whatsapp'," +
          "contact TEXT NOT NULL," +
          "country TEXT NOT NULL DEFAULT ''," +
          "category TEXT NOT NULL DEFAULT ''," +
          "product TEXT NOT NULL DEFAULT ''," +
          "ref_url TEXT NOT NULL DEFAULT ''," +
          "qty TEXT NOT NULL DEFAULT ''," +
          "target_price TEXT NOT NULL DEFAULT ''," +
          "message TEXT NOT NULL DEFAULT ''," +
          "lang TEXT NOT NULL DEFAULT ''," +
          "page TEXT NOT NULL DEFAULT ''," +
          "referrer TEXT NOT NULL DEFAULT ''," +
          "ua TEXT NOT NULL DEFAULT ''," +
          "ip_hash TEXT NOT NULL DEFAULT ''," +
          "admin_note TEXT NOT NULL DEFAULT ''" +
          ')'
      );
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at)');
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)');
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_leads_ip ON leads(ip_hash)');
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

/* ---------------- 管理端鉴权 ---------------- */

/**
 * 后台口令：请求头 x-admin-key 或 ?key=。
 * 口令存在 Cloudflare Pages 项目的环境变量（ADMIN_KEY）里，不写进代码。
 */
export function adminKeyOk(request, env) {
  const key = env && env.ADMIN_KEY ? String(env.ADMIN_KEY) : '';
  if (!key) return false;
  const url = new URL(request.url);
  const given = request.headers.get('x-admin-key') || url.searchParams.get('key') || '';
  return safeEqual(given, key);
}

/* ---------------- 邮件通知（可选） ---------------- */

/**
 * 只在配置了 RESEND_API_KEY + NOTIFY_TO 时才发信；没配置就静默跳过。
 * 这样第一版不依赖任何第三方，想开通知时再加环境变量即可。
 */
export async function notifyByEmail(env, lead) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_TO) return false;
  const subject = '新客户留言 · ' + (lead.product || '未填写需求').slice(0, 40);
  const lines = [
    '需求：' + (lead.product || '-'),
    '品类：' + (lead.category || '-'),
    '数量：' + (lead.qty || '-'),
    '目标价：' + (lead.target_price || '-'),
    '国家：' + (lead.country || '-'),
    '联系方式：' + (lead.contact_type === 'email' ? '邮箱 ' : 'WhatsApp ') + lead.contact,
    '参考链接：' + (lead.ref_url || '-'),
    '补充：' + (lead.message || '-'),
    '来源页：' + (lead.page || '-'),
    '时间：' + lead.created_at,
    '',
    '去后台看：https://eddytrading.com/admin.html',
  ];
  const body = {
    from: env.NOTIFY_FROM || 'EddySupply <onboarding@resend.dev>',
    to: [env.NOTIFY_TO],
    subject,
    text: lines.join('\n'),
  };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + env.RESEND_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

/* ---------------- CSV ---------------- */

export function toCsv(rows) {
  const cols = [
    ['id', 'ID'],
    ['created_at', '时间(UTC)'],
    ['status', '状态'],
    ['contact_type', '联系方式类型'],
    ['contact', '联系方式'],
    ['country', '国家'],
    ['category', '品类'],
    ['product', '需求产品'],
    ['qty', '数量'],
    ['target_price', '目标价'],
    ['ref_url', '参考链接'],
    ['message', '补充说明'],
    ['name', '称呼'],
    ['lang', '语言'],
    ['page', '来源页'],
    ['admin_note', '备注'],
  ];
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const out = [cols.map((c) => c[1]).join(',')];
  for (const r of rows) {
    out.push(
      cols
        .map((c) => cell(c[0] === 'status' ? STATUS_LABEL[r.status] || r.status : r[c[0]]))
        .join(',')
    );
  }
  // 前面加 BOM，Excel 打开中文不乱码
  return '\ufeff' + out.join('\r\n') + '\r\n';
}
