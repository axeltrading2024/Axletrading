/**
 * functions/_lib/quotes.js —— 网站报价单（购物车清单）的存储与导出
 *
 * 为什么要有这张表：
 *   以前网站是纯静态的，客户在购物车拼的清单只存在他自己浏览器里。
 *   链接发出去、客户点没点、要不要货 —— 商家这边完全不知道。
 *   这张表把「客户点了 Pay on Alipay」这件事落库，后台就能查看 / 筛选 / 导出。
 *
 * 设计要点：
 *   · ref    = 清单指纹（前端 Q-YYYYMMDD-XXXX），同一份清单同一天永远同号
 *   · cid    = 浏览器匿名 ID（localStorage），用来区分「不同的人拼了同一份清单」
 *   · 唯一键 (ref, cid)：同一个人反复点不会刷出一堆重复单，只累加 hits
 *   · items_json 存整份清单快照，商品下架也不会丢
 */

import { clean, nowIso, json } from './leads.js';

export const QUOTE_STATUSES = ['new', 'quoted', 'won', 'lost'];

export const QUOTE_STATUS_LABEL = {
  new: '新清单',
  quoted: '已报价',
  won: '已成交',
  lost: '已放弃',
};

/* ---------------- 建表 ---------------- */

let schemaReady = null;

export async function ensureQuoteSchema(env) {
  if (!env || !env.DB) throw new Error('no_db');
  if (!schemaReady) {
    schemaReady = (async () => {
      await env.DB.exec(
        'CREATE TABLE IF NOT EXISTS quotes (' +
          'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
          "ref TEXT NOT NULL DEFAULT ''," +
          "cid TEXT NOT NULL DEFAULT ''," +
          "created_at TEXT NOT NULL," +
          "updated_at TEXT NOT NULL," +
          "status TEXT NOT NULL DEFAULT 'new'," +
          "currency TEXT NOT NULL DEFAULT 'USD'," +
          'items_total REAL NOT NULL DEFAULT 0,' +
          'est_total REAL NOT NULL DEFAULT 0,' +
          'n_items INTEGER NOT NULL DEFAULT 0,' +
          'units INTEGER NOT NULL DEFAULT 0,' +
          "items_json TEXT NOT NULL DEFAULT '[]'," +
          "country TEXT NOT NULL DEFAULT ''," +
          "lang TEXT NOT NULL DEFAULT ''," +
          "page TEXT NOT NULL DEFAULT ''," +
          "referrer TEXT NOT NULL DEFAULT ''," +
          "ua TEXT NOT NULL DEFAULT ''," +
          "ip_hash TEXT NOT NULL DEFAULT ''," +
          'hits INTEGER NOT NULL DEFAULT 1,' +
          'pay_views INTEGER NOT NULL DEFAULT 0,' +
          "admin_note TEXT NOT NULL DEFAULT ''" +
          ')'
      );
      await env.DB.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_key ON quotes(ref, cid)');
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at)');
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)');
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_quotes_ip ON quotes(ip_hash)');
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

/* ---------------- 入参清洗 ---------------- */

/** 报价号只允许 Q-YYYYMMDD-XXXX 这类安全字符，防止有人往里塞脚本或超长串 */
export function normRef(v) {
  const s = String(v || '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9\-_]{3,39}$/.test(s)) return '';
  return s;
}

/** 浏览器匿名 ID：只留十六进制/短横线 */
export function normCid(v) {
  return String(v || '').replace(/[^a-z0-9\-]/gi, '').slice(0, 40).toLowerCase();
}

export function normCurrency(v) {
  const s = String(v || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(s) ? s : 'USD';
}

export function num(v, max) {
  const n = Number(v);
  if (!isFinite(n) || n < 0) return 0;
  const lim = max == null ? 100000000 : max;
  return Math.round(Math.min(n, lim) * 100) / 100;
}

/** 清单条目：只留需要的字段，剪断超长值 */
export function cleanItems(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const it of raw.slice(0, 60)) {
    if (!it || typeof it !== 'object') continue;
    const name = clean(it.name, 160);
    if (!name) continue;
    out.push({
      name: name,
      variant: clean(it.variant, 80),
      brand: clean(it.brand, 60),
      model: clean(it.model, 60),
      qty: Math.max(1, Math.min(Number(it.qty) || 1, 100000)),
      price: clean(it.price, 30),
      id: clean(it.id, 80),
    });
  }
  return out;
}

/* ---------------- CSV ---------------- */

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** 汇总表：一行 = 一张报价单 */
export function quotesSummaryCsv(rows) {
  const head = [
    '报价号', '时间', '更新时间', '状态', '币种',
    '商品小计', '估算总额', '品项数', '总件数',
    '目的国', '查看次数', '付款页打开', '清单', '备注',
  ];
  const out = [head.join(',')];
  for (const r of rows) {
    let items = [];
    try { items = JSON.parse(r.items_json || '[]'); } catch (e) {}
    const list = items
      .map((it) => (it.qty || 1) + '× ' + it.name + (it.variant ? ' (' + it.variant + ')' : ''))
      .join(' | ');
    out.push([
      r.ref,
      r.created_at,
      r.updated_at,
      QUOTE_STATUS_LABEL[r.status] || r.status,
      r.currency,
      r.items_total,
      r.est_total,
      r.n_items,
      r.units,
      r.country,
      r.hits,
      r.pay_views,
      list,
      r.admin_note,
    ].map(csvCell).join(','));
  }
  return '\ufeff' + out.join('\r\n') + '\r\n';
}

/** 明细表：一行 = 一个品项（直接往订单/ERP 里导） */
export function quotesDetailCsv(rows) {
  const head = [
    '报价号', '时间', '状态', '币种', '序号',
    '产品名称', '规格', '品牌', '型号', '数量', '单价', '行小计', '产品ID',
  ];
  const out = [head.join(',')];
  for (const r of rows) {
    let items = [];
    try { items = JSON.parse(r.items_json || '[]'); } catch (e) {}
    if (!items.length) {
      out.push([
        r.ref, r.created_at, QUOTE_STATUS_LABEL[r.status] || r.status,
        r.currency, '', '(清单为空)', '', '', '', '', '', '', '',
      ].map(csvCell).join(','));
      continue;
    }
    items.forEach((it, i) => {
      const pv = numberFromPrice(it.price);
      out.push([
        r.ref,
        r.created_at,
        QUOTE_STATUS_LABEL[r.status] || r.status,
        r.currency,
        i + 1,
        it.name,
        it.variant,
        it.brand,
        it.model,
        it.qty,
        it.price,
        pv == null ? '' : Math.round(pv * it.qty * 100) / 100,
        it.id,
      ].map(csvCell).join(','));
    });
  }
  return '\ufeff' + out.join('\r\n') + '\r\n';
}

/** 从 "€12.50" / "$18" 这种字符串里取数字 */
export function numberFromPrice(s) {
  const m = String(s == null ? '' : s).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return isFinite(n) ? n : null;
}

export { json };
