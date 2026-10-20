/**
 * GET /api/admin/file?token=xxx&key=后台口令[&dl=1]
 *
 * 把 D1 里按块存的附件拼回完整文件返回。
 * 鉴权跟后台一致（x-admin-key 或 ?key=），所以后台的 <img src> / <a href> 都能直接用。
 * 图片默认 inline 预览，加 dl=1 强制下载；非图片一律 attachment。
 */
import { adminKeyOk, ensureFileSchema, normToken } from '../../_lib/leads.js';

function text(msg, status) {
  return new Response(msg, {
    status: status || 400,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.DB) return text('not configured', 503);
  if (!adminKeyOk(request, env)) return text('unauthorized', 401);

  const url = new URL(request.url);
  const token = normToken(url.searchParams.get('token'));
  if (!token) return text('bad request', 400);
  const forceDl = url.searchParams.get('dl') === '1';

  try {
    await ensureFileSchema(env);
  } catch (e) {
    return text('server error', 500);
  }

  const meta = await env.DB.prepare(
    'SELECT name, mime, size FROM lead_files WHERE token = ? ORDER BY chunk LIMIT 1'
  )
    .bind(token)
    .first();
  if (!meta) return text('not found', 404);

  const rows = await env.DB.prepare('SELECT data FROM lead_files WHERE token = ? ORDER BY chunk')
    .bind(token)
    .all();
  const parts = ((rows && rows.results) || []).map((r) => new Uint8Array(r.data));

  const total = parts.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    buf.set(p, at);
    at += p.length;
  }

  const mime = String(meta.mime || 'application/octet-stream');
  const isImg = mime.indexOf('image/') === 0;
  const name = String(meta.name || 'file').replace(/["\r\n]/g, '_');
  const ascii = name.replace(/[^\x20-\x7e]/g, '_');

  return new Response(buf, {
    status: 200,
    headers: {
      'content-type': mime,
      'content-length': String(total),
      'cache-control': 'private, max-age=300',
      'content-disposition':
        (isImg && !forceDl ? 'inline' : 'attachment') +
        '; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(name),
      'x-content-type-options': 'nosniff',
    },
  });
}
