/**
 * tools/assistant-dom-smoke.js —— 自动接待挂件「真 DOM」冒烟测试
 *
 * 与 assistant-smoke.js 的分工：
 *   · assistant-smoke.js  —— 零依赖，测知识库/意图匹配
 *   · 本文件             —— 用 jsdom 真跑一遍挂件，测挂载、交互、留资提交
 *
 * 用途：改 kb.js 的答案、改 assistant.js 的 DOM 结构、改 /api/inquiry 的字段契约，
 *       都能在这里第一时间炸出来。
 *
 * 用法：
 *   node tools/assistant-dom-smoke.js
 *   （需要 jsdom：npm i jsdom；没装会自动跳过，不算失败）
 */
const fs = require('fs');
const path = require('path');

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  console.log('\n⚠️  未安装 jsdom，跳过真 DOM 测试。');
  console.log('    需要时执行：npm i jsdom\n');
  process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 轮询等某个选择器出现（jsdom 里 DOMContentLoaded 可能比断言晚） */
async function waitFor(doc, sel, ms) {
  const end = Date.now() + (ms || 3000);
  while (Date.now() < end) {
    const n = doc.querySelector(sel);
    if (n) return n;
    await sleep(50);
  }
  return null;
}

(async function run() {
  console.log('\n=== 自动接待挂件 · 真 DOM 冒烟测试 ===\n');

  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    runScripts: 'dangerously',
    url: 'http://127.0.0.1:8123/',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const doc = window.document;

  /* 把页面里的 JS 报错抓出来，别让它悄悄挂掉 */
  const jsErrors = [];
  window.addEventListener('error', (e) => jsErrors.push(String(e.message || e.error)));

  /* 抓 fetch 调用，模拟 /api/inquiry 成功 */
  const calls = [];
  window.fetch = function (url, opts) {
    calls.push({ url: url, opts: opts, body: JSON.parse(opts.body) });
    return Promise.resolve({ status: 200, json: () => Promise.resolve({ ok: true, id: 1 }) });
  };

  /* 站点数据 → SITE_CONFIG，挂件会读它拿 WhatsApp 号 */
  window.eval(read('js/data.js'));
  window.eval(read('js/kb.js'));
  window.eval(read('js/assistant.js'));

  /* ---- 1. 挂载 ---- */
  console.log('[挂载]');
  const root = await waitFor(doc, '.asst-root', 4000);
  ok('挂件根节点已插入', !!root);
  ok('运行期无 JS 报错', jsErrors.length === 0, jsErrors.join(' | '));
  if (!root) {
    console.log('\n挂件没挂上，后续用例跳过。请检查 jsErrors。\n');
    process.exit(1);
  }
  ok('触发气泡存在', !!doc.querySelector('.asst-fab'));
  ok('对话面板存在', !!doc.querySelector('.asst-panel'));
  ok('面板默认收起', !doc.querySelector('.asst-root').classList.contains('is-open'));
  const chips = doc.querySelectorAll('.asst-chip');
  ok('6 个快捷问题', chips.length === 6, '实际 ' + chips.length);
  ok('欢迎语已渲染', (doc.querySelector('.asst-msg-bot') || {}).textContent !== '');
  ok('输入框存在', !!doc.querySelector('.asst-input'));
  ok('转人工 WhatsApp 链接存在', !!doc.querySelector('.asst-handoff'));

  const wa = doc.querySelector('.asst-handoff').getAttribute('href');
  /* 挂件转人工用的是 KB 里指定的那条线（+86 158 7520 9571），不是站点的询盘主号 */
  const waNo = window.ASSISTANT_KB.contact.whatsapp;
  ok('WhatsApp 链接用的是挂件指定号码', wa.indexOf('https://wa.me/' + waNo) === 0, wa.slice(0, 60));

  /* ---- 2. 打开面板 ---- */
  console.log('\n[打开面板]');
  doc.querySelector('.asst-fab').dispatchEvent(new window.Event('click', { bubbles: true }));
  ok('面板已展开', doc.querySelector('.asst-root').classList.contains('is-open'));

  /* ---- 3. 点快捷问题 → 出答案 ---- */
  console.log('\n[快捷问题]');
  const before = doc.querySelectorAll('.asst-msg').length;
  chips[1].dispatchEvent(new window.Event('click', { bubbles: true }));
  await sleep(600);
  const after = doc.querySelectorAll('.asst-msg').length;
  ok('产生用户气泡 + 机器人气泡', after >= before + 2, before + ' → ' + after);
  const userMsgs = doc.querySelectorAll('.asst-msg-user');
  ok('用户气泡内容是所点的快捷问题', userMsgs.length === 1 && /MOQ/i.test(userMsgs[0].textContent));
  const botText = Array.from(doc.querySelectorAll('.asst-msg-bot')).map((n) => n.textContent).join(' ');
  ok('机器人回答命中 MOQ 口径', /12 pcs/.test(botText) && /MOQ/i.test(botText));

  /* ---- 4. 自由输入（中文）→ 命中物流 ---- */
  console.log('\n[自由输入]');
  const input = doc.querySelector('.asst-input');
  input.value = '运费怎么算';
  doc.querySelector('.asst-send').dispatchEvent(new window.Event('click', { bubbles: true }));
  await sleep(600);
  const botText2 = Array.from(doc.querySelectorAll('.asst-msg-bot')).map((n) => n.textContent).join(' ');
  ok('中文提问命中物流答案', /DDP/.test(botText2) && /8–10|8-10/.test(botText2));
  ok('输入框已清空', input.value === '');

  /* ---- 5. 答不上来 → 展开留资表单 ---- */
  console.log('\n[兜底 + 留资]');
  input.value = 'zzz qwer nonsense';
  doc.querySelector('.asst-send').dispatchEvent(new window.Event('click', { bubbles: true }));
  await sleep(600);
  const lead = doc.querySelector('.asst-lead');
  ok('答不上来时展开留资表单', !!lead);
  ok('留资表单有联系方式输入框', !!(lead && lead.querySelector('[data-a-contact]')));
  ok('留资表单预填了买家的问题', !!(lead && /nonsense/.test(lead.querySelector('[data-a-msg]').value)));

  /* ---- 6. 联系方式非法 → 先拦下（要在成功提交之前测） ---- */
  console.log('\n[校验]');
  lead.querySelector('[data-a-contact]').value = 'not-a-contact';
  lead.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await sleep(300);
  const err = lead.querySelector('[data-a-err]');
  ok('非法联系方式被拦下并提示', !!(err && !err.hidden && err.textContent.length > 0));
  ok('被拦下时没有发出请求', calls.length === 0, '调用次数 ' + calls.length);

  /* ---- 7. 填对联系方式 → 提交留资 ---- */
  console.log('\n[提交留资]');
  lead.querySelector('[data-a-contact]').value = 'buyer@example.com';
  lead.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await sleep(2200); /* 留出时间陷阱的 1.5s 等待 */
  ok('已调用 /api/inquiry', calls.length === 1, '调用次数 ' + calls.length);
  if (calls.length) {
    const b = calls[0].body;
    ok('接口地址正确', calls[0].url === '/api/inquiry', calls[0].url);
    ok('带 contact 字段', b.contact === 'buyer@example.com', JSON.stringify(b.contact));
    ok('带 product 字段（≥2 字符）', typeof b.product === 'string' && b.product.length >= 2);
    ok('蜜罐 company 为空', b.company === '');
    ok('带 ts 时间戳', typeof b.ts === 'number' && b.ts > 0);
    ok('ts 满足接口的 1.5 秒防垃圾要求', Date.now() - b.ts >= 1500, '实际 ' + (Date.now() - b.ts) + 'ms');
    ok('带 lang 字段', b.lang === 'en', b.lang);
    ok('带 page 字段', typeof b.page === 'string' && b.page.length > 0);
    ok('files 为空数组', Array.isArray(b.files) && b.files.length === 0);
  }
  ok('提交成功后显示确认语', /Eddy has your details|24 hours/i.test(
    Array.from(doc.querySelectorAll('.asst-msg-bot')).map((n) => n.textContent).join(' ')
  ));

  /* ---- 8. 转人工链接带预填文案 ---- */
  console.log('\n[转人工]');
  const h = doc.querySelector('.asst-handoff');
  ok('转人工链接指向 wa.me', h.getAttribute('href').indexOf('https://wa.me/' + waNo) === 0);

  console.log('\n--------------------------------');
  console.log(`通过 ${pass} · 失败 ${fail}`);
  if (fail) {
    console.log('\n❌ 有用例没过，先别发布。\n');
    process.exit(1);
  } else {
    console.log('\n✅ 全部通过，可以进下一步。\n');
  }
  process.exit(0);
})().catch((e) => {
  console.error('\n测试脚本自身出错：', e);
  process.exit(1);
});
