/**
 * tools/assistant-smoke.js —— 自动接待挂件冒烟测试
 *
 * 零依赖（不需要 jsdom / 浏览器）：只测 js/kb.js 的意图匹配与文案完整性，
 * 这是挂件最容易出错、也最值得回归的部分（改关键词、删答案都会在这里暴露）。
 *
 * 用法：node tools/assistant-smoke.js
 */
const path = require('path');

const KB = require(path.join(__dirname, '..', 'js', 'kb.js'));

let pass = 0;
let fail = 0;

function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log('  PASS  ' + name);
  } else {
    fail++;
    console.log('  FAIL  ' + name + (extra ? '  → ' + extra : ''));
  }
}

console.log('\n=== 自动接待挂件 · 冒烟测试 (kb v' + KB.version + ') ===\n');

/* ---- 1. 意图匹配：查询 → 期望意图 ---- */
console.log('[意图匹配]');
const CASES = [
  ['what do you sell', 'catalog'],
  ['do you have watches', 'catalog'],
  ['有哪些产品', 'catalog'],
  ['min order quantity', 'pricing'],
  ['how much is 100 pcs', 'pricing'],
  ['起订量是多少', 'pricing'],
  ['shipping to usa', 'shipping'],
  ['how long does sea freight take', 'shipping'],
  ['运费怎么算', 'shipping'],
  ['payment methods', 'payment'],
  ['can i pay by paypal', 'payment'],
  ['my item arrived damaged', 'aftersales'],
  ['i want a refund', 'aftersales'],
  ['do you do oem', 'custom'],
  ['custom logo on packaging', 'custom'],
  ['定制', 'custom'],
  ['do you offer dropshipping', 'dropship'],
  ['一件代发', 'dropship'],
  ['whatsapp number please', 'contact'],
  ['人工客服', 'contact'],
];
CASES.forEach(([q, want]) => {
  const m = KB.match(q);
  ok(`"${q}" → ${want}`, !!m && m.id === want, m ? `实际 ${m.id}` : '没匹配上');
});

/* ---- 2. 兜底：听不懂的输入不能瞎答 ---- */
console.log('\n[兜底]');
['', '   ', '???', 'hi', 'asdf qwer zxcv', '😀🎉'].forEach((q) => {
  ok(`"${q || '(空)'}" 不乱匹配`, KB.match(q) === null, '不该有匹配结果');
});

/* ---- 3. 快捷问题必须都能落到意图上 ---- */
console.log('\n[快捷问题]');
const intentIds = new Set(KB.intents.map((i) => i.id));
KB.quickReplies.forEach((q) => {
  ok(`快捷「${q.label.en}」有对应意图`, intentIds.has(q.id), `找不到 intent: ${q.id}`);
  const intent = KB.intents.find((i) => i.id === q.id);
  ok(`快捷「${q.label.en}」答案非空`, !!(intent && intent.answer && intent.answer.en));
});

/* ---- 4. 文案完整性：中英双语都得有，且不能是空壳 ---- */
console.log('\n[文案完整性]');
KB.intents.forEach((i) => {
  ok(`${i.id} 有英文答案`, !!(i.answer && i.answer.en && i.answer.en.length > 80));
  ok(`${i.id} 有西语答案`, !!(i.answer && i.answer.es && i.answer.es.length > 80));
  ok(`${i.id} 有关键词`, Array.isArray(i.keywords) && i.keywords.length >= 4);
});
ok('fallback 有中/英/西三语', !!(KB.fallback.en && KB.fallback.es));
ok('联系信息齐全', !!(KB.contact.whatsapp && KB.contact.email && KB.contact.hours));

/* ---- 5. 联络方式必须和站点 SITE_CONFIG 对得上（防止两处口径分叉） ---- */
console.log('\n[与站点口径一致性]');
try {
  const dataWindow = {};
  global.window = dataWindow;
  require(path.join(__dirname, '..', 'js', 'data.js'));
  const CFG = dataWindow.SITE_CONFIG;
  /* 挂件的「转人工」是另一条线（Eddy 2026-10-28 指定 +86 158 7520 9571），
     与站点询盘主号（+49）刻意不同，所以这里不做相等断言，只固定住 +86 这个值。 */
  ok('挂件转人工号码 = +86 158 7520 9571', KB.contact.whatsapp === '8615875209571', KB.contact.whatsapp);
  ok('挂件显示号与号码一致', KB.contact.whatsappDisplay === '+86 158 7520 9571', KB.contact.whatsappDisplay);
  ok('挂件转人工号码与站点询盘主号是两条线（刻意不同）',
    KB.contact.whatsapp !== (CFG.whatsappInquiry || CFG.whatsapp),
    `KB ${KB.contact.whatsapp} / site ${CFG.whatsappInquiry || CFG.whatsapp}`);
  ok('邮箱与 data.js 一致', KB.contact.email === CFG.contactEmail,
    `KB ${KB.contact.email} vs site ${CFG.contactEmail}`);
  ok('品牌名与 data.js 一致', KB.brand.name === CFG.brand, `KB ${KB.brand.name} vs site ${CFG.brand}`);
} catch (e) {
  ok('读取 data.js 成功', false, e.message);
}

/* ---- 6. 定制 / Dropshipping 的关键口径不能被改丢 ---- */
console.log('\n[定制与 Dropshipping 口径]');
const customIntent = KB.intents.find((i) => i.id === 'custom');
const dropIntent = KB.intents.find((i) => i.id === 'dropship');
ok('定制答案提到起订量', /minimum quantity/i.test(customIntent.answer.en));
ok('定制答案提到模具费', /mould|mold/i.test(customIntent.answer.en));
ok('定制答案提到打样周期', /sampl/i.test(customIntent.answer.en));
ok('定制答案未编造具体数字', !/\d+\s*(pcs|usd|\$|€)/i.test(customIntent.answer.en));
ok('Dropshipping 答案说明支持一件代发', /one-piece/i.test(dropIntent.answer.en));
ok('Dropshipping 答案说明支持无痕发货', /blind shipping/i.test(dropIntent.answer.en));
ok('Dropshipping 答案说明 MOQ 与批发相同', /MOQ is the same/i.test(dropIntent.answer.en));
ok('Dropshipping 答案说明运费与批发相同', /shipping rates are the same/i.test(dropIntent.answer.en));
ok('Dropshipping 答案说明售后由客户先处理、质量问题转交', /escalate/i.test(dropIntent.answer.en));

/* ---- 汇总 ---- */
console.log('\n--------------------------------');
console.log(`通过 ${pass} · 失败 ${fail}`);
if (fail) {
  console.log('\n❌ 有用例没过，先别发布。');
  process.exit(1);
} else {
  console.log('\n✅ 全部通过，可以进下一步。');
}
