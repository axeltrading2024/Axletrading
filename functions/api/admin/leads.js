/**
 * /api/admin/leads —— 后台读取 / 更新客户留言
 *
 * 鉴权：请求头 x-admin-key，或 ?key=xxx（口令在 Pages 环境变量 ADMIN_KEY）
 *
 *   GET    /api/admin/leads?status=new&q=香水&limit=50&offset=0
 *          → { ok, total, counts:{new,contacted,...}, rows:[...] }
 *   PATCH  /api/admin/leads   body {id, status?, admin_note?}
 *   DELETE /api/admin/leads?id=123
 */
import { json, clean, adminKeyOk, ensureSchema, STATUSES } from '../../_lib/leads.js';

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

  await ensureSchema(env);

  const url = new URL(request.url);
  const status = clean(url.searchParams.get('status'), 20);
  const q = clean(url.searchParams.get('q'), 60);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 200);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

  const where = [];
  const args = [];
  if (status && STATUSES.indexOf(status) > -1) {
    where.push('status = ?');
    args.push(status);
  }
  if (q) {
    where.push('(product LIKE ? OR contact LIKE ? OR country LIKE ? OR category LIKE ? OR message LIKE ?)');
    const like = '%' + q + '%';
    args.push(like, like, like, like, like);
  }
  const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';

  const totalStmt = env.DB.prepare('SELECT COUNT(*) AS n FROM leads' + whereSql);
  const totalRow = await totalStmt.bind.apply(totalStmt, args).first();

  const listStmt = env.DB.prepare(
    'SELECT * FROM leads' + whereSql + ' ORDER BY id DESC LIMIT ? OFFSET ?'
  );
  const rows = await listStmt.bind.apply(listStmt, args.concat([limit, offset])).all();

  const countRows = await env.DB.prepare(
    'SELECT status, COUNT(*) AS n FROM leads GROUP BY status'
  ).all();

  const counts = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  ((countRows && countRows.results) || []).forEach((r) => {
    counts[r.status] = Number(r.n) || 0;
  });

  return json({
    ok: true,
    total: (totalRow && Number(totalRow.n)) || 0,
    counts: counts,
    rows: (rows && rows.results) || [],
  });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!adminKeyOk(request, env)) return unauthorized();
  if (!env.DB) return noDb();
  await ensureSchema(env);

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
    if (STATUSES.indexOf(st) === -1) return json({ ok: false, error: 'bad_status' }, 422);
    sets.push('status = ?');
    args.push(st);
  }
  if (body.admin_note != null) {
    sets.push('admin_note = ?');
    args.push(clean(body.admin_note, 600));
  }
  if (!sets.length) return json({ ok: false, error: 'nothing_to_update' }, 422);

  args.push(id);
  const stmt = env.DB.prepare('UPDATE leads SET ' + sets.join(', ') + ' WHERE id = ?');
  const res = await stmt.bind.apply(stmt, args).run();
  return json({ ok: true, changed: (res && res.meta && res.meta.changes) || 0 });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!adminKeyOk(request, env)) return unauthorized();
  if (!env.DB) return noDb();
  await ensureSchema(env);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return json({ ok: false, error: 'need_id' }, 422);

  const stmt = env.DB.prepare('DELETE FROM leads WHERE id = ?');
  const res = await stmt.bind(id).run();
  return json({ ok: true, deleted: (res && res.meta && res.meta.changes) || 0 });
}
