/* 冒烟测试：用 jsdom 真实执行页面脚本，验证渲染与交互结果。
 * 用法：先启动本地服务器，再 node tools/smoke.js
 */
const { JSDOM, VirtualConsole } = require('jsdom');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
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

async function load(url) {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(e.message));
  vc.on('error', (m) => errors.push(String(m)));

  const dom = await JSDOM.fromURL(url, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });

  // 等脚本与资源就绪
  await new Promise((r) => {
    if (dom.window.document.readyState === 'complete') return r();
    dom.window.addEventListener('load', r);
    setTimeout(r, 4000);
  });
  await new Promise((r) => setTimeout(r, 250));
  return { dom, doc: dom.window.document, win: dom.window, errors };
}

function txt(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

(async function run() {
  /* ---------------- 首页 ---------------- */
  console.log('\n[首页 index.html]');
  {
    const { doc, win, errors } = await load(BASE + '/index.html');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('header 已渲染', !!doc.querySelector('header.site-header'));
    ok('品牌名正确', txt(doc.querySelector('.brand-name')) === 'EddySupply');
    ok('导航 3 项', doc.querySelectorAll('.site-nav a').length === 3);
    ok('Hero 标题含 "made simple."', /made simple\./.test(txt(doc.querySelector('h1'))));
    ok('Hero 副标题非空', txt(doc.querySelector('.hero-sub')).length > 30);
    ok('搜索框存在', !!doc.querySelector('[data-search-input]'));
    ok('主推品已渲染', !!doc.querySelector('[data-tilt-img]'));
    ok('主推品有 Add 按钮', !!doc.querySelector('[data-featured] [data-add]'));

    const slides = doc.querySelectorAll('[data-popular] .slide');
    ok('热门轮播 7 张卡', slides.length === 7, '实际 ' + slides.length);
    ok('热门卡有图片', !!doc.querySelector('[data-popular] .product-card img'));

    const cats = doc.querySelectorAll('[data-categories] .cat-card');
    ok('分类网格 11 张', cats.length === 11, '实际 ' + cats.length);
    ok('空分类有 Coming soon 标记', !!doc.querySelector('.badge-soon'));

    ok('浮动 WhatsApp 按钮存在', !!doc.querySelector('.wa-fab'));
    const fabHref = doc.querySelector('.wa-fab').getAttribute('href') || '';
    ok('WhatsApp 链接含号码', fabHref.includes('8615875209571'), fabHref);
    ok('询价抽屉已挂载', !!doc.querySelector('[data-drawer]'));
    ok('初始计数为 0', txt(doc.querySelector('[data-inquiry-count]')) === '0');

    /* 交互：加入询价 */
    const addBtn = doc.querySelector('[data-popular] [data-add]');
    addBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    ok('加购后计数为 1', txt(doc.querySelector('[data-inquiry-count]')) === '1',
      '实际 ' + txt(doc.querySelector('[data-inquiry-count]')));
    ok('加购后按钮变为已选态', addBtn.classList.contains('btn-in-cart'));
    ok('抽屉内出现 1 条', doc.querySelectorAll('.inq-item').length === 1);
    ok('已写入 localStorage', JSON.parse(win.localStorage.getItem('eddysupply.inquiry.v1')).length === 1);

    /* 交互：打开抽屉 */
    doc.querySelector('[data-open-inquiry]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    ok('抽屉已打开', doc.querySelector('[data-drawer]').classList.contains('open'));

    /* 交互：数量 +1 */
    doc.querySelector('[data-delta="1"]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    ok('数量加 1 后计数为 2', txt(doc.querySelector('[data-inquiry-count]')) === '2');

    const sendHref = decodeURIComponent(doc.querySelector('[data-send-inquiry]').getAttribute('href'));
    ok('询价消息含产品名', /AirPods/.test(sendHref), sendHref.slice(0, 120));
    ok('询价消息含数量', /× 2/.test(sendHref));

    /* 搜索 */
    const input = doc.querySelector('[data-search-input]');
    input.value = 'dior';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    const sug = doc.querySelectorAll('.search-suggest .suggest-item');
    ok('搜索 dior 有建议', sug.length > 0, '实际 ' + sug.length);
    ok('建议首条是 Dior 产品', /Dior/i.test(txt(sug[0])));

    win.close();
  }

  /* ---------------- 产品详情页 ---------------- */
  console.log('\n[产品详情页 product.html?id=dior-sauvage]');
  {
    const { doc, win, errors } = await load(BASE + '/product.html?id=dior-sauvage');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('标题正确', /Dior Sauvage/.test(txt(doc.querySelector('.detail-info h1'))));
    ok('价格正确', txt(doc.querySelector('.detail-price')) === '$79');
    ok('面包屑存在', !!doc.querySelector('.breadcrumb'));
    ok('规格表 3 行', doc.querySelectorAll('.spec-row').length === 3);
    ok('有 Add to Inquiry', !!doc.querySelector('.detail-actions [data-add]'));

    const ask = decodeURIComponent(doc.querySelector('[data-ask]').getAttribute('href'));
    ok('Ask 链接带产品信息', /Dior Sauvage/.test(ask) && /79/.test(ask), ask.slice(0, 120));

    ok('相关推荐有内容', doc.querySelectorAll('[data-related] .product-card').length > 0);
    ok('document.title 已更新', /Dior Sauvage/.test(doc.title), doc.title);
    win.close();
  }

  /* ---------------- 产品不存在 ---------------- */
  console.log('\n[产品详情页 · 无效 id]');
  {
    const { doc, win, errors } = await load(BASE + '/product.html?id=nope-nope');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('显示 not found', /not found/i.test(txt(doc.querySelector('[data-product]'))));
    win.close();
  }

  /* ---------------- 分类页 ---------------- */
  console.log('\n[分类页 category.html?slug=perfumes]');
  {
    const { doc, win, errors } = await load(BASE + '/category.html?slug=perfumes');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('标题正确', txt(doc.querySelector('.page-head h1')) === 'Perfumes');
    const cards = doc.querySelectorAll('[data-cat-grid] .product-card');
    ok('该分类 4 个产品', cards.length === 4, '实际 ' + cards.length);
    const chips = doc.querySelectorAll('.subnav .chip');
    ok('子分类 chip 4 个（All + 3）', chips.length === 4, '实际 ' + chips.length);
    ok('All 默认激活', chips[0].classList.contains('is-active'));
    win.close();
  }

  /* ---------------- 分类页 · 子分类筛选 ---------------- */
  console.log('\n[分类页 · 子分类 category.html?slug=watches&sub=smart]');
  {
    const { doc, win, errors } = await load(BASE + '/category.html?slug=watches&sub=smart');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    const cards = doc.querySelectorAll('[data-cat-grid] .product-card');
    ok('智能手表 2 个', cards.length === 2, '实际 ' + cards.length);
    ok('Smart Watches chip 激活', /Smart Watches/.test(txt(doc.querySelector('.chip.is-active'))));
    win.close();
  }

  /* ---------------- 分类页 · 无效 slug ---------------- */
  console.log('\n[分类页 · 无效 slug]');
  {
    const { doc, win, errors } = await load(BASE + '/category.html?slug=nope');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('显示 not found', /not found/i.test(txt(doc.querySelector('[data-category]'))));
    win.close();
  }

  console.log('\n============================');
  console.log(`  通过 ${pass} · 失败 ${fail}`);
  console.log('============================\n');
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('测试脚本异常:', e);
  process.exit(1);
});
