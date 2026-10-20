/**
 * POST /api/inquiry —— 接收「找不到想要的？告诉我们」表单
 *
 * 防垃圾三重：
 *   1) 蜜罐字段 company（真人看不见，机器人会填）→ 静默丢弃，返回成功，不给对方试探的机会
 *   2) 时间陷阱：表单渲染到提交 < 1.5 秒 → 丢弃
 *   3) 同 IP 10 分钟最多 5 条（IP 只存哈希，不存明文）
 *
 * 环境变量：
 *   DB（D1 绑定，必需） / IP_SALT（可选，加盐哈希）
 *   RESEND_API_KEY + NOTIFY_TO（可选，新留言发邮件）
 */
import {
  json,
  clean,
  looksLikeContact,
  sha256Hex,
  nowIso,
  isoAgo,
  ensureSchema,
  notifyByEmail,
} from '../_lib/leads.js';

const LIMIT_PER_IP = 5;
const LIMIT_WINDOW_SEC = 600;

export async function onRequestPost(context) {
  const request = context.request;
  const env = context.env || {};

  /* ---------- 1. 解析表单 ---------- */
  let body = null;
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.indexOf('application/json') > -1) {
      body = await request.json();
    } else {
      const fd = await request.formData();
      body = {};
      fd.forEach((v, k) => {
        body[k] = typeof v === 'string' ? v : '';
      });
    }
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'bad_request' }, 400);

  /* ---------- 2. 蜜罐 + 时间陷阱 ---------- */
  if (clean(body.company, 80)) return json({ ok: true, id: 0 });
  const ts = Number(body.ts || 0);
  if (!ts || Date.now() - ts < 1500) return json({ ok: true, id: 0 });

  /* ---------- 3. 校验 ---------- */
  const product = clean(body.product, 1200);
  const contact = clean(body.contact, 120);
  if (product.length < 2) return json({ ok: false, error: 'need_product' }, 422);
  if (!looksLikeContact(contact)) return json({ ok: false, error: 'need_contact' }, 422);

  const contactType = clean(body.contact_type, 20) === 'email' ? 'email' : 'whatsapp';
  const lead = {
    created_at: nowIso(),
    status: 'new',
    name: clean(body.name, 80),
    contact_type: contactType,
    contact: contact,
    country: clean(body.country, 60),
    category: clean(body.category, 60),
    product: product,
    ref_url: clean(body.ref_url, 400),
    qty: clean(body.qty, 40),
    target_price: clean(body.target_price, 40),
    message: clean(body.message, 2000),
    lang: clean(body.lang, 8),
    page: clean(body.page, 200),
    referrer: clean(body.referrer, 300),
    ua: clean(request.headers.get('user-agent'), 300),
    ip_hash: '',
    admin_note: '',
  };

  /* ---------- 4. 未绑定数据库时的兜底 ----------
     Pages 项目还没配 D1 时返回 503，前端会自动退回到「WhatsApp 直接发」
     的备用按钮，保证客户不会卡在这里。 */
  if (!env.DB) {
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  try {
    await ensureSchema(env);

    /* ---------- 5. 限流 ---------- */
    const ip = request.headers.get('cf-connecting-ip') || '';
    if (ip) {
      lead.ip_hash = await sha256Hex(ip + (env.IP_SALT || 'eddysupply'));
      const hit = await env.DB.prepare(
        'SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ? AND created_at > ?'
      )
        .bind(lead.ip_hash, isoAgo(LIMIT_WINDOW_SEC))
        .first();
      if (hit && Number(hit.n) >= LIMIT_PER_IP) {
        return json({ ok: false, error: 'rate_limited' }, 429);
      }
    }

    /* ---------- 6. 入库 ---------- */
    const cols = [
      'created_at', 'status', 'name', 'contact_type', 'contact', 'country', 'category',
      'product', 'ref_url', 'qty', 'target_price', 'message', 'lang', 'page', 'referrer', 'ua', 'ip_hash',
    ];
    const stmt = env.DB.prepare(
      'INSERT INTO leads (' + cols.join(',') + ') VALUES (' + cols.map(() => '?').join(',') + ')'
    );
    const out = await stmt.bind.apply(stmt, cols.map((c) => lead[c])).run();
    const id = (out && out.meta && out.meta.last_row_id) || 0;

    try {
      await notifyByEmail(env, lead);
    } catch (e) {
      /* 邮件失败不影响留言保存 */
    }

    return json({ ok: true, id: id });
  } catch (e) {
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
