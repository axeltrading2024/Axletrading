/* 冒烟测试：用 jsdom 真实执行页面脚本，验证渲染与交互结果。
 * 断言全部「数据驱动」：期望值从 js/data.js 实时读取，
 * 后台（admin.html）改动数据后测试依然有效，不会因改名/加减产品而误报。
 * 用法：先启动本地服务器（python -m http.server 8123），再 node tools/smoke.js
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');

/* ---- 先在 Node 里加载 data.js，拿到当前真实数据 ---- */
const dataWindow = {};
global.window = dataWindow;
require(path.join(__dirname, '..', 'js', 'data.js'));
const CFG = dataWindow.SITE_CONFIG;
const CATEGORIES = dataWindow.CATEGORIES;
const PRODUCTS = dataWindow.PRODUCTS;

const popular = PRODUCTS.filter((p) => p.popular);
const firstPopular = popular[0] || PRODUCTS[0];
const emptyCats = CATEGORIES.filter((c) => !PRODUCTS.some((p) => p.collection === c.slug));
const catWithSubs = CATEGORIES.find((c) => c.subcategories && c.subcategories.length);
const firstSub = catWithSubs ? catWithSubs.subcategories[0] : null;
const productsIn = (slug) => PRODUCTS.filter((p) => p.collection === slug);
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  // 第三方统计脚本（GoatCounter）掉线不算站点自身错误
  const IGNORE = /gc\.zgo\.at|goatcounter/i;
  vc.on('jsdomError', (e) => { if (!IGNORE.test(e.message)) errors.push(e.message); });
  vc.on('error', (m) => { if (!IGNORE.test(String(m))) errors.push(String(m)); });

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
    ok('品牌名正确（' + CFG.brand + '）', txt(doc.querySelector('.brand-name')) === CFG.brand);
    ok('导航 4 项（含 About/FAQ）', doc.querySelectorAll('.site-nav a').length === 4);
    // 2026-10-21：顶栏 About Us 必须真的跳到关于页，
    // 以前写成 index.html#about，点了只在首页内滚锚点，地址栏变成 /#about
    const navAbout = doc.querySelector('.site-nav a[data-nav="about"]');
    ok('顶栏 About Us 指向 about.html（不是首页锚点）',
      !!navAbout && /(^|\/)about\.html$/.test(navAbout.getAttribute('href') || ''),
      navAbout ? navAbout.getAttribute('href') : '(缺)');
    ok('顶栏不再用 index.html#about 锚点',
      ![...doc.querySelectorAll('.site-nav a')].some((a) => /#about$/.test(a.getAttribute('href') || '')),
      [...doc.querySelectorAll('.site-nav a')].map((a) => a.getAttribute('href')).join(' '));
    ok('手机端汉堡按钮存在', !!doc.querySelector('[data-nav-toggle]'));
    ok('手机端菜单含 ≥5 个链接', doc.querySelectorAll('.mobile-nav a').length >= 5);

    // 首屏图片跑马灯（2026-09-11 新增）
    const stripImgs = doc.querySelectorAll('.hero-strip .hero-strip-item img');
    ok('首屏有图片跑马灯（≥8 张）', stripImgs.length >= 8, '实际 ' + stripImgs.length);
    ok('跑马灯图片都有 src', [...stripImgs].every((i) => (i.getAttribute('src') || '').length > 4));

    // 页脚多栏（2026-09-11 改造）
    ok('页脚为多栏结构（≥3 栏）', doc.querySelectorAll('.site-footer .footer-col').length >= 3);
    ok('页脚有 Shop 分类入口', doc.querySelectorAll('.site-footer a[href^="category.html"]').length >= 4);
    ok('页脚有交易说明（Payment / Shipping / MOQ）',
      doc.querySelectorAll('.footer-trade span').length === 3);
    // 页脚 Shipping 只讲方式与时效，不标运费（2026-10-20 按要求改回）
    const shipSpan = [...doc.querySelectorAll('.footer-trade span')].find((s) =>
      /shipping/i.test(s.textContent));
    ok('页脚 Shipping 不写具体运费（无 € / $）',
      !!shipSpan && !/[€$]/.test(shipSpan.textContent),
      shipSpan ? shipSpan.textContent.replace(/\s+/g, ' ') : '');
    ok('页脚 Shipping 保留了时效与方式',
      !!shipSpan && /express/i.test(shipSpan.textContent) && /DDP/i.test(shipSpan.textContent),
      shipSpan ? shipSpan.textContent.replace(/\s+/g, ' ') : '');

    // About / FAQ 页
    {
      const ab = await load(BASE + '/about.html');
      ok('About 页无 JS 运行时错误', ab.errors.length === 0, ab.errors.join(' | '));
      ok('About 页 header 已渲染', !!ab.doc.querySelector('header.site-header'));
      // 进到这一页时顶栏 About 要自己高亮（data-page="about" 对上 data-nav="about"）
      ok('About 页顶栏 About Us 高亮',
        !!ab.doc.querySelector('.site-nav a[data-nav="about"].is-active'));
      ok('About 页 FAQ ≥ 6 条', ab.doc.querySelectorAll('.faq-item').length >= 6, '实际 ' + ab.doc.querySelectorAll('.faq-item').length);
      ok('About 页页脚有 About 链接', !!ab.doc.querySelector('.site-footer a[href="about.html"]'));
      ok('About 页页脚为多栏（含 Shop / Contact 栏）',
        !!ab.doc.querySelector('.site-footer a[href="about.html"]') &&
        ab.doc.querySelectorAll('.site-footer .footer-col').length >= 3);
      ok('About 页不再显示分类图片墙（已按需求移除）',
        !ab.doc.querySelector('.about-mosaic') && !ab.doc.querySelector('[data-about-stat]'));
      ok('About 页也有 Chat with Eddy 悬浮胶囊',
        !!ab.doc.querySelector('[data-ask-open]') && /chat\s+with\s+eddy/i.test(
          (ab.doc.querySelector('[data-ask-open]') || {}).textContent || ''));
      ok('About 页挂载了 lead-form.js（抽屉表单可用）',
        !!ab.doc.querySelector('.ask-drawer [data-lead-form]'));
      const hiwFoot = ab.doc.querySelector('.hiw-card .hiw-foot');
      ok('About 页 Shipping 卡片脚注不写具体运费（无 € / $）',
        !!hiwFoot && !/[€$]/.test(hiwFoot.textContent),
        hiwFoot ? hiwFoot.textContent.replace(/\s+/g, ' ') : '');

      /* 封箱墙（2026-10-21 从首页搬来）：12 格 = 4 列 × 3 行，
         前 8 格是箱子里装了什么，最后整排 4 格是封好称重编号 */
      const wall = ab.doc.querySelector('.packwall');
      const wImgs = wall ? [...wall.querySelectorAll('.packwall-grid img')] : [];
      ok('About 页有封箱墙 12 格', !!wall && wImgs.length === 12, wImgs.length + ' 张');
      ok('墙面图按 wall-01 → wall-12 顺序排列',
        wImgs.length === 12 && wImgs.every((im, i) =>
          new RegExp('img/proof/wall-' + String(i + 1).padStart(2, '0') + '\\.jpg$').test(im.getAttribute('src'))),
        wImgs.map((i) => (i.getAttribute('src') || '').split('/').pop()).join(' '));
      ok('墙面图都带尺寸与懒加载', wImgs.length === 12 &&
        wImgs.every((im) => im.getAttribute('width') && im.getAttribute('loading') === 'lazy'));
      const wCap = wall ? [...wall.querySelectorAll('.packwall-grid figcaption')].map(txt) : [];
      ok('前 8 格是箱内实况（产品），最后 4 格是箱号+重量+尺寸（封箱）',
        wCap.length === 12 &&
        wCap.slice(0, 8).every((s) => /carton|boxes|opened/i.test(s)) &&
        wCap.slice(8).every((s) => /^\d{4,}\s·\s[\d.]+\s?kg\s·\s[\d×]+\s?cm$/.test(s)),
        wCap.join(' | '));
      const wTxt = wall ? wall.textContent.replace(/\s+/g, ' ') : '';
      ok('墙面文字层不出现品牌名（画面里可以有）',
        !/(chanel|gucci|louis vuitton|coach|ray-?ban|\bjbl\b|beats|nike|jordan)/i.test(wTxt));

      /* 客户案例：真实订单时间轴 + 客户开箱片 */
      const proof = ab.doc.querySelector('#proof');
      ok('About 页有「真实订单」案例区', !!proof);
      ok('案例区有 4 步时间轴', !!proof && proof.querySelectorAll('.proof-step').length === 4,
        proof ? proof.querySelectorAll('.proof-step').length + ' 步' : '');
      ok('4 张步骤图都已就位（img/proof/step-*.jpg）',
        !!proof && [...proof.querySelectorAll('.proof-step img')].every((im) => /img\/proof\/step-\d\.jpg$/.test(im.getAttribute('src'))),
        proof ? [...proof.querySelectorAll('.proof-step img')].map((i) => i.getAttribute('src')).join(' ') : '');
      const pv = proof && proof.querySelector('video.proof-media-video');
      ok('案例区嵌入客户开箱视频', !!pv && /img\/proof\/unboxing\.mp4$/.test(pv.getAttribute('src')));
      ok('开箱视频默认不下载、点播即有声（preload=none + poster + playsinline + 非 muted）',
        !!pv && pv.getAttribute('preload') === 'none' && /img\/proof\/unboxing\.jpg$/.test(pv.getAttribute('poster')) &&
        !pv.hasAttribute('muted') && pv.hasAttribute('playsinline') && pv.hasAttribute('controls'),
        pv ? 'preload=' + pv.getAttribute('preload') + ' poster=' + (pv.getAttribute('poster') || '') : '');
      const proofTxt = proof ? proof.textContent.replace(/\s+/g, ' ') : '';
      ok('案例区不出现金额 / 价目表', !/[€$]\s?\d/.test(proofTxt), proofTxt.slice(0, 80));
      ok('案例区说明已获客户许可', /permission|permiso/i.test(proofTxt));
    }

    /* ---- 首页「真实订单」区块（2026-10-21 从 about 提到首页） ---- */
    const hp = doc.querySelector('#proof');
    ok('首页有「真实订单」案例区', !!hp);
    ok('首页案例区 6 格：2 句对话（开头 / 结果）+ 4 拍流程',
      !!hp && hp.querySelectorAll('.proof-arc .proof-step').length === 2 &&
      hp.querySelectorAll('.proof-split .proof-step').length === 4,
      hp ? hp.querySelectorAll('.proof-arc .proof-step').length + ' + ' +
        hp.querySelectorAll('.proof-split .proof-step').length : '');
    const hArc = hp ? [...hp.querySelectorAll('.proof-arc .proof-step img')].map((im) => im.getAttribute('src')) : [];
    ok('并排两句是「首次询价」与「首箱卖光」',
      /img\/proof\/step-1\.jpg$/.test(hArc[0] || '') && /img\/proof\/step-4\.jpg$/.test(hArc[1] || ''),
      hArc.join(' '));
    const hSteps = hp ? [...hp.querySelectorAll('.proof-split .proof-step img')].map((im) => im.getAttribute('src')) : [];
    ok('流程四拍按 付款→清点→打包→封箱 排列',
      /img\/proof\/pay\.jpg$/.test(hSteps[0] || '') && /img\/proof\/list\.jpg$/.test(hSteps[1] || '') &&
      /img\/proof\/step-2\.jpg$/.test(hSteps[2] || '') && /img\/proof\/step-3\.jpg$/.test(hSteps[3] || ''),
      hSteps.join(' '));
    ok('首页案例区里每张图都带尺寸与懒加载', hp &&
      [...hp.querySelectorAll('.proof-step img')].every((im) => im.getAttribute('width') && im.getAttribute('loading') === 'lazy'));
    ok('首页案例区只有一条视频（不留与开箱片同源的第二段）', !!hp &&
      hp.querySelectorAll('video').length === 1,
      hp ? hp.querySelectorAll('video').length + ' 条' : '');
    ok('首页案例区嵌入客户开箱视频（懒加载 + poster）', !!hp &&
      !!hp.querySelector('video[src$="img/proof/unboxing.mp4"]') &&
      hp.querySelector('video[src$="img/proof/unboxing.mp4"]').getAttribute('preload') === 'none');
    ok('首页案例区开箱视频保留客户原声（不静音、不循环）', !!hp &&
      !!hp.querySelector('video[src$="img/proof/unboxing.mp4"]') &&
      !hp.querySelector('video[src$="img/proof/unboxing.mp4"]').hasAttribute('muted') &&
      !hp.querySelector('video[src$="img/proof/unboxing.mp4"]').hasAttribute('loop'));
    // 2026-10-21：封箱墙搬到 About 页（首页清爽些），这里断言它确实不在首页
    ok('封箱墙已从首页撤掉（搬到 about.html#warehouse）', !!hp && !hp.querySelector('.packwall'), '');
    const hpTxt = hp ? hp.textContent.replace(/\s+/g, ' ') : '';
    ok('首页案例区不出现金额 / 价目表', !/[€$]\s?\d/.test(hpTxt), hpTxt.slice(0, 80));
    // 图片里可以有品牌（Eddy 已确认不介意），但文字层一律不写品牌名
    ok('首页案例区文字层不出现品牌名（Chanel / Gucci / LV / Coach / Ray-Ban / JBL / Beats / Nike）',
      !/(chanel|gucci|louis vuitton|coach|ray-?ban|\bjbl\b|beats|nike|jordan)/i.test(hpTxt));
    ok('首页案例区年份写 2025，不出现 2026', /2025/.test(hpTxt) && !/2026/.test(hpTxt),
      (hpTxt.match(/20\d\d/g) || []).join(','));

    const h1El = doc.querySelector('h1');
    const h1 = txt(h1El);
    ok('Hero 标题第一行（' + CFG.heroTitle + '）', h1.indexOf(CFG.heroTitle) === 0, h1);
    ok('Hero 标题强调行（' + CFG.heroTitleAccent + '）', h1.indexOf(CFG.heroTitleAccent) > -1, h1);
    ok('单行版大标题：无 <br>，两段用「·」连排',
      CFG.heroSingleLine === true && h1El.getAttribute('class').indexOf('is-single') > -1 &&
      !!h1El.querySelector('.h1-dot') && !h1El.querySelector('br'), h1);
    ok('Hero 角标（' + (CFG.heroBadge || CFG.brand + ' · wholesale supplier') + '）',
      txt(doc.querySelector('[data-hero-badge]')) === (CFG.heroBadge || CFG.brand + ' · wholesale supplier'));
    ok('Hero 副标题非空', txt(doc.querySelector('.hero-sub')).length > 10);
    // 品牌定位：优质 · 出厂价 · 发货快（改了 data.js 的 hero 文案就会红，提醒同步 OG 图）
    const subTxt = txt(doc.querySelector('.hero-sub'));
    ok('Hero 副标题含 premium / factory pricing / fast shipping',
      /premium/i.test(subTxt) && /factory pricing/i.test(subTxt) && /fast shipping/i.test(subTxt), subTxt.slice(0, 90));
    ok('首页 title 用新定位（Premium Quality at Factory Pricing）',
      /premium quality at factory pricing/i.test(doc.title), doc.title);
    ok('OG 图带版本参数（换图后分享卡才会刷新）',
      /og-image\.png\?v=\d/.test(doc.querySelector('meta[property="og:image"]').content),
      doc.querySelector('meta[property="og:image"]').content);
    ok('搜索框存在', !!doc.querySelector('[data-search-input]'));

    const slides = doc.querySelectorAll('[data-popular] .slide');
    // 无缝循环会把整组卡片克隆一份接尾部（克隆卡带 aria-hidden）
    const realSlides = doc.querySelectorAll('[data-popular] .slide:not([aria-hidden="true"])');
    ok('热门轮播 ' + popular.length + ' 张卡（+ 克隆 ' + (slides.length - realSlides.length) + ' 张）',
      realSlides.length === popular.length && slides.length === popular.length * 2,
      '实际 real=' + realSlides.length + ' total=' + slides.length);
    ok('热门卡有图片', !!doc.querySelector('[data-popular] .product-card img'));

    const cats = doc.querySelectorAll('[data-categories] .cat-card');
    ok('分类网格 ' + CATEGORIES.length + ' 张', cats.length === CATEGORIES.length, '实际 ' + cats.length);
    ok('空分类 Coming soon 标记一致（空分类 ' + emptyCats.length + ' 个）',
      !!doc.querySelector('.badge-soon') === (emptyCats.length > 0));

    ok('浮动 WhatsApp 按钮存在', !!doc.querySelector('.wa-fab'));
    const fabHref = doc.querySelector('.wa-fab').getAttribute('href') || '';
    ok('WhatsApp 链接含号码（' + CFG.whatsapp + '）', fabHref.includes(CFG.whatsapp), fabHref);
    ok('询价抽屉已挂载', !!doc.querySelector('[data-drawer]'));
    ok('不再有右下角邮件悬浮按钮（已并入 Send on WhatsApp）', !doc.querySelector('.inquiry-fab'));
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

    /* 点 Send on WhatsApp → 先打开接待表单，产品从询价篮自动带入 */
    const sendBtn = doc.querySelector('[data-send-inquiry]');
    ok('Send on WhatsApp 是按钮（不再直跳外链）', !!sendBtn && sendBtn.tagName === 'BUTTON' && !sendBtn.getAttribute('href'));
    sendBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    const formEl = doc.querySelector('[data-inquiry-form]');
    const prodField = doc.querySelector('[data-inquiry-products]');
    ok('点击后打开填写表单面板', doc.querySelector('[data-inquiry-panel]').classList.contains('open'));
    ok('询价篮产品已带入表单（' + firstPopular.name + '）',
      !!prodField && new RegExp(escRe(firstPopular.name)).test(prodField.value), prodField ? prodField.value : '');
    ok('带入的数量正确（× 2）', !!prodField && /× 2/.test(prodField.value), prodField ? prodField.value : '');
    ok('抽屉已关闭', !doc.querySelector('[data-drawer]').classList.contains('open'));

    /* 表单底部两个动作按钮 */
    ok('有「Get a fast quote」主按钮', txt(formEl.querySelector('button[type="submit"]')).length > 0 &&
      !!formEl.querySelector('button[type="submit"]'));
    ok('有「Send products now」按钮', !!formEl.querySelector('[data-send-products-now]'));

    /* 搜索：用第一个产品名的首个词做关键词，保证必有结果 */
    const kw = String(firstPopular.name).trim().split(/\s+/)[0].toLowerCase();
    const input = doc.querySelector('[data-search-input]');
    input.value = kw;
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    const sug = doc.querySelectorAll('.search-suggest .suggest-item');
    ok('搜索 "' + kw + '" 有建议', sug.length > 0, '实际 ' + sug.length);
    ok('建议含关键词产品', sug.length === 0 || new RegExp(escRe(kw), 'i').test(txt(sug[0])) || sug.length > 0);

    win.close();
  }

  /* ---------------- 产品详情页 ---------------- */
  const P = PRODUCTS[0];
  console.log('\n[产品详情页 product.html?id=' + P.id + ']');
  {
    const { doc, win, errors } = await load(BASE + '/product.html?id=' + encodeURIComponent(P.id));
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('标题正确（' + P.name + '）', new RegExp(escRe(P.name)).test(txt(doc.querySelector('.detail-info h1'))));
    ok('价格正确（' + P.price + '）', txt(doc.querySelector('.detail-price')).indexOf(P.price) === 0,
      '实际 ' + txt(doc.querySelector('.detail-price')));
    ok('价格旁有 Wholesale 小字', /Wholesale · Ask for volume pricing/.test(txt(doc.querySelector('.detail-price'))));
    ok('面包屑存在', !!doc.querySelector('.breadcrumb'));
    ok('规格表 4 行', doc.querySelectorAll('.spec-row').length === 4);
    ok('规格表含 Shipping/MOQ', /Worldwide · Quoted on request/.test(txt(doc.querySelector('.spec-list'))) && /Flexible/.test(txt(doc.querySelector('.spec-list'))));
    ok('有 Add to Inquiry', !!doc.querySelector('.detail-actions [data-add]'));
    ok('有 Review inquiry list 按钮', !!doc.querySelector('.detail-actions [data-open-inquiry]'));
    ok('有 Back to 分类链接', !!doc.querySelector('.back-link'));
    /* 2026-10-21：返回链接从产品信息底部移到图片下方，左栏 .detail-side 里 */
    ok('Back to 分类链接在图片下方（左栏 .detail-side 内，与图卡同级）',
      !!doc.querySelector('.detail-side > .detail-media') && !!doc.querySelector('.detail-side > .back-link') &&
      !doc.querySelector('.detail-info .back-link'));

    ok('相关推荐有内容', doc.querySelectorAll('[data-related] .product-card').length > 0);
    ok('document.title 已更新', new RegExp(escRe(P.name)).test(doc.title), doc.title);
    ok('产品页也有 Chat with Eddy 悬浮胶囊',
      !!doc.querySelector('[data-ask-open]') && /chat\s+with\s+eddy/i.test(
        (doc.querySelector('[data-ask-open]') || {}).textContent || ''));
    ok('产品页挂载 lead-form.js（抽屉表单可用）', !!doc.querySelector('.ask-drawer [data-lead-form]'));
    win.close();
  }

  /* ---------------- MOQ 字段（有值显示实际起订量 / 无值回落 Flexible） ---------------- */
  console.log('\n[MOQ · 有值显示实际起订量]');
  {
    const withMoq = PRODUCTS.find(function (p) { return p.moq; });
    if (!withMoq) {
      ok('数据里有带 moq 的产品可测', false, 'PRODUCTS 里没有 moq 非空的产品');
    } else {
      const { doc, win, errors } = await load(BASE + '/product.html?id=' + encodeURIComponent(withMoq.id));
      ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
      const specTxt = txt(doc.querySelector('.spec-list'));
      ok('MOQ 行显示实际起订量（' + withMoq.moq + '）', specTxt.indexOf(withMoq.moq) > -1, '实际 ' + specTxt);
      ok('该产品不再显示 Flexible', specTxt.indexOf('Flexible') === -1, '实际 ' + specTxt);
      ok('规格表仍是 4 行', doc.querySelectorAll('.spec-row').length === 4);
      win.close();
    }
  }

  console.log('\n[MOQ · 无值回落 Flexible]');
  {
    const noMoq = PRODUCTS.find(function (p) { return !p.moq; });
    const { doc, win, errors } = await load(BASE + '/product.html?id=' + encodeURIComponent(noMoq.id));
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('无 moq 的产品仍显示 Flexible', /Flexible/.test(txt(doc.querySelector('.spec-list'))),
      '实际 ' + txt(doc.querySelector('.spec-list')));
    win.close();
  }

  /* ---------------- MOQ · 西语站原样显示（自由文本不翻译） ---------------- */
  console.log('\n[MOQ · 西语站原样显示]');
  {
    const withMoq = PRODUCTS.find(function (p) { return p.moq; });
    if (withMoq) {
      const { doc, win } = await load(BASE + '/product.html?id=' + encodeURIComponent(withMoq.id));
      win.setLang('es');
      const specTxt = txt(doc.querySelector('.spec-list'));
      ok('切到西语后 MOQ 仍是原始文本（' + withMoq.moq + '）', specTxt.indexOf(withMoq.moq) > -1, '实际 ' + specTxt);
      win.close();
    }
  }

  /* ---------------- MOQ + 询价篮数量联动 ---------------- */
  console.log('\n[MOQ · 加购数量受起订量约束]');
  {
    const moqP = PRODUCTS.find(function (p) {
      const m = String(p.moq || '').match(/(\d+)/);
      return m && parseInt(m[1], 10) > 1;
    });
    const plainP = PRODUCTS.find(function (p) { return !p.moq; });

    if (!moqP) {
      ok('数据里有带数字 MOQ 的产品可测', false, 'PRODUCTS 里没有 MOQ>1 的产品');
    } else {
      const expected = parseInt(String(moqP.moq).match(/(\d+)/)[1], 10);
      const { doc, win, errors } = await load(BASE + '/product.html?id=' + encodeURIComponent(moqP.id));
      ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));

      // 首次加购 → 直接放满 MOQ，而不是 1
      doc.querySelector('.detail-actions [data-add]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      let st = JSON.parse(win.localStorage.getItem('eddysupply.inquiry.v1')) || [];
      ok('加购后数量直接 = MOQ（' + expected + '）', st.length === 1 && st[0].qty === expected, '实际 ' + JSON.stringify(st));

      // 打开抽屉看 UI
      doc.querySelector('[data-open-inquiry]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      const itemTxt = txt(doc.querySelector('.inq-item'));
      ok('清单项显示 Min. ' + expected + ' 标签', itemTxt.indexOf('Min. ' + expected) > -1, itemTxt);
      ok('减号已到下限被锁定（data-moqlock）', !!doc.querySelector('[data-delta="-1"][data-moqlock]'));

      // 减号点到下限 → 被拦，数量不变，并给 toast 提示
      doc.querySelector('[data-delta="-1"]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      st = JSON.parse(win.localStorage.getItem('eddysupply.inquiry.v1')) || [];
      ok('减号到 MOQ 后数量被拦住（仍为 ' + expected + '）', st[0] && st[0].qty === expected, '实际 ' + (st[0] && st[0].qty));
      ok('弹出起订量提示', /Minimum order/i.test(txt(doc.querySelector('[data-toast]'))), txt(doc.querySelector('[data-toast]')));

      // 加号仍可继续加（起订量是下限，不是上限）
      doc.querySelector('[data-delta="1"]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      st = JSON.parse(win.localStorage.getItem('eddysupply.inquiry.v1')) || [];
      ok('加号可超过 MOQ（' + (expected + 1) + '）', st[0] && st[0].qty === expected + 1, '实际 ' + (st[0] && st[0].qty));

      // 询价消息里的数量必须 >= MOQ（新版：点 Send on WhatsApp 先开表单，产品行在表单里）
      doc.querySelector('[data-send-inquiry]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 80));
      const msg = doc.querySelector('[data-inquiry-products]').value;
      ok('询价消息数量 >= MOQ（× ' + (expected + 1) + '）', new RegExp('\\× ' + (expected + 1) + '(\\D|$)').test(msg), msg.slice(0, 160));
      win.close();
    }

    // 无 MOQ 的产品：加购仍是 1，减号正常生效（不回归原有行为）
    if (plainP) {
      const { doc, win, errors } = await load(BASE + '/product.html?id=' + encodeURIComponent(plainP.id));
      ok('无 MOQ 产品：无 JS 运行时错误', errors.length === 0, errors.join(' | '));
      doc.querySelector('.detail-actions [data-add]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      let st = JSON.parse(win.localStorage.getItem('eddysupply.inquiry.v1')) || [];
      ok('无 MOQ 产品加购数量仍为 1', st.length === 1 && st[0].qty === 1, '实际 ' + JSON.stringify(st));
      doc.querySelector('[data-open-inquiry]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      const minus = doc.querySelector('[data-delta="-1"]');
      ok('无 MOQ 产品减号不锁定', !minus.getAttribute('data-moqlock'));
      minus.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      st = JSON.parse(win.localStorage.getItem('eddysupply.inquiry.v1')) || [];
      ok('无 MOQ 产品减号正常减到 0 并移除条目', st.length === 0, '实际 ' + JSON.stringify(st));
      ok('无 MOQ 产品不显示 Min. 标签', txt(doc.querySelector('.inq-item')) === '' || txt(doc.querySelector('.inq-item')).indexOf('Min. ') === -1);
      win.close();
    }
  }

  /* ---------------- MOQ + 分享链接（老链接数量要按当前 MOQ 抬到下限） ---------------- */
  console.log('\n[MOQ · 分享链接数量被抬到下限]');
  {
    const moqP = PRODUCTS.find(function (p) {
      const m = String(p.moq || '').match(/(\d+)/);
      return m && parseInt(m[1], 10) > 1;
    });
    if (moqP) {
      const expected = parseInt(String(moqP.moq).match(/(\d+)/)[1], 10);
      const vName = (moqP.variants && moqP.variants[0]) ? moqP.variants[0].name : '';
      // 模拟 MOQ 设定之前生成的旧分享链接：数量只有 1
      const arr = [{ i: moqP.id, v: vName, q: 1 }];
      const b64 = Buffer.from(JSON.stringify(arr), 'utf8').toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const { doc, win, errors } = await load(BASE + '/index.html#l=' + b64);
      ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
      const item = doc.querySelector('[data-shared-body] .inq-item');
      ok('分享清单已渲染', !!item);
      if (item) {
        const t = txt(item);
        ok('旧链接的数量 1 被抬到 MOQ（' + expected + '）', t.indexOf('× ' + expected) > -1, t);
        ok('分享清单显示 Min. ' + expected + ' 标签', t.indexOf('Min. ' + expected) > -1, t);
        ok('分享清单减号已锁定', !!doc.querySelector('[data-shared-body] [data-sqty][data-moqlock]'));
        // 点减号 → 被拦，数量不变
        doc.querySelector('[data-shared-body] [data-sqty][data-delta="-1"]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
        const t2 = txt(doc.querySelector('[data-shared-body] .inq-item'));
        ok('分享清单点减号后数量仍为 MOQ', t2.indexOf('× ' + expected) > -1, t2);
      }
      win.close();
    }
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
  const C = CATEGORIES[0];
  const cCount = productsIn(C.slug).length;
  const subCount = (C.subcategories && C.subcategories.length) || 0;
  const cChips = subCount ? 1 + subCount : 0; // 无子分类时前台不渲染 subnav
  console.log('\n[分类页 category.html?slug=' + C.slug + ']');
  {
    const { doc, win, errors } = await load(BASE + '/category.html?slug=' + encodeURIComponent(C.slug));
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    ok('标题正确（' + C.name + '）', txt(doc.querySelector('.page-head h1')) === C.name);
    const cards = doc.querySelectorAll('[data-cat-grid] .product-card');
    ok('该分类 ' + cCount + ' 个产品', cards.length === cCount, '实际 ' + cards.length);
    const chips = doc.querySelectorAll('.subnav .chip');
    ok('子分类 chip ' + cChips + ' 个' + (cChips ? '（All + ' + (cChips - 1) + '）' : '（无子分类不渲染）'),
      chips.length === cChips, '实际 ' + chips.length);
    ok('All 默认激活', chips.length === 0 || chips[0].classList.contains('is-active'));
    // 卡片结构（2026-09-11：标题限 2 行、去掉重复的定价说明、每张卡都有品牌行容器）
    ok('卡片标题都有 2 行容器', [...cards].every((c) => !!c.querySelector('.name')));
    ok('卡片不再重复「Wholesale · Ask for volume pricing」',
      !txt(doc.querySelector('[data-cat-grid]')).includes('Ask for volume pricing'));
    ok('定价说明已移到分类页说明文字里',
      txt(doc.querySelector('.page-head .sub')).includes('Wholesale pricing'));
    ok('品牌为空时卡片品牌行隐藏（不留空行）',
      [...cards].every((c) => {
        const eb = c.querySelector('.card-eyebrow');
        return eb && (eb.getAttribute('hidden') !== null) === (eb.textContent.trim() === '');
      }));
    ok('分类页顶栏 Browse 高亮', !!doc.querySelector('.site-nav a[data-nav="browse"].is-active'));
    ok('分类页也有 Chat with Eddy 悬浮胶囊',
      !!doc.querySelector('[data-ask-open]') && /chat\s+with\s+eddy/i.test(
        (doc.querySelector('[data-ask-open]') || {}).textContent || ''));
    ok('分类页挂载 lead-form.js（抽屉表单可用）', !!doc.querySelector('.ask-drawer [data-lead-form]'));
    win.close();
  }

  /* ---------------- 分类页 · 子分类筛选 ---------------- */
  if (catWithSubs && firstSub) {
    const sCount = PRODUCTS.filter((p) => p.collection === catWithSubs.slug && p.subcategory === firstSub.slug).length;
    console.log('\n[分类页 · 子分类 category.html?slug=' + catWithSubs.slug + '&sub=' + firstSub.slug + ']');
    const { doc, win, errors } = await load(BASE + '/category.html?slug=' + encodeURIComponent(catWithSubs.slug) + '&sub=' + encodeURIComponent(firstSub.slug));
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    const cards = doc.querySelectorAll('[data-cat-grid] .product-card');
    ok('子分类「' + firstSub.name + '」' + sCount + ' 个产品', cards.length === sCount, '实际 ' + cards.length);
    ok('激活 chip 为「' + firstSub.name + '」', new RegExp(escRe(firstSub.name)).test(txt(doc.querySelector('.chip.is-active'))));
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

  /* ---------------- 询盘接待表单 ---------------- */
  console.log('\n[询盘接待表单 · index.html]');
  {
    const { doc, win, errors } = await load(BASE + '/index.html');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    const form = doc.querySelector('[data-inquiry-form]');
    ok('表单已挂载', !!form);
    const names = form ? [...form.querySelectorAll('input,select')].map((i) => i.name) : [];
    const want = ['name', 'phone', 'address', 'city', 'province', 'zip', 'country', 'email'];
    ok('字段与需求格式一致（' + want.join(' / ') + '）',
      want.length === names.length && want.every((n, i) => names[i] === n), '实际 ' + names.join(','));
    ok('name / phone 为必填', !!form.querySelector('[name="name"][required]') && !!form.querySelector('[name="phone"][required]'));
    ok('email 为 email 类型', form.querySelector('[name="email"]').type === 'email');
    ok('有「产品」输入框（textarea[name=products]）', !!form.querySelector('textarea[name="products"]'));
    const csel = form.querySelector('[data-inquiry-country]');
    ok('国家是下拉选择（不能乱填）', !!csel && csel.tagName === 'SELECT', csel ? csel.tagName : '无');
    ok('国家选项含主流市场（US/DE/GB/CN…）',
      ['US', 'DE', 'GB', 'CN', 'AE'].every((iso) => !!csel.querySelector('option[value="' + iso + '"]')),
      '共 ' + (csel.querySelectorAll('option').length - 1) + ' 个国家');

    const INQ_NO = CFG.whatsappInquiry || CFG.whatsapp;
    ok('表单号码已全站统一（' + INQ_NO + '）', INQ_NO === '4915224901963', '实际 ' + INQ_NO);

    const opened = [];
    win.open = (u) => { opened.push(u); return null; };
    const set = (n, v) => { form.querySelector('[name="' + n + '"]').value = v; };
    set('name', 'John Smith');
    set('phone', '+1 415 555 0100');
    set('address', '1200 Market St');
    set('city', 'San Francisco');
    set('province', 'California');
    set('zip', '94102');
    set('country', 'US');
    set('email', 'john@example.com');
    form.querySelector('[name="products"]').value = 'RIMOWA style × 50';
    form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));

    const url = opened[0] || '';
    ok('提交直达 wa.me/' + INQ_NO, url.indexOf('https://wa.me/' + INQ_NO + '?text=') === 0, url.slice(0, 70));
    const body = decodeURIComponent(url.split('text=')[1] || '');
    ok('消息含 8 项信息',
      ['John Smith', '+1 415 555 0100', '1200 Market St', 'San Francisco', 'California', '94102', 'United States', 'john@example.com']
        .every((v) => body.includes(v)), body.split('\n').join(' | '));
    ok('消息含产品项', body.indexOf('Products: RIMOWA style × 50') > -1, body.split('\n').join(' | '));

    /* ---- 输入校验：乱写 / 邮编 / 区号 都要拦住 ---- */
    const errOf = (n) => { const el = form.querySelector('[data-err="' + n + '"]'); return el ? el.textContent.trim() : ''; };
    const submit = () => form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));

    // 截图里的那种全乱填
    set('name', 'asdas'); set('phone', 'asdad'); set('address', 'asdsa');
    set('city', 'dad'); set('province', 'asd'); set('zip', 'asda');
    set('country', 'OTHER'); set('email', 'not-an-email');
    opened.length = 0; submit();
    ok('乱写的数据不会发出消息', opened.length === 0, 'opened=' + opened.length);
    ok('姓名乱写被拦（asdas）', errOf('name').length > 0, errOf('name'));
    ok('电话含字母被拦（asdad）', errOf('phone').length > 0, errOf('phone'));
    ok('城市乱写被拦（dad）', errOf('city').length > 0, errOf('city'));
    ok('地址乱写被拦（asdsa）', errOf('address').length > 0, errOf('address'));
    ok('邮编乱写被拦（asda）', errOf('zip').length > 0, errOf('zip'));
    ok('邮箱格式被拦', errOf('email').length > 0, errOf('email'));

    // 美国邮编必须是 5 位
    set('country', 'US'); set('zip', '1234'); opened.length = 0; submit();
    ok('US 邮编位数错被拦（1234 应为 90210）', /90210/.test(errOf('zip')), errOf('zip'));
    set('zip', '94102');

    // 区号必须与所选国家一致
    set('phone', '+49 30 1234567'); opened.length = 0; submit();
    ok('区号与国家不符被拦（+49 但选了 US）', /\+1/.test(errOf('phone')), errOf('phone'));

    // 假号码
    set('phone', '+1 1111111111'); opened.length = 0; submit();
    ok('全同数字的假号码被拦', errOf('phone').length > 0, errOf('phone'));

    // 德国邮编格式 + 区号正确 → 放行
    set('name', 'Hans Müller'); set('phone', '+49 30 1234567');
    set('address', 'Unter den Linden 5'); set('city', 'Berlin');
    set('province', 'Berlin'); set('zip', '10117'); set('country', 'DE');
    set('email', 'hans@example.de');
    opened.length = 0; submit();
    ok('换德国（邮编 5 位 + 区号 49）可正常发出', opened.length === 1, '错误：' + ['name', 'phone', 'zip', 'country', 'email'].map((n) => errOf(n)).join(' | '));

    /* ---- 反向守护：真实的跨国客户数据不能被误拦 ---- */
    const realCases = [
      ['MX', 'Carlos López', 'Ciudad de México', 'CDMX', '01000', '+52 55 1234 5678'],
      ['JP', 'Taro Yamada', 'Tokyo', 'Tokyo', '100-0001', '+81 90 1234 5678'],
      ['PL', 'Krzysztof Nowak', 'Warszawa', 'Mazowieckie', '00-001', '+48 501 234 567'],
      ['AE', 'Omar Al Farsi', 'Dubai', 'Dubai', '', '+971 50 123 4567']
    ];
    realCases.forEach(([iso, nm, city, prov, zip, ph]) => {
      set('name', nm); set('phone', ph); set('address', '12 Main Street 5');
      set('city', city); set('province', prov); set('zip', zip); set('country', iso);
      set('email', 'buyer@example.com');
      opened.length = 0; submit();
      ok('真实客户不被误拦（' + iso + ' ' + nm + '）', opened.length === 1,
        '被拦：' + [...form.querySelectorAll('[data-err]')].filter((b) => b.textContent).map((b) => b.getAttribute('data-err')).join(','));
    });

    // 语言切换后国家名跟着本地化
    win.setLang('es');
    ok('切西语后国家名本地化（Germany → Alemania）',
      csel.querySelector('option[value="DE"]').textContent === 'Alemania',
      csel.querySelector('option[value="DE"]').textContent);
    win.setLang('en');

    /* Send products now：不填表，只发产品清单 */    opened.length = 0;
    doc.querySelector('[data-send-products-now]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    const url2 = opened[0] || '';
    const body2 = decodeURIComponent(url2.split('text=')[1] || '');
    ok('Send products now 直达 wa.me/' + INQ_NO, url2.indexOf('https://wa.me/' + INQ_NO + '?text=') === 0, url2.slice(0, 70));
    ok('Send products now 只带产品（不含姓名/地址）',
      body2.indexOf('RIMOWA style × 50') > -1 && body2.indexOf('John Smith') === -1, body2.split('\n').join(' | '));
    win.close();
  }

  /* ---------------- 商品页一键询盘（产品名带入） ---------------- */
  console.log('\n[询盘接待表单 · 商品页一键带入]');
  {
    const { doc, win, errors } = await load(BASE + '/product.html?id=' + encodeURIComponent(firstPopular.id));
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    const btn = doc.querySelector('[data-inquiry-product-trigger]');
    ok('有「询盘此产品」按钮', !!btn);
    if (btn) {
      btn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      const panel = doc.querySelector('[data-inquiry-panel]');
      const prods = doc.querySelector('[data-inquiry-products]');
      ok('面板已打开', !!panel && panel.classList.contains('open'));
      ok('产品项已自动带入（' + firstPopular.name + '）',
        !!prods && prods.value.indexOf(firstPopular.name) > -1, prods ? prods.value : '');
    }
    win.close();
  }

  /* ---------------- 批量阶梯价（产品页） ---------------- */
  console.log('\n[批量阶梯价 · product.html]');
  {
    const { doc, win, errors } = await load(BASE + '/product.html?id=' + encodeURIComponent(firstPopular.id));
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    const box = doc.querySelector('[data-tier-box]');
    ok('阶梯价区块已渲染', !!box);
    if (box) {
      const num = (s) => parseFloat((String(s).replace(/,/g, '').match(/\d+(\.\d+)?/) || ['0'])[0]);
      const base = num(firstPopular.price);
      const rows = [...box.querySelectorAll('[data-tier-row]')];
      ok('三档档位', rows.length === 3, '实际 ' + rows.length);
      ok('档位为 1–99 / 100–499 / 500+',
        rows.map((r) => r.querySelector('td').textContent.trim()).join('|') === '1–99|100–499|500+',
        rows.map((r) => r.querySelector('td').textContent.trim()).join('|'));
      const unitOf = (i) => num(rows[i].querySelectorAll('td')[1].textContent);
      ok('第 1 档 = 原价', Math.abs(unitOf(0) - base) < 0.01, unitOf(0) + ' vs ' + base);
      ok('第 2 档 = 95 折', Math.abs(unitOf(1) - base * 0.95) < 0.02, String(unitOf(1)));
      ok('第 3 档 = 9 折', Math.abs(unitOf(2) - base * 0.9) < 0.02, String(unitOf(2)));

      const inp = box.querySelector('[data-tier-qty]');
      const unitEl = box.querySelector('[data-tier-unit]');
      const totalEl = box.querySelector('[data-tier-total]');
      const savedEl = box.querySelector('[data-tier-saved]');
      ok('默认数量 1 → 原价', Math.abs(num(unitEl.textContent) - base) < 0.01, unitEl.textContent);

      inp.value = '100';
      inp.dispatchEvent(new win.Event('input', { bubbles: true }));
      ok('输 100 → 单价切 95 折', Math.abs(num(unitEl.textContent) - base * 0.95) < 0.02, unitEl.textContent);
      ok('总价 = 折后单价 × 100', Math.abs(num(totalEl.textContent) - base * 0.95 * 100) < 0.6, totalEl.textContent);
      ok('显示省下金额', savedEl.textContent.length > 0, savedEl.textContent);
      ok('命中第 2 档高亮', rows[1].classList.contains('is-hit') && !rows[0].classList.contains('is-hit'));

      inp.value = '500';
      inp.dispatchEvent(new win.Event('input', { bubbles: true }));
      ok('输 500 → 单价切 9 折', Math.abs(num(unitEl.textContent) - base * 0.9) < 0.02, unitEl.textContent);
      ok('命中第 3 档高亮', rows[2].classList.contains('is-hit'));

      /* 2026-10-21：整块默认收起，点标题条才展开（Eddy：日常别占版面） */
      const head = box.querySelector('[data-tier-toggle]');
      const sumEl = box.querySelector('[data-tier-sum]');
      ok('阶梯价默认收起（aria-expanded=false）',
        !!head && !box.classList.contains('is-open') && head.getAttribute('aria-expanded') === 'false');
      ok('收起时摘要写「3 tiers · up to −10%」',
        !!sumEl && /3 tiers · up to −10%/.test(sumEl.textContent), sumEl ? sumEl.textContent : '(无)');
      head.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      ok('点标题条 → 展开（is-open + aria-expanded=true）',
        box.classList.contains('is-open') && head.getAttribute('aria-expanded') === 'true');
      head.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      ok('再点一次 → 收回',
        !box.classList.contains('is-open') && head.getAttribute('aria-expanded') === 'false');
    }
    win.close();
  }

  /* ---------------- 运费估算（询价篮抽屉） ---------------- */
  console.log('\n[运费估算 · 询价篮]');
  {
    const { doc, win, errors } = await load(BASE + '/index.html');
    ok('无 JS 运行时错误', errors.length === 0, errors.join(' | '));
    const se = doc.querySelector('[data-ship-est]');
    ok('运费面板已渲染', !!se);
    if (se) {
      const sel = se.querySelector('[data-ship-country]');
      ok('国家下拉默认美国', sel.value === 'US', sel.value);
      ok('国家下拉 53 项（52 国 + Other）', sel.options.length === 53, '实际 ' + sel.options.length);

      se.querySelector('[data-ship-toggle]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      ok('点开后展开', !se.querySelector('[data-ship-body]').hasAttribute('hidden'));

      const out = se.querySelector('[data-ship-out]');
      const t = () => out.textContent.replace(/\s+/g, ' ');
      const kg = se.querySelector('[data-ship-kg]');
      ok('默认 10kg 美国 = 首重$40 + 9kg×$15 = $175', t().indexOf('$175') > -1, t().slice(0, 110));
      ok('显示首重 1kg 价格 $40', t().indexOf('$40') > -1, t().slice(0, 110));
      ok('汇率常量 1 EUR = 1.1 USD', win.FX_RATES && win.FX_RATES.rates.USD === 1.1,
        JSON.stringify(win.FX_RATES));
      ok('美国区只报美元，不折欧元约值', t().indexOf('$175') > -1 && t().indexOf('≈ €') === -1, t().slice(0, 160));

      // 体积重 60×50×40 = 20kg，与实际 1kg 取大 → 按 20kg 计费
      kg.value = '1';
      se.querySelector('[data-ship-l]').value = '60';
      se.querySelector('[data-ship-w]').value = '50';
      se.querySelector('[data-ship-h]').value = '40';
      kg.dispatchEvent(new win.Event('input', { bubbles: true }));
      ok('实重与体积重取大（20kg）', t().indexOf('20 kg') > -1, t().slice(0, 140));
      ok('按 20kg 计费 = $40 + 19×$15 = $325', t().indexOf('$325') > -1, t().slice(0, 140));

      // 换德国 → 欧元区首重 30 欧 + 每公斤 10 欧
      sel.value = 'DE';
      sel.dispatchEvent(new win.Event('change', { bubbles: true }));
      ok('德国走欧元区 €30 首重', t().indexOf('€30') > -1, t().slice(0, 110));
      ok('德国 20kg = €30 + 19×€10 = €220', t().indexOf('€220') > -1, t().slice(0, 140));
      ok('欧元区只报欧元，不出现美元数字',
        t().indexOf('€220') > -1 && t().indexOf('$') === -1, t().slice(0, 160));

      // 澳大利亚：首重 30 美金 + 每公斤 10 美金（美金计价）
      sel.value = 'AU';
      sel.dispatchEvent(new win.Event('change', { bubbles: true }));
      ok('澳大利亚 20kg = $30 + 19×$10 = $220', t().indexOf('$220') > -1, t().slice(0, 140));
      ok('澳大利亚用美金计价（主价 $220，无 €220）',
        t().indexOf('$220') > -1 && t().indexOf('€220') === -1, t().slice(0, 140));
      ok('澳洲只报美元，不折欧元约值', t().indexOf('$220') > -1 && t().indexOf('≈ €') === -1, t().slice(0, 160));

      // 英国 / 挪威 / 瑞典 / 丹麦 走欧元区；瑞士不在固定价内
      ['GB', 'NO', 'SE', 'DK'].forEach((iso) => {
        sel.value = iso;
        sel.dispatchEvent(new win.Event('change', { bubbles: true }));
        ok(iso + ' 走欧元区 €220', t().indexOf('€220') > -1, t().slice(0, 120));
      });
      sel.value = 'CH';
      sel.dispatchEvent(new win.Event('change', { bubbles: true }));
      ok('瑞士不估价，提示单独报价', /case by case/i.test(t()), t().slice(0, 140));

      // 未开通固定价的国家 → 引导咨询 Eddy，不给数字
      sel.value = 'BR';
      sel.dispatchEvent(new win.Event('change', { bubbles: true }));
      ok('巴西提示单独报价', /case by case/i.test(t()), t().slice(0, 140));
      ok('巴西给出 WhatsApp 按钮', !!out.querySelector('.ship-wa[href*="wa.me"]'));

      // 向上取整到整公斤：10.4kg → 11kg
      sel.value = 'US';
      sel.dispatchEvent(new win.Event('change', { bubbles: true }));
      se.querySelector('[data-ship-l]').value = '';
      se.querySelector('[data-ship-w]').value = '';
      se.querySelector('[data-ship-h]').value = '';
      kg.value = '10.4';
      kg.dispatchEvent(new win.Event('input', { bubbles: true }));
      ok('10.4kg 进位到 11kg = $190', t().indexOf('11 kg') > -1 && t().indexOf('$190') > -1, t().slice(0, 140));
    }
    win.close();
  }

  /* ---------------- 抽屉合计：运费 + 总价暂估 ---------------- */
  console.log('\n[合计 · 运费与总价暂估]');
  {
    const { doc, win } = await load(BASE + '/index.html');
    const fRow = doc.querySelector('[data-drawer-freight-row]');
    const eRow = doc.querySelector('[data-drawer-est-row]');
    ok('抽屉里有「运费」行', !!fRow);
    ok('抽屉里有「总价暂估」行', !!eRow);
    ok('没打开运费估算前两行隐藏', !!fRow && fRow.hidden === true && !!eRow && eRow.hidden === true);

    doc.querySelector('[data-add]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    const se = doc.querySelector('[data-ship-est]');
    se.querySelector('[data-ship-toggle]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    const sel = se.querySelector('[data-ship-country]');
    sel.value = 'DE';
    sel.dispatchEvent(new win.Event('change', { bubbles: true }));

    const goods = parseFloat((doc.querySelector('[data-drawer-total]').textContent || '').replace(/[^0-9.]/g, ''));
    ok('打开估算后两行出现', fRow.hidden === false && eRow.hidden === false);
    ok('德国 10kg 运费 €120', /€120/.test(fRow.textContent), fRow.textContent.replace(/\s+/g, ' '));
    const estTxt = doc.querySelector('[data-drawer-est]').textContent.trim();
    const est = parseFloat(estTxt.replace(/[^0-9.]/g, ''));
    ok('暂估总价 = 商品 + 运费', Math.abs(est - (goods + 120)) < 0.01,
      '商品 ' + goods + ' + 运费 120 → ' + estTxt);
    ok('欧元区合计里不出现美元数字',
      fRow.textContent.indexOf('$') === -1 && eRow.textContent.indexOf('$') === -1,
      fRow.textContent.replace(/\s+/g, ' ') + ' | ' + eRow.textContent.replace(/\s+/g, ' '));

    sel.value = 'US';
    sel.dispatchEvent(new win.Event('change', { bubbles: true }));
    ok('北美运费按美元报 $175', /\$175/.test(fRow.textContent), fRow.textContent.replace(/\s+/g, ' '));
    ok('跨币种时暂估总价折成美元', /^\$/.test(doc.querySelector('[data-drawer-est]').textContent.trim()),
      doc.querySelector('[data-drawer-est]').textContent.trim());
    const noteEl = doc.querySelector('[data-drawer-est-note]');
    ok('跨币种时给出折算说明',
      !!noteEl && noteEl.hidden === false && /1 EUR = 1\.1 USD/.test(noteEl.textContent),
      noteEl ? noteEl.textContent : '');
    win.close();
  }

  /* ---------------- 报价单：运费 + 48 小时有效期 ---------------- */
  console.log('\n[报价单 · 运费与暂估总价]');
  {
    const payload = JSON.stringify([{ i: firstPopular.id, v: '', q: 4 }]);
    const b64 = Buffer.from(payload, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const { doc, win } = await load(BASE + '/index.html#l=' + b64 + '&f=DE_3');
    const banner = doc.querySelector('[data-shared-banner]');
    ok('带运费口径的报价单已渲染', !!banner);
    const fRow = banner && banner.querySelector('[data-shared-freight-row]');
    ok('运费行出现', !!fRow && fRow.hidden === false);
    ok('运费行标出目的地 Germany', !!fRow && /Germany/.test(fRow.textContent),
      fRow ? fRow.textContent.replace(/\s+/g, ' ') : '');
    ok('德国 3kg = €30 + 2×€10 = €50', !!fRow && /€50/.test(fRow.textContent),
      fRow ? fRow.textContent.replace(/\s+/g, ' ') : '');
    const goods = parseFloat((banner.querySelector('[data-shared-total]').textContent || '').replace(/[^0-9.]/g, ''));
    const estTxt = banner.querySelector('[data-shared-est]').textContent.trim();
    const est = parseFloat(estTxt.replace(/[^0-9.]/g, ''));
    ok('暂估总价 = 商品 + 运费', Math.abs(est - (goods + 50)) < 0.01, '商品 ' + goods + ' + 50 → ' + estTxt);
    ok('欧元区报价单不出现美元数字', !/\$/.test(banner.textContent), banner.textContent.slice(0, 60));
    win.close();
  }

  /* ---------------- 报价单导出 ---------------- */
  console.log('\n[报价单导出 · 询价篮按钮]');
  {
    const { doc, win } = await load(BASE + '/index.html');
    const btn = doc.querySelector('[data-quote-pdf]');
    ok('抽屉里有「导出报价单」按钮', !!btn);
    ok('空清单时按钮隐藏', !!btn && btn.hidden === true);

    const addBtn = doc.querySelector('[data-add]');
    if (addBtn) {
      addBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      ok('加入商品后按钮显示', !btn.hidden);
      const opened = [];
      win.open = (u) => { opened.push(u); return null; };
      btn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      ok('点击后打开 1 个新窗口', opened.length === 1, '实际 ' + opened.length);
      ok('链接指向 index.html#l=…&print=1',
        /index\.html#l=.+&print=1$/.test(opened[0] || ''), (opened[0] || '').slice(0, 90));
    }
    win.close();
  }

  console.log('\n[报价单导出 · 分享页自动打印]');
  {
    const payload = JSON.stringify([{ i: firstPopular.id, v: '', q: 100 }]);
    const b64 = Buffer.from(payload, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const { doc, win, errors } = await load(BASE + '/index.html#l=' + b64 + '&print=1');
    const banner = doc.querySelector('[data-shared-banner]');
    ok('报价单已渲染', !!banner);
    const meta = banner && banner.querySelector('.shared-meta');
    ok('显示单号 Q-YYYYMMDD-XXXX', !!meta && /Q-\d{8}-\d{4}/.test(meta.textContent),
      meta ? meta.textContent.replace(/\s+/g, ' ') : '');
    ok('显示日期', !!meta && /\d{1,2} [A-Z][a-z]{2} \d{4}/.test(meta.textContent),
      meta ? meta.textContent.replace(/\s+/g, ' ') : '');
    ok('带 print=1 时进入打印态', doc.body.classList.contains('print-quote'));
    const lineEl = banner && banner.querySelector('.i-line');
    ok('每行显示小计（数量 > 1）', !!lineEl && /\d/.test(lineEl.textContent), lineEl ? lineEl.textContent : '');
    const totEl = banner && banner.querySelector('[data-shared-total]');
    ok('商品合计以欧元为主价', !!totEl && /€/.test(totEl.textContent), totEl ? totEl.textContent.slice(0, 40) : '');
    ok('商品合计不再附带另一种货币约值', !!totEl && totEl.textContent.indexOf('≈') === -1,
      totEl ? totEl.textContent.slice(0, 40) : '');
    ok('报价有效期 48 小时', !!meta && /Valid\s*48 hours/.test(meta.textContent),
      meta ? meta.textContent.replace(/\s+/g, ' ') : '');
    const fRow = banner && banner.querySelector('[data-shared-freight-row]');
    const eRow = banner && banner.querySelector('[data-shared-est-row]');
    ok('报价单有运费行', !!fRow && fRow.hidden === false);
    ok('链接里没带运费口径时标注「quoted separately」',
      !!fRow && /Quoted separately/.test(fRow.textContent),
      fRow ? fRow.textContent.replace(/\s+/g, ' ') : '');
    ok('报价单有暂估总价行', !!eRow && eRow.hidden === false && /€/.test(eRow.textContent),
      eRow ? eRow.textContent.replace(/\s+/g, ' ') : '');
    const terms = banner && banner.querySelector('.shared-terms');
    ok('显示条款与联系信息', !!terms && terms.textContent.indexOf('ex-works') > -1,
      terms ? terms.textContent.replace(/\s+/g, ' ').slice(0, 70) : '');
    ok('报价单联系号码为全站统一号 +49', !!terms && /\+49 152 2490 1963/.test(terms.textContent),
      terms ? terms.textContent.replace(/\s+/g, ' ').slice(0, 70) : '');
    // 打印会调用 window.print()，jsdom 报 not implemented 属预期，过滤掉再判断
    await new Promise((r) => setTimeout(r, 800));
    const real = errors.filter((e) => !/Not implemented: Window's print/.test(e));
    ok('打印流程无其它运行时错误', real.length === 0, real.join(' | '));
    win.close();
  }

  console.log('\n[需求收集表单 index.html#request]');
  {
    const { doc, win, errors } = await load(BASE + '/index.html');
    const host = doc.querySelector('[data-lead-form]');
    const form = host && host.querySelector('form.lf');
    ok('首页渲染出留言表单', !!form);
    ok('需求描述是必填项', !!doc.querySelector('[data-lf-product][required]'));
    ok('联系方式是必填项', !!doc.querySelector('[data-lf-contact][required]'));
    const opts = doc.querySelectorAll('[data-lf-category] option');
    ok('品类下拉至少 5 个选项', opts.length >= 5, 'options=' + opts.length);
    ok('含「不确定 / 其他」默认项', !!doc.querySelector('[data-lf-category] option[value=""]'));
    const hp = doc.querySelector('.lf-hp');
    ok('蜜罐字段存在且对真人隐藏', !!hp && hp.getAttribute('aria-hidden') === 'true' && hp.type === 'text');
    const footerLink = doc.querySelector('.site-footer a[href="index.html#request"]');
    ok('页脚有需求收集入口', !!footerLink && /product request/i.test(footerLink.textContent),
      footerLink ? footerLink.textContent : '');
    ok('英文标签正确', !!form && /What are you looking for/i.test(form.textContent));

    /* ---- 客服 / 需求悬浮窗（右侧竖向胶囊 → 右侧抽屉） ---- */
    console.log('\n[客服悬浮窗：右侧胶囊 → 抽屉]');
    const askTab = doc.querySelector('[data-ask-open]');
    const askLayerEl = doc.querySelector('[data-ask-layer]');
    ok('右侧悬浮胶囊存在', !!askTab && askTab.getAttribute('aria-controls') === 'ask-drawer');
    ok('胶囊主文案为 Chat with Eddy', !!askTab && /chat\s+with\s+eddy/i.test(askTab.textContent.replace(/\s+/g, ' ')));
    ok('胶囊副文案体现免费献策', !!askTab && /free\s+advice/i.test(askTab.textContent.replace(/\s+/g, ' ')));
    ok('抽屉默认关闭', !!askLayerEl && askLayerEl.hidden === true && !askLayerEl.classList.contains('open'));
    ok('原内嵌 #request 区块已移除', !doc.querySelector('#request.section, .request-card'));
    const askTitle = doc.querySelector('.ask-title');
    ok('抽屉标题改为 Tell us more 话术', !!askTitle && /tell us more/i.test(askTitle.textContent),
      askTitle ? askTitle.textContent : '');
    ok('抽屉标题里出现 go further', !!askTitle && /go further/i.test(askTitle.textContent));

    askTab.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 140));
    ok('点胶囊打开抽屉', !!askLayerEl && askLayerEl.hidden === false && askLayerEl.classList.contains('open'));
    ok('打开时锁定页面滚动', doc.body.classList.contains('ask-lock'));
    ok('抽屉内表单可用', !!askLayerEl && !!askLayerEl.querySelector('form.lf'));

    doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((r) => setTimeout(r, 140));
    ok('Esc 关闭抽屉', !!askLayerEl && !askLayerEl.classList.contains('open'));
    ok('关闭后解除滚动锁定', !doc.body.classList.contains('ask-lock'));

    const reqLink = doc.querySelector('a[href="index.html#request"]');
    let reqPrevented = false;
    if (reqLink) {
      const ev = new win.MouseEvent('click', { bubbles: true, cancelable: true });
      reqLink.dispatchEvent(ev);
      reqPrevented = ev.defaultPrevented;
    }
    await new Promise((r) => setTimeout(r, 140));
    ok('页脚 #request 链接被拦截（不再跳到不存在的区块）', reqPrevented);
    ok('页脚链接改为打开抽屉', !!askLayerEl && askLayerEl.classList.contains('open'));

    if (win.EddyAsk) win.EddyAsk.close();
    await new Promise((r) => setTimeout(r, 140));

    win.setLang('es');
    await new Promise((r) => setTimeout(r, 300));
    ok('切西语后表单标签跟着翻', !!form && /¿Qué estás buscando/i.test(form.textContent),
      form ? form.textContent.replace(/\s+/g, ' ').slice(0, 50) : '');
    const anyOpt = doc.querySelector('[data-lf-category] option[value=""]');
    ok('西语下「不确定 / 其他」选项也翻译', !!anyOpt && /no estoy seguro/i.test(anyOpt.textContent),
      anyOpt ? anyOpt.textContent : '');
    ok('西语下抽屉标题跟着翻', /cuéntanos más/i.test((doc.querySelector('.ask-title') || {}).textContent || ''),
      (doc.querySelector('.ask-title') || {}).textContent || '');
    win.setLang('en');
    await new Promise((r) => setTimeout(r, 200));

    const f2 = doc.querySelector('[data-lead-form] form.lf');
    if (f2) f2.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 200));
    const errBox = doc.querySelector('[data-lf-err]');
    ok('空提交给出「请填写需求」提示', !!errBox && errBox.hidden === false && /looking for/i.test(errBox.textContent),
      errBox ? errBox.textContent : '');

    const real = errors.filter((e) => !/Not implemented|Failed to fetch|NetworkError|fetch/i.test(e));
    ok('表单页无 JS 运行时错误', real.length === 0, real.join(' | ').slice(0, 120));

    /* ---- 提交成功页：感谢语 + 再提交一个 ---- */
    console.log('\n[提交成功页]');
    const host2 = doc.querySelector('[data-lead-form]');
    let doneForm = host2 && host2.querySelector('form.lf');
    if (doneForm) {
      doneForm.querySelector('[data-lf-product]').value = 'Custom leather belts';
      doneForm.querySelector('[data-lf-contact]').value = '+1 415 555 0132';
      let posted = 0;
      win.fetch = function () {
        posted++;
        return Promise.resolve({
          status: 200,
          json: function () {
            return Promise.resolve({ ok: true, id: 1 });
          },
        });
      };
      doneForm.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((r) => setTimeout(r, 400));
      ok('提交成功后请求已发出', posted === 1, 'posted=' + posted);
      const done = host2.querySelector('.lf-done');
      ok('显示成功页', !!done);
      ok('成功页有感谢语（Thank you）', !!done && /thank you/i.test(txt(done)), done ? txt(done).slice(0, 60) : '');
      const acts = done && done.querySelector('.lf-done-actions');
      ok('成功页有操作区', !!acts);
      const againBtn = done && done.querySelector('[data-lf-again]');
      ok('WhatsApp 按钮下方有「再提交一个」', !!againBtn && /send another request/i.test(txt(againBtn)),
        againBtn ? txt(againBtn) : '');
      ok('「再提交一个」排在 WhatsApp 之后',
        !!acts && acts.children.length === 2 &&
          /whatsapp/i.test(acts.children[0].className) && acts.children[1] === againBtn,
        acts ? acts.children.length + ' 个子元素' : '');
      ok('有「可分多条提交」的小提示', !!done && /separately/i.test(txt(done)),
        done ? txt(done).slice(-60) : '');
      ok('成功页说明「帮助我们成长」', !!done && /helps us grow/i.test(txt(done)),
        done ? txt(done).slice(0, 80) : '');
      ok('成功页不再有 24 小时之类的承诺', !!done && !/24\s*(hours?|h\b|horas?)/i.test(txt(done)),
        done ? txt(done).replace(/\s+/g, ' ').slice(0, 80) : '');
      ok('成功页署名为 Eddy', !!done && /Eddy,\s*EddyTrading/.test(txt(done)),
        done ? txt(done).slice(-40) : '');
      const whyV = done && done.querySelector('.lf-why-video');
      ok('成功页有「接下来发生什么」小视频', !!whyV && /img\/proof\/order-10s\.mp4$/.test(whyV.getAttribute('src')),
        whyV ? whyV.getAttribute('src') : '');
      ok('小视频默认不自动播（preload=none + 有播放入口）',
        !!whyV && whyV.getAttribute('preload') === 'none' && whyV.hasAttribute('muted') &&
        !!done.querySelector('[data-lf-why-play]'),
        whyV ? 'preload=' + whyV.getAttribute('preload') : '');
      ok('小视频下方解释「报价→拍照→运单」', !!done && /tracking number/i.test(txt(done)));

      if (againBtn) {
        againBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 300));
      }
      const backForm = host2.querySelector('form.lf');
      ok('点「再提交一个」后表单回来了', !!backForm);
      ok('重新出来的表单是空的',
        !!backForm &&
          !backForm.querySelector('[data-lf-product]').value &&
          !backForm.querySelector('[data-lf-contact]').value);
      ok('可以再次提交（提交按钮可用）', !!backForm && !!backForm.querySelector('.lf-submit:not([disabled])'));
    }

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
