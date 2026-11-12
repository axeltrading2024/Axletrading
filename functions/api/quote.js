/**
 * POST /api/quote —— 记录客户在购物车里生成的报价单（清单）
 *
 * 触发时机（前端，不等结果、不阻塞跳转）：
 *   1) 客户点抽屉底部的「Pay on Alipay」→ action = 'pay'
 *   2) 付款页 pay.html 打开且带着 ?q=    → action = 'view'
 *
 * 只有清单，没有客户联系方式 —— 这本来就不是表单，是行为记录。
 * 联系方式仍然靠客户自己在 WhatsApp 里发，后台可以对着报价号回填。
 *
 * 幂等：(ref, cid) 唯一。同一个人反复点不会刷出一堆重复单，只累加 hits / pay_views。
 * 换设备则 cid 变、生成新的一条 —— 这是对的，因为它确实是另一次访问。
 */
import {
  json,
  clean,
  sha256Hex,
  isoAgo,
} from '../_lib/leads.js';
import {
  ensureQuoteSchema,
  normRef,
  normCid,
  normCurrency,
  num,
  cleanItems,
} from '../_lib/quotes.js';

const LIMIT_PER_IP = 40;      // 客户会反复点，给得比留言宽松
const LIMIT_WINDOW_SEC = 600;

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env || !env.DB) return json({ ok: false, error: 'not_configured' }, 503);

  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'bad_request' }, 400);

  const ref = normRef(body.ref);
  if (!ref) return json({ ok: false, error: 'need_ref' }, 422);

  const cid = normCid(body.cid) || 'anon';
  const action = clean(body.action, 12) === 'view' ? 'view' : 'pay';
  const items = cleanItems(body.items);
  const nItems = items.length;
  const units = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const row = {
    ref: ref,
    cid: cid,
    currency: normCurrency(body.currency),
    items_total: num(body.items_total, 100000000),
    est_total: num(body.est_total, 100000000),
    n_items: nItems,
    units: units,
    items_json: JSON.stringify(items).slice(0, 20000),
    country: clean(body.country, 8).toUpperCase(),
    lang: clean(body.lang, 8),
    page: clean(body.page, 200),
    referrer: clean(body.referrer, 300),
    ua: clean(request.headers.get('user-agent'), 300),
    ip_hash: '',
  };

  try {
    await ensureQuoteSchema(env);

    /* 限流：只挡明显刷接口的，正常客户点几十次也不会碰到 */
    const ip = request.headers.get('cf-connecting-ip') || '';
    if (ip) {
      row.ip_hash = await sha256Hex(ip + (env.IP_SALT || 'eddysupply'));
      const hit = await env.DB.prepare(
        'SELECT COUNT(*) AS n FROM quotes WHERE ip_hash = ? AND updated_at > ?'
      )
        .bind(row.ip_hash, isoAgo(LIMIT_WINDOW_SEC))
        .first();
      /* 注意：这里统计的是「条数」而不是「点击次数」，同一张单反复点不会累加条数 */
      if (hit && Number(hit.n) >= LIMIT_PER_IP) {
        return json({ ok: false, error: 'rate_limited' }, 429);
      }
    }

    const now = new Date().toISOString();
    const existing = await env.DB.prepare(
      'SELECT id FROM quotes WHERE ref = ? AND cid = ?'
    )
      .bind(row.ref, row.cid)
      .first();

    if (existing && existing.id) {
      const sets = ['updated_at = ?', 'hits = hits + 1'];
      const args = [now];
      if (action === 'view') {
        sets.push('pay_views = pay_views + 1');
      }
      /* 清单和金额以最新一次为准：客户改了数量再来，金额要跟着变 */
      if (nItems) {
        sets.push('items_json = ?', 'n_items = ?', 'units = ?');
        args.push(row.items_json, row.n_items, row.units);
      }
      if (row.items_total) {
        sets.push('items_total = ?');
        args.push(row.items_total);
      }
      if (row.est_total) {
        sets.push('est_total = ?', 'currency = ?');
        args.push(row.est_total, row.currency);
      }
      if (row.country) {
        sets.push('country = ?');
        args.push(row.country);
      }
      args.push(existing.id);
      const upStmt = env.DB.prepare('UPDATE quotes SET ' + sets.join(', ') + ' WHERE id = ?');
      await upStmt.bind.apply(upStmt, args).run();
      return json({ ok: true, id: existing.id, updated: true });
    }

    const cols = [
      'ref', 'cid', 'created_at', 'updated_at', 'status', 'currency',
      'items_total', 'est_total', 'n_items', 'units', 'items_json',
      'country', 'lang', 'page', 'referrer', 'ua', 'ip_hash', 'hits', 'pay_views',
    ];
    const vals = [
      row.ref, row.cid, now, now, 'new', row.currency,
      row.items_total, row.est_total, row.n_items, row.units, row.items_json,
      row.country, row.lang, row.page, row.referrer, row.ua, row.ip_hash,
      1, action === 'view' ? 1 : 0,
    ];
    const sql =
      'INSERT INTO quotes (' + cols.join(',') + ') VALUES (' + cols.map(() => '?').join(',') + ')';
    const stmt = env.DB.prepare(sql);
    const out = await stmt.bind.apply(stmt, vals).run();
    return json({ ok: true, id: (out && out.meta && out.meta.last_row_id) || 0 });
  } catch (e) {
    /* 并发下唯一索引可能抢先插入，这里退化成更新，不报错给前端 */
    try {
      await env.DB.prepare('UPDATE quotes SET updated_at = ?, hits = hits + 1 WHERE ref = ? AND cid = ?')
        .bind(new Date().toISOString(), row.ref, row.cid)
        .run();
      return json({ ok: true, id: 0, updated: true });
    } catch (e2) {
      return json({ ok: false, error: 'server_error' }, 500);
    }
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
