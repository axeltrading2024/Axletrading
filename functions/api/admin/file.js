/**
 * GET /api/admin/file?token=xxx&key=后台口令[&dl=1][&thumb=1]
 *
 * 把 D1 里按块存的附件拼回完整文件返回。
 * 鉴权跟后台一致（x-admin-key 或 ?key=），所以后台的 <img src> / <a href> 都能直接用。
 * 图片默认 inline 预览，加 dl=1 强制下载；非图片一律 attachment。
 * 加 thumb=1 只取缩略图（chunk = -1，约 20KB），后台列表用这个，省流量不卡。
 */
import { adminKeyOk, ensureFileSchema, normToken, THUMB_CHUNK } from '../../_lib/leads.js';

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
  const wantThumb = url.searchParams.get('thumb') === '1';

  try {
    await ensureFileSchema(env);
  } catch (e) {
    return text('server error', 500);
  }

  // 缩略图是单独一行（chunk = -1），直接取；否则取分块正文（chunk >= 0）
  if (wantThumb) {
    const trow = await env.DB.prepare(
      'SELECT data, mime FROM lead_files WHERE token = ? AND chunk = ?'
    )
      .bind(token, THUMB_CHUNK)
      .first();
    if (!trow || trow.data == null) return text('not found', 404);
    const tu8 = trow.data instanceof ArrayBuffer ? new Uint8Array(trow.data) : new Uint8Array(trow.data);
    return new Response(new Blob([tu8], { type: 'image/jpeg' }), {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'private, max-age=3600',
        'x-content-type-options': 'nosniff',
      },
    });
  }

  const meta = await env.DB.prepare(
    'SELECT name, mime, size FROM lead_files WHERE token = ? AND chunk >= 0 ORDER BY chunk LIMIT 1'
  )
    .bind(token)
    .first();
  if (!meta) return text('not found', 404);

  // 先只取块序号（很小），再逐块取内容：
  // 一次性 SELECT 多行 BLOB 在 D1 上容易拖长响应，分块取更稳。
  const idx = await env.DB.prepare('SELECT chunk FROM lead_files WHERE token = ? AND chunk >= 0 ORDER BY chunk')
    .bind(token)
    .all();
  const chunks = ((idx && idx.results) || []).map((r) => Number(r.chunk));
  if (!chunks.length) return text('not found', 404);

  const parts = [];
  let total = 0;
  for (const c of chunks) {
    const row = await env.DB.prepare('SELECT data FROM lead_files WHERE token = ? AND chunk = ?')
      .bind(token, c)
      .first();
    if (!row || row.data == null) continue;
    const u8 = row.data instanceof ArrayBuffer ? new Uint8Array(row.data) : new Uint8Array(row.data);
    parts.push(u8);
    total += u8.length;
  }
  if (!total) return text('not found', 404);

  const mime = String(meta.mime || 'application/octet-stream');
  const isImg = mime.indexOf('image/') === 0;
  const name = String(meta.name || 'file').replace(/["\r\n]/g, '_');
  const ascii = name.replace(/[^\x20-\x7e]/g, '_');

  return new Response(new Blob(parts, { type: mime }), {
    status: 200,
    headers: {
      'content-type': mime,
      'cache-control': 'private, max-age=300',
      'content-disposition':
        (isImg && !forceDl ? 'inline' : 'attachment') +
        '; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(name),
      'x-content-type-options': 'nosniff',
    },
  });
}
