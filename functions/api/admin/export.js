/**
 * GET /api/admin/export —— 导出全部留言为 CSV（Excel 可直接打开）
 * 鉴权同上（x-admin-key 或 ?key=）。带 ?status= 可只导某一状态。
 */
import { clean, adminKeyOk, ensureSchema, toCsv, STATUSES } from '../_lib/leads.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!adminKeyOk(request, env)) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  if (!env.DB) {
    return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  await ensureSchema(env);

  const status = clean(new URL(request.url).searchParams.get('status'), 20);
  const useStatus = status && STATUSES.indexOf(status) > -1;

  const stmt = useStatus
    ? env.DB.prepare('SELECT * FROM leads WHERE status = ? ORDER BY id DESC')
    : env.DB.prepare('SELECT * FROM leads ORDER BY id DESC');
  const bound = useStatus ? stmt.bind(status) : stmt.bind();
  const rows = (await bound.all()).results || [];

  const now = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="leads-' + now + '.csv"',
      'cache-control': 'no-store',
    },
  });
}
