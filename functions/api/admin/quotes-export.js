/**
 * GET /api/admin/quotes-export —— 导出报价单 CSV（Excel 可直接打开）
 *
 *   ?mode=detail  一行一个品项（默认，方便导进订单管理 / ERP）
 *   ?mode=summary 一行一张报价单
 *   ?status=new   只导某一状态
 *   ?days=30      只导最近 N 天
 *
 * 鉴权同后台：x-admin-key 或 ?key=（下载链接里用 ?key= 更方便）
 */
import { adminKeyOk } from '../../_lib/leads.js';
import {
  ensureQuoteSchema,
  quotesDetailCsv,
  quotesSummaryCsv,
  QUOTE_STATUSES,
} from '../../_lib/quotes.js';

function err(error, status) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status: status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!adminKeyOk(request, env)) return err('unauthorized', 401);
  if (!env.DB) return err('not_configured', 503);
  await ensureQuoteSchema(env);

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') === 'summary' ? 'summary' : 'detail';
  const status = (url.searchParams.get('status') || '').trim();
  const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 0, 0), 365);

  const where = [];
  const args = [];
  if (status && QUOTE_STATUSES.indexOf(status) > -1) {
    where.push('status = ?');
    args.push(status);
  }
  if (days) {
    where.push('created_at > ?');
    args.push(new Date(Date.now() - days * 86400000).toISOString());
  }
  const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';

  const stmt = env.DB.prepare('SELECT * FROM quotes' + whereSql + ' ORDER BY id DESC');
  const bound = args.length ? stmt.bind.apply(stmt, args) : stmt.bind();
  const rows = (await bound.all()).results || [];

  const csv = mode === 'summary' ? quotesSummaryCsv(rows) : quotesDetailCsv(rows);
  const now = new Date().toISOString().slice(0, 10);
  const name = 'quotes-' + mode + '-' + now + '.csv';

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="' + name + '"',
      'cache-control': 'no-store',
    },
  });
}
