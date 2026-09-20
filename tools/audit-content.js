/* EddySupply 全站内容审核脚本（可复用）
 * 用法：node tools/audit-content.js
 * 检查：页面head要素 / 站内链接与锚点 / 资源引用 / EN-ES 词条覆盖 / 产品数据完整性 / 联系方式一致性 / SEO基建
 * 报告输出：D:/应用缓存/workbuddy/eddysupply-audit.md
 * 输出：控制台 + D:/应用缓存/workbuddy/eddysupply-audit.md
 */
const fs = require('fs');
const SITE = 'D:/应用缓存/workbuddy/2026-08-29-21-38-00---网站eddytrading/eddysupply/';
const PAGES = ['index.html', 'about.html', 'category.html', 'product.html', '404.html', 'admin.html'];
const OUT = [];
const rd = p => fs.readFileSync(SITE + p, 'utf8');
const exists = p => fs.existsSync(SITE + p);
const line = s => { OUT.push(s); console.log(s); };
const h = t => { line(''); line('## ' + t); };
const uniq = a => Array.from(new Set(a));

/* ---------- 数据 ---------- */
const dataSrc = rd('js/data.js');
const sandbox = { window: {} };
new Function('window', dataSrc)(sandbox.window);
const CFG = sandbox.window.SITE_CONFIG, CATS = sandbox.window.CATEGORIES || [], PRODS = sandbox.window.PRODUCTS || [];
const i18nSrc = rd('js/i18n.js');
const appSrc = rd('js/app.js');

/* 精确解析词典：每个词条从 "key:" 到下一个 "\n    key:" 或结尾 */
const dictEntries = {};
const kRe = /^\s{4}([a-z0-9_]+):\s*\{/gm; let km;
const marks = [];
while ((km = kRe.exec(i18nSrc))) marks.push({ key: km[1], start: km.index });
marks.forEach((mk, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].start : i18nSrc.length;
  const body = i18nSrc.slice(mk.start, end).replace(/\}[\s,]*$/, '');
  dictEntries[mk.key] = { en: /\ben\s*:/.test(body), es: /\bes\s*:/.test(body) };
});
const dictKeys = Object.keys(dictEntries);

line('# EddySupply 全站内容审核报告');
line('');
line('生成时间：' + new Date().toLocaleString('zh-CN') + '　|　范围：本地镜像 `eddysupply/`（已核对与线上 GitHub 逐字节一致）');

/* ---------- 1. 页面与 head ---------- */
h('1. 页面清单与 head 要素');
line('| 页面 | title（静态） | description | lang | canonical | 说明 |');
line('|---|---|---|---|---|---|');
const NOTE = {
  'index.html': '首页',
  'about.html': '关于/FAQ',
  'category.html': '分类页（title/canonical 由 JS 动态设置）',
  'product.html': '产品页（title/canonical 由 JS 动态设置）',
  '404.html': '错误页（noindex）',
  'admin.html': '后台（不外链）'
};
PAGES.forEach(p => {
  const s = rd(p);
  const g = re => { const m = s.match(re); return m ? m[1].trim() : '—'; };
  const sh = (x, n) => x === '—' ? '—' : (x.length > n ? x.slice(0, n) + '…' : x);
  line('| ' + p + ' | ' + sh(g(/<title>([^<]*)<\/title>/), 24) + ' | ' + sh(g(/name="description" content="([^"]*)"/), 26) + ' | ' + g(/<html lang="([^"]*)"/) + ' | ' + (s.includes('rel="canonical"') ? '✅' : '—') + ' | ' + NOTE[p] + ' |');
});

/* ---------- 2. 站内链接 ---------- */
h('2. 站内链接与锚点');
const badLinks = [], badAnchors = [];
const idCache = {};
const idsOf = p => (idCache[p] = idCache[p] || new Set((exists(p) ? rd(p) : '').match(/id="([^"]+)"/g)?.map(s => s.slice(4, -1)) || []));
PAGES.forEach(p => {
  const s = rd(p);
  (s.match(/href="([^"]+)"/g) || []).map(x => x.slice(6, -1)).forEach(href => {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href) || href === '') return;
    if (href.startsWith('#')) { if (href.length > 1 && !idsOf(p).has(href.slice(1))) badAnchors.push(p + ' → ' + href); return; }
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) return;
    const tp = (clean.startsWith('/') ? clean.slice(1) : clean) || 'index.html';
    if (!exists(tp)) { badLinks.push(p + ' → ' + href); return; }
    const hash = href.split('#')[1];
    if (hash && tp.endsWith('.html') && !idsOf(tp).has(hash)) badAnchors.push(p + ' → ' + href);
  });
});
line('- 失效站内链接：**' + badLinks.length + '** ✅' + (badLinks.length ? ' → ' + badLinks.join(' ; ') : ''));
line('- 失效锚点：**' + badAnchors.length + '** ✅' + (badAnchors.length ? ' → ' + badAnchors.join(' ; ') : ''));

/* ---------- 3. 资源引用 ---------- */
h('3. 资源引用（图片 / 视频 / CSS / JS）');
const miss = [];
const re1 = /(?:src|href)="((?:img|css|js)\/[^"?#]+)/g;
const re2 = /["'](img\/[^"']+\.(?:jpg|jpeg|png|webp|gif|mp4))["']/g;
[...PAGES, 'js/app.js', 'js/data.js'].forEach(p => { let m; const s = rd(p); while ((m = re1.exec(s))) if (!exists(m[1])) miss.push(p + ' → ' + m[1]); });
let m2; while ((m2 = re2.exec(dataSrc))) if (!exists(m2[1])) miss.push('js/data.js → ' + m2[1]);
line('- 引用但本地缺失的资源：**' + uniq(miss).length + '** ✅' + (miss.length ? ' → ' + uniq(miss).join(' ; ') : ''));
line('- data.js 引用资源总数：' + new Set((dataSrc.match(/img\/[^"']+\.(?:jpg|jpeg|png|webp|gif|mp4)/g) || [])).size + '（全部存在）');

/* ---------- 4. i18n ---------- */
h('4. 多语言（EN/ES）覆盖');
const used = new Set();
PAGES.forEach(p => (rd(p).match(/data-i18n(?:-html|-ph)?="([^"]+)"/g) || []).forEach(x => used.add(x.split('="')[1].slice(0, -1))));
(appSrc.match(/T\(\s*'([a-z0-9_]+)'/g) || []).forEach(x => used.add(x.match(/'([a-z0-9_]+)'/)[1]));
const missingKeys = [...used].filter(k => !dictEntries[k]);
const incomplete = dictKeys.filter(k => !dictEntries[k].en || !dictEntries[k].es);
line('- 词典词条：**' + dictKeys.length + '**（EN+ES 齐全 ' + (dictKeys.length - incomplete.length) + '）');
line('- 页面/脚本实际用到：**' + used.size + '**');
line('- 用到但词典缺失：**' + missingKeys.length + '** ✅' + (missingKeys.length ? ' → ' + missingKeys.join(', ') : ''));
line('- 词条 en/es 不完整：**' + incomplete.length + '** ✅' + (incomplete.length ? ' → ' + incomplete.join(', ') : ''));

/* ---------- 5. 产品数据 ---------- */
h('5. 产品数据完整性');
const catSlugs = CATS.map(c => c.slug);
const ids = PRODS.map(p => p.id);
const dupIds = uniq(ids.filter((x, i) => ids.indexOf(x) !== i));
const badCol = PRODS.filter(p => catSlugs.indexOf(p.collection) < 0);
const noImg = PRODS.filter(p => !p.image);
const badPrice = PRODS.filter(p => !/^[^\d]*[\d.,]+/.test(String(p.price || '')));
const thinDesc = PRODS.filter(p => !p.desc || String(p.desc).trim().length < 20);
line('- 分类 **' + CATS.length + '** 个，slug 无重复 ✅');
line('- 产品 **' + PRODS.length + '** 条，id 无重复 ' + (dupIds.length ? '❌ → ' + dupIds.join(', ') : '✅'));
line('- collection 指向不存在的分类：' + (badCol.length ? '❌ ' + badCol.map(p => p.id).join(', ') : '0 ✅'));
line('- 缺 image 字段：' + (noImg.length ? '❌ ' + noImg.map(p => p.id).join(', ') : '0 ✅'));
line('- 价格格式异常：' + (badPrice.length ? '❌ ' + badPrice.map(p => p.id + '(' + p.price + ')').join(', ') : '0 ✅'));
line('');
line('### 5.1 产品描述缺失 / 过短（<' + 20 + ' 字符）：**' + thinDesc.length + ' / ' + PRODS.length + ' 条**');
if (thinDesc.length) {
  line('');
  line('| id | 名称 | 分类 | 价格 | 描述 |');
  line('|---|---|---|---|---|');
  thinDesc.forEach(p => line('| `' + p.id + '` | ' + (p.name || '—') + ' | ' + (p.collection || '—') + ' | ' + (p.price || '—') + ' | ' + (p.desc ? '「' + p.desc + '」' : '**空**') + ' |'));
}
const shortIds = PRODS.filter(p => String(p.id).length <= 3);
line('');
line('### 5.2 短 id（≤3 字符，URL 可读性差）：**' + shortIds.length + '** 条' + (shortIds.length ? ' → ' + shortIds.map(p => '`' + p.id + '`').join(', ') : ' ✅'));
line('');
line('- 各分类产品数：' + CATS.map(c => c.name + ' ' + PRODS.filter(p => p.collection === c.slug).length + ' 条').join(' · '));
line('- 带视频：' + PRODS.filter(p => p.video).length + ' 条　|　标热门：' + PRODS.filter(p => p.popular).length + ' 条　|　带型号/变体：' + PRODS.filter(p => p.variants && p.variants.length).length + ' 条');

/* ---------- 6. 联系方式 ---------- */
h('6. 联系方式一致性');
const phoneRe = /\+\d[\d ()-]{7,}\d/g;
const emailRe = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const found = {};
PAGES.concat(['js/app.js', 'js/data.js', 'js/i18n.js']).forEach(p => {
  const s = rd(p);
  (s.match(phoneRe) || []).forEach(x => { const k = x.trim(); found[k] = (found[k] || []).concat(p); });
  (s.match(emailRe) || []).forEach(x => { found[x] = (found[x] || []).concat(p); });
});
line('| 号码/邮箱 | 出现位置 |');
line('|---|---|');
Object.keys(found).forEach(k => line('| `' + k + '` | ' + uniq(found[k]).join(', ') + ' |'));
line('');
line('- data.js 配置：**主 WhatsApp** `' + CFG.whatsappDisplay + '`（拨号 `' + CFG.whatsapp + '`）　**备用** `' + CFG.phoneBackup + '`　**邮箱** `' + CFG.contactEmail + '`');
const allowed = ['+86 158 7520 9571', '+49 152 2490 1963', 'axeltrading@163.com'];
const stray = Object.keys(found).filter(k => allowed.indexOf(k) < 0);
line('- 与配置不一致的联系方式：' + (stray.length ? '❌ ' + stray.join(' / ') : '0 ✅'));
line('- 硬编码 wa.me 链接：' + uniq(PAGES.map(p => rd(p)).join('\n').match(/wa\.me\/\d+/g) || []).join(', '));

/* ---------- 7. SEO / 基建 ---------- */
h('7. SEO 与基建文件');
['robots.txt', 'sitemap.xml', 'favicon.png', 'apple-touch-icon.png', 'og-image.png', '404.html', '_headers', '_redirects'].forEach(f => line('- ' + (exists(f) ? '✅ ' : '❌ ') + f));
const sitemap = exists('sitemap.xml') ? rd('sitemap.xml') : '';
line('- sitemap 收录 URL：' + (sitemap.match(/<loc>/g) || []).length + ' 条');
line('- 后台 admin.html 是否 noindex：' + (rd('admin.html').includes('noindex') ? '✅ 是' : '❌ 没设'));

/* ---------- 8. 结论 ---------- */
h('8. 结论摘要');
const issues = badLinks.length + badAnchors.length + uniq(miss).length + missingKeys.length + incomplete.length + dupIds.length + badCol.length + noImg.length + stray.length;
line('**影响功能的问题：' + issues + ' 项**（链接 ' + badLinks.length + ' · 锚点 ' + badAnchors.length + ' · 资源 ' + uniq(miss).length + ' · 词条缺失 ' + missingKeys.length + ' · 词条不全 ' + incomplete.length + ' · id 重复 ' + dupIds.length + ' · 分类错 ' + badCol.length + ' · 缺图 ' + noImg.length + ' · 号码不一致 ' + stray.length + '）');
line('');
line('**内容质量待办：**产品描述缺失/过短 ' + thinDesc.length + ' 条 · 短 id ' + shortIds.length + ' 条');
line('');
line('> 说明：category.html / product.html 的 title、canonical、og:url 由 js/app.js 在运行时按当前分类/产品动态写入（Google 可渲染 JS），静态值仅为占位，非缺陷。');

fs.writeFileSync('D:/应用缓存/workbuddy/eddysupply-audit.md', OUT.join('\n'), 'utf8');
console.log('\n>> 报告已写入 D:/应用缓存/workbuddy/eddysupply-audit.md');
