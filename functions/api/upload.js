/**
 * POST /api/upload —— 客户上传参考图 / 规格书
 *
 * 请求：multipart/form-data，字段名 file（可多个，一次最多 5 个）
 * 返回：{ ok:true, files:[{token,name,mime,size,kind,human}] }
 *
 * 设计要点：
 *   · 文件存 D1（按 512KB 分块），不依赖 R2，现有绑定即可用
 *   · 上传先落库、拿到 token；客户提交留言时把 token 带上来关联（lead_id）
 *   · 没提交的附件 48 小时后自动清掉，不占空间
 *   · 同 IP 10 分钟最多 20 个文件，防止有人拿它当免费图床
 */
import {
  json,
  nowIso,
  isoAgo,
  sha256Hex,
  ensureSchema,
  ensureFileSchema,
  fileKind,
  fileToken,
  splitChunks,
  humanSize,
  MAX_FILE_BYTES,
  MAX_FILES_PER_LEAD,
  FILE_TTL_HOURS,
} from '../_lib/leads.js';

const LIMIT_UPLOADS_PER_IP = 20;
const LIMIT_WINDOW_SEC = 600;

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) return json({ ok: false, error: 'not_configured' }, 503);

  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (ct.indexOf('multipart/form-data') === -1) {
    return json({ ok: false, error: 'expect_multipart' }, 415);
  }

  let fd;
  try {
    fd = await request.formData();
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const items = [];
  fd.forEach((v, k) => {
    if (k === 'file' && v && typeof v === 'object' && typeof v.arrayBuffer === 'function') items.push(v);
  });
  if (!items.length) return json({ ok: false, error: 'no_file' }, 422);
  if (items.length > MAX_FILES_PER_LEAD) return json({ ok: false, error: 'too_many_files' }, 422);

  // 先做本地校验，别等读进内存再拒绝
  for (const f of items) {
    if (!fileKind(f.type)) return json({ ok: false, error: 'bad_type' }, 422);
    if (Number(f.size) > MAX_FILE_BYTES) return json({ ok: false, error: 'too_large' }, 413);
  }

  try {
    await ensureSchema(env);
    await ensureFileSchema(env);

    /* ---------- 限流 + 顺手清理过期附件 ---------- */
    const ip = request.headers.get('cf-connecting-ip') || '';
    const salt = env.IP_SALT || 'eddysupply';
    const ipHash = ip ? await sha256Hex(ip + salt) : '';

    if (ipHash) {
      const hit = await env.DB.prepare(
        'SELECT COUNT(DISTINCT token) AS n FROM lead_files WHERE ip_hash = ? AND created_at > ?'
      )
        .bind(ipHash, isoAgo(LIMIT_WINDOW_SEC))
        .first();
      if (hit && Number(hit.n) >= LIMIT_UPLOADS_PER_IP) {
        return json({ ok: false, error: 'rate_limited' }, 429);
      }
    }

    try {
      await env.DB.prepare(
        'DELETE FROM lead_files WHERE lead_id = 0 AND created_at < ?'
      )
        .bind(isoAgo(FILE_TTL_HOURS * 3600))
        .run();
    } catch (e) {
      /* 清理失败不影响上传 */
    }

    /* ---------- 逐块入库 ---------- */
    const out = [];
    for (const f of items) {
      const token = fileToken();
      const buf = new Uint8Array(await f.arrayBuffer());
      const name = String(f.name || 'file').slice(0, 120);
      const mime = String(f.type || 'application/octet-stream').slice(0, 120);
      const chunks = splitChunks(buf);
      const createdAt = nowIso();

      const stmts = chunks.map((c, i) =>
        env.DB.prepare(
          'INSERT INTO lead_files (token, chunk, name, mime, size, data, created_at, lead_id, ip_hash) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
        ).bind(token, i, name, mime, buf.length, c, createdAt, ipHash)
      );
      await env.DB.batch(stmts);

      out.push({
        token: token,
        name: name,
        mime: mime,
        size: buf.length,
        kind: fileKind(mime),
        human: humanSize(buf.length),
      });
    }

    return json({ ok: true, files: out });
  } catch (e) {
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
