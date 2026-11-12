/**
 * /api/admin/quotes —— 后台查看 / 修改网站报价单
 *
 * 鉴权：x-admin-key 或 ?key=（口令在 Pages 环境变量 ADMIN_KEY，和客户留言共用）
 *
 *   GET    /api/admin/quotes?status=new&q=AirPods&limit=20&offset=0
 *          → { ok, total, counts:{new,quoted,won,lost}, sum:{...}, rows:[...] }
 *   PATCH  /api/admin/quotes   body {id, status?, admin_note?}
 *   DELETE /api/admin/quotes?id=123
 */
import { json, clean, adminKeyOk } from '../../_lib/leads.js';
import { ensureQuoteSchema, QUOTE_STATUSES } from '../../_lib/quotes.js';

function unauthorized() {
  return json({ ok: false, error: 'unauthorized' }, 401);
}
function noDb() {
  return json({ ok: false, error: 'not_configured' }, 503);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!adminKeyOk(request, env)) return unauthorized();
  if (!env.DB) return noDb();
  await ensureQuoteSchema(env);

  const url = new URL(request.url);
  const status = clean(url.searchParams.get('status'), 20);
  const q = clean(url.searchParams.get('q'), 60);
  const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 0, 0), 365);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 200);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

  const where = [];
  const args = [];
  if (status && QUOTE_STATUSES.indexOf(status) > -1) {
    where.push('status = ?');
    args.push(status);
  }
  if (q) {
    where.push('(ref LIKE ? OR items_json LIKE ? OR country LIKE ? OR admin_note LIKE ?)');
    const like = '%' + q + '%';
    args.push(like, like, like, like);
  }
  if (days) {
    where.push('created_at > ?');
    args.push(new Date(Date.now() - days * 86400000).toISOString());
  }
  const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';

  const totalStmt = env.DB.prepare('SELECT COUNT(*) AS n FROM quotes' + whereSql);
  const totalRow = await totalStmt.bind.apply(totalStmt, args).first();

  /* 列表不返回 items_json 全量会太大，但每单最多 60 条也还好；
     这里照常返回，后台展开时直接用，省一次请求。 */
  const listStmt = env.DB.prepare(
    'SELECT * FROM quotes' + whereSql + ' ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?'
  );
  const rows = await listStmt.bind.apply(listStmt, args.concat([limit, offset])).all();

  /* 状态计数（不带搜索条件，反映整体盘子） */
  const countRows = await env.DB.prepare(
    'SELECT status, COUNT(*) AS n FROM quotes GROUP BY status'
  ).all();
  const counts = { new: 0, quoted: 0, won: 0, lost: 0 };
  ((countRows && countRows.results) || []).forEach((r) => {
    counts[r.status] = Number(r.n) || 0;
  });

  /* 金额统计：按币种分开算，不混在一起 */
  const sumRows = await env.DB.prepare(
    "SELECT currency, status, COUNT(*) AS n, SUM(est_total) AS amt FROM quotes " +
      "WHERE status != 'lost' GROUP BY currency, status"
  ).all();
  const sums = {};
  ((sumRows && sumRows.results) || []).forEach((r) => {
    const cur = r.currency || 'USD';
    (sums[cur] || (sums[cur] = { n: 0, amount: 0, won_n: 0, won_amount: 0 }));
    sums[cur].n += Number(r.n) || 0;
    sums[cur].amount += Number(r.amt) || 0;
    if (r.status === 'won') {
      sums[cur].won_n += Number(r.n) || 0;
      sums[cur].won_amount += Number(r.amt) || 0;
    }
  });

  /* 今天新增（按服务器 UTC 算，后台显示时再转本地） */
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayRow = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM quotes WHERE created_at >= ?'
  )
    .bind(todayIso)
    .first();

  return json({
    ok: true,
    total: (totalRow && Number(totalRow.n)) || 0,
    today: (todayRow && Number(todayRow.n)) || 0,
    counts: counts,
    sums: sums,
    rows: (rows && rows.results) || [],
  });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!adminKeyOk(request, env)) return unauthorized();
  if (!env.DB) return noDb();
  await ensureQuoteSchema(env);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const id = Number(body && body.id);
  if (!id) return json({ ok: false, error: 'need_id' }, 422);

  const sets = [];
  const args = [];
  if (body.status != null) {
    const st = clean(body.status, 20);
    if (QUOTE_STATUSES.indexOf(st) === -1) return json({ ok: false, error: 'bad_status' }, 422);
    sets.push('status = ?');
    args.push(st);
  }
  if (body.admin_note != null) {
    sets.push('admin_note = ?');
    args.push(clean(body.admin_note, 600));
  }
  if (!sets.length) return json({ ok: false, error: 'nothing_to_update' }, 422);

  args.push(id);
  const stmt = env.DB.prepare('UPDATE quotes SET ' + sets.join(', ') + ' WHERE id = ?');
  const res = await stmt.bind.apply(stmt, args).run();
  return json({ ok: true, changed: (res && res.meta && res.meta.changes) || 0 });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!adminKeyOk(request, env)) return unauthorized();
  if (!env.DB) return noDb();
  await ensureQuoteSchema(env);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return json({ ok: false, error: 'need_id' }, 422);

  const stmt = env.DB.prepare('DELETE FROM quotes WHERE id = ?');
  const res = await stmt.bind(id).run();
  return json({ ok: true, deleted: (res && res.meta && res.meta.changes) || 0 });
}
