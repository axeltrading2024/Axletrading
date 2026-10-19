/* ============================================================
 *  全站交互逻辑
 *  页面通过 <body data-page="home|product|category"> 区分
 * ============================================================ */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG;
  var PRODUCTS = window.PRODUCTS || [];
  var CATEGORIES = window.CATEGORIES || [];
  var STORAGE_KEY = 'eddysupply.inquiry.v1';
  var GALLERY_INTERVAL_MS = 2000; // 详情页主图轮播间隔（Eddy 定：2 秒一张）
  var GALLERY_DBLCLICK_MS = 320;  // 两次点击间隔小于此值 = 双击（取消选择型号）

  /* 兜底：万一 js/i18n.js 没加载成功（顺序错、被 CDN 拦、旧缓存），
     仍给 window.T 一个可用实现，避免整站脚本因 window.T 未定义而中断。
     只返回英文可读串，真实翻译仍由 i18n.js 提供。 */
  if (typeof window.T !== 'function') {
    window.T = function (key) {
      return String(key || '').replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
    };
  }

  /* ---------------- 工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /** 搜索归一化：小写 + 去空格 */
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }

  /* ---------------- 图片加载失败兜底（显示占位图，不借用分类图） ---------------- */
  var PLACEHOLDER_IMG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1efe8'/%3E%3Cg fill='none' stroke='%23b4b2a9' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='116' y='136' width='168' height='128' rx='14'/%3E%3Ccircle cx='168' cy='180' r='15'/%3E%3Cpath d='M128 250l46-42 34 30 38-38 26 26'/%3E%3C/g%3E%3C/svg%3E";
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && String(t.src).indexOf('data:image/svg+xml') !== 0) {
      t.src = PLACEHOLDER_IMG;
    }
  }, true);

  /* ---------------- 页脚：多栏（分类入口 / 公司 / 联系方式 / 交易说明） ---------------- */
  function renderFooter() {
    var el = document.querySelector('.site-footer');
    if (!el || !CFG) return;
    var year = new Date().getFullYear();
    var brand = esc(CFG.brand || 'EddySupply');
    var waDisp = esc(CFG.whatsappDisplay || '');
    var mail = esc(CFG.contactEmail || '');

    // Shop 栏：取前 6 个「有货」的分类
    var shop = CATEGORIES.filter(function (c) { return productsIn(c.slug).length > 0; }).slice(0, 6);
    var shopLinks = shop.map(function (c) {
      return '<li><a href="category.html?slug=' + esc(c.slug) + '">' + esc(c.name) + '</a></li>';
    }).join('');

    el.innerHTML = '' +
      '<div class="wrap footer-inner">' +
        '<div class="footer-grid">' +
          '<div class="footer-col footer-about">' +
            '<div class="footer-brand">' +
              '<span class="brand-mark">' + esc((CFG.brand || 'E').charAt(0)) + '</span>' +
              '<span class="footer-brand-name">' + brand + '</span>' +
            '</div>' +
            '<p class="footer-tagline" data-i18n-html="footer_tagline">Wholesale catalog of Axeltrading — electronics, perfumes, ' +
              'watches and accessories sourced for overseas retailers, Amazon sellers and dropshippers.</p>' +
            (CFG.whatsapp
              ? '<a class="footer-cta" data-wa-chat data-wa-text="Hi! I would like to ask about wholesale pricing." href="#">' +
                  ICON.whatsapp.replace('<svg', '<svg style="width:15px;height:15px"') + '<span data-i18n="chat_wa">Chat on WhatsApp</span></a>'
              : '') +
          '</div>' +
          (shopLinks
            ? '<div class="footer-col"><h4 data-i18n="footer_shop">Shop</h4><ul>' + shopLinks +
              '<li><a href="index.html#browse" data-i18n="footer_all">All collections</a></li></ul></div>'
            : '') +
          '<div class="footer-col"><h4 data-i18n="footer_company">Company</h4><ul>' +
            '<li><a href="about.html" data-i18n="nav_about">About Us</a></li>' +
            '<li><a href="about.html#faq" data-i18n="footer_faq">FAQ</a></li>' +
            '<li><a href="index.html#popular" data-i18n="footer_popular">Popular products</a></li>' +
            '<li><a href="about.html#how-it-works" data-i18n="footer_how">How it works</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4 data-i18n="footer_contact">Contact</h4><ul>' +
            (waDisp ? '<li><a href="' + esc(waLink('Hi! I have a question about your catalog.')) + '" target="_blank" rel="noreferrer">WhatsApp ' + waDisp + '</a></li>' : '') +
            (CFG.phoneBackup ? '<li><a href="tel:' + esc(String(CFG.phoneBackup).replace(/[^\d+]/g, '')) + '">' + esc(CFG.phoneBackup) + ' <span data-i18n="footer_backup">· calls &amp; backup</span></a></li>' : '') +
            (mail ? '<li><a href="mailto:' + mail + '?subject=' + encodeURIComponent('Wholesale inquiry') + '">' + mail + '</a></li>' : '') +
            '<li class="footer-plain" data-i18n="footer_reply">Reply within 24 hours</li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="footer-trade">' +
          '<span><b data-i18n="footer_payment">Payment</b> ' + esc(CFG.tradePayment || 'T/T · Alipay · USDT · Western Union · Remitly') + '</span>' +
          '<span><b data-i18n="footer_shipping">Shipping</b> ' + esc(CFG.tradeShipping || 'Worldwide, quoted per order') + '</span>' +
          '<span><b data-i18n="footer_moq">MOQ</b> ' + esc(CFG.tradeMoq || 'Low, flexible by item') + '</span>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>© <span data-year>' + year + '</span> ' + brand + '. All rights reserved.</span>' +
          '<span data-i18n="footer_wholesale_only">Wholesale only · no retail orders</span>' +
        '</div>' +
      '</div>';

    initWaChat();
  }

  /** 从 "$129" / "¥899" 里拆出货币符号和数值 */
  function parsePrice(p) {
    var m = String(p || '').match(/^([^\d\s]*)?\s*([\d.,]+)/);
    if (!m) return null;
    return { symbol: m[1] || '', value: parseFloat(m[2].replace(/,/g, '')) || 0 };
  }

  function param(name) {
    var m = location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  /* ---------------- 图标 ---------------- */
  var ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 2h6v4H9z"/><path d="M9 12h6M9 16h6"/></svg>',
    /* 彩色购物篮：绿色渐变篮身 + 白色提手/篮纹，比线框图标醒目 */
    basket: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="inqBasketG" x1="0" y1="0" x2="0.6" y2="1">' +
          '<stop offset="0" stop-color="#3ddc84"/><stop offset="1" stop-color="#12a05a"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="M8.3 9.3c0-2.6 1.5-4.3 3.7-4.3s3.7 1.7 3.7 4.3" fill="none" stroke="#0f8f4f" stroke-width="1.7" stroke-linecap="round"/>' +
      '<path d="M3.5 9.3h17l-1.7 8.5c-.22 1.15-1.23 1.98-2.4 1.98H7.6c-1.17 0-2.18-.83-2.4-1.98L3.5 9.3Z" fill="url(#inqBasketG)"/>' +
      '<path d="M9.3 12.2v4.6M14.7 12.2v4.6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity=".92"/>' +
    '</svg>',
    /* 白描边购物篮：用于黑底悬浮按钮（跟随 currentColor） */
    basketLine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3.5 9.3h17l-1.7 8.5c-.22 1.15-1.23 1.98-2.4 1.98H7.6c-1.17 0-2.18-.83-2.4-1.98L3.5 9.3Z"/>' +
      '<path d="M8.3 9.3c0-2.6 1.5-4.3 3.7-4.3s3.7 1.7 3.7 4.3"/>' +
    '</svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.4c0-1 1.1-1.6 1.9-1.1l8.6 6.6c.7.5.7 1.6 0 2.1l-8.6 6.6c-.8.6-1.9 0-1.9-1V5.4Z"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3.2"/><path d="m3.6 7.4 7.5 5.3c.54.38 1.26.38 1.8 0l7.5-5.3"/></svg>',
    chevLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    whatsapp: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M19.11 17.28c-.29-.15-1.71-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.23-.56-.47-.48-.65-.49l-.55-.01c-.19 0-.51.07-.77.36-.26.29-1 .98-1 2.4 0 1.42 1.03 2.79 1.17 2.98.15.19 2.02 3.08 4.9 4.32.68.29 1.22.46 1.63.59.68.22 1.31.19 1.8.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM16 4C9.37 4 4 9.37 4 16c0 2.11.55 4.09 1.52 5.8L4 28l6.35-1.67C12.03 27.4 13.97 28 16 28c6.63 0 12-5.37 12-12S22.63 4 16 4zm0 21.94c-1.83 0-3.55-.5-5.02-1.36l-.36-.21-3.77.99 1.01-3.67-.23-.38A9.87 9.87 0 0 1 6.06 16C6.06 10.51 10.51 6.06 16 6.06S25.94 10.51 25.94 16 21.49 25.94 16 25.94z"/></svg>',
  };

  /* ---------------- 数据查询 ---------------- */
  function getCategory(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    return null;
  }
  function getProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }
  function productsIn(slug) {
    return PRODUCTS.filter(function (p) { return p.collection === slug; });
  }
  function popularProducts() {
    return PRODUCTS.filter(function (p) { return p.popular; });
  }

  /** 搜索：名字开头 3 分 / 品牌开头 2 分 / 其它命中 1 分，按分排序 */
  function search(q, limit) {
    var n = norm(q);
    if (!n) return [];
    var scored = [];
    PRODUCTS.forEach(function (p) {
      var cat = getCategory(p.collection);
      var hay = norm([p.name, p.brand, p.note || '', p.desc || '', cat ? cat.name : '', (p.keywords || []).join(' ')].join(' '));
      if (hay.indexOf(n) === -1) return;
      var score = norm(p.name).indexOf(n) === 0 ? 3 : norm(p.brand).indexOf(n) === 0 ? 2 : 1;
      scored.push({ p: p, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var out = scored.map(function (s) { return s.p; });
    return typeof limit === 'number' ? out.slice(0, limit) : out;
  }

  /* ---------------- WhatsApp ---------------- */
  function waLink(text, num) {
    return 'https://wa.me/' + (num || CFG.whatsapp) + '?text=' + encodeURIComponent(
      text || CFG.greeting
    );
  }

  /** 把询价篮拼成一段话 */
  function buildInquiryMessage(items) {
    if (!items.length) return CFG.greeting;
    var lines = [CFG.inquiryIntro, ''];
    items.forEach(function (it, i) {
      var label = it.name + (it.variant ? ' [' + it.variant + ']' : '');
      lines.push((i + 1) + '. ' + label + ' (' + it.brand + ') — ' + it.price + ' × ' + it.qty);
    });
    lines.push('');
    lines.push(CFG.inquiryOutro);
    return lines.join('\n');
  }

  /** 询价篮条目唯一键：同产品不同型号是不同条目 */
  function itemKey(it) {
    return it.id + (it.variant ? '::' + it.variant : '');
  }

  /* ---------------- 起订量（MOQ） ---------------- */
  /** 从自由文本 MOQ 里取最小起订数量：'50 pcs per color' → 50；无有效数字 → 0（视为无限制） */
  function moqQty(p) {
    if (!p || !p.moq) return 0;
    var m = String(p.moq).match(/(\d+)/);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return n > 1 ? n : 0;   // 1 视为无限制（否则减号永远锁死）
  }

  /** 清单条目的 MOQ 下限 —— 按型号独立，实时查产品数据（后台改 MOQ 后自动跟随，不存本地副本） */
  function minQtyOf(it) {
    var p = it && it.id ? getProduct(it.id) : null;
    return p ? moqQty(p) : 0;
  }

  /** 把数量抬到起订量下限（无 MOQ / MOQ<=1 时原样返回） */
  function moqFloor(qty, minQ) {
    return (minQ > 1 && qty < minQ) ? minQ : qty;
  }

  /* ---------------- 专属分享链接（把询价清单编码进网址 #l=...） ---------------- */
  /** 清单 → base64url 字符串（只存 id/型号/数量，价格等打开时按最新数据渲染） */
  function encodeItems(items) {
    var arr = items.map(function (it) {
      return { i: it.id, v: it.variant || '', q: it.qty };
    });
    var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(arr))));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /** base64url 字符串 → 清单条目（过滤掉已下架的产品 id） */
  function decodeItems(str) {
    try {
      var s = str.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      var arr = JSON.parse(decodeURIComponent(escape(atob(s))));
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (x) { return x && x.i && getProduct(x.i); }).map(function (x) {
        var p = getProduct(x.i);
        var v = null;
        if (x.v && p.variants && p.variants.length) {
          p.variants.forEach(function (y) { if (y.name === x.v) v = y; });
        }
        return {
          id: p.id, variant: x.v || '', name: p.name, brand: p.brand,
          image: (v && v.image) ? v.image : p.image,
          price: (v && v.price) ? v.price : p.price,
          // 分享链接可能来自 MOQ 设定之前，qty 要按当前 MOQ 抬到下限，否则客户会带着低于起订量的数字来询价
          qty: moqFloor((parseInt(x.q, 10) > 0 ? Math.floor(parseInt(x.q, 10)) : 1), moqQty(p)),
        };
      });
    } catch (e) { return []; }
  }

  /** 当前清单 → 可复制的专属链接（始终指向首页，客户打开看到报价清单） */
  function buildShareUrl(items) {
    if (!items.length) return '';
    var base = location.origin + location.pathname.replace(/[^/]*$/, 'index.html');
    return base + '#l=' + encodeItems(items);
  }

  /** 复制文本到剪贴板（http 环境降级用 execCommand） */
  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast(okMsg); }
      catch (e) { toast(window.T('copy_failed')); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------------- 询价篮 ---------------- */
  var Store = {
    items: [],
    listeners: [],

    load: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return;
        this.items = arr.filter(function (it) { return it && it.id; }).map(function (it) {
          return {
            id: it.id,
            variant: it.variant || '',
            name: it.name || '',
            brand: it.brand || '',
            image: it.image || '',
            price: it.price || '',
            qty: typeof it.qty === 'number' && it.qty > 0 ? Math.floor(it.qty) : 1,
          };
        });
      } catch (e) { /* 忽略损坏的本地数据 */ }
      this.clampMoq();
    },

    /** MOQ 下限钳制：把低于起订量的条目拉到起订量。add/setQty/load 全部经过 save，故这是唯一收口 */
    clampMoq: function () {
      this.items.forEach(function (it) {
        it.qty = moqFloor(it.qty, minQtyOf(it));
      });
    },

    save: function () {
      this.clampMoq();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); } catch (e) {}
    },

    onChange: function (fn) { this.listeners.push(fn); },
    emit: function () { this.listeners.forEach(function (fn) { fn(Store.items); }); },

    has: function (key) { return this.items.some(function (it) { return itemKey(it) === key; }); },
    count: function () { return this.items.reduce(function (n, it) { return n + it.qty; }, 0); },

    add: function (product) {
      var key = itemKey(product);
      var existing = this.items.filter(function (it) { return itemKey(it) === key; })[0];
      if (existing) {
        existing.qty += 1;
      } else {
        this.items.push({
          id: product.id, variant: product.variant || '', name: product.name, brand: product.brand,
          image: product.image, price: product.price, qty: 1,
        });
      }
      this.save();
      this.emit();
    },

    setQty: function (key, qty) {
      if (qty <= 0) return this.remove(key);
      this.items.forEach(function (it) { if (itemKey(it) === key) it.qty = Math.floor(qty); });
      this.save();
      this.emit();
    },

    remove: function (key) {
      this.items = this.items.filter(function (it) { return itemKey(it) !== key; });
      this.save();
      this.emit();
    },

    clear: function () {
      this.items = [];
      this.save();
      this.emit();
    },

    total: function () {
      var symbol = '';
      var sum = 0;
      this.items.forEach(function (it) {
        var pr = parsePrice(it.price);
        if (!pr) return;
        if (!symbol) symbol = pr.symbol;
        sum += pr.value * it.qty;
      });
      return symbol ? symbol + sum.toLocaleString('en-US') : null;
    },
  };

  /* ---------------- 共用片段 ---------------- */
  function productCardHTML(p) {
    return '' +
      '<article class="product-card card-lift">' +
        '<a class="thumb" href="product.html?id=' + esc(p.id) + '">' +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' +
          (p.popular ? '<span class="badge-popular">Popular</span>' : '') +
          (p.video ? '<span class="badge-video">' + ICON.play.replace('<svg', '<svg style="width:9px;height:9px"') + 'Video</span>' : '') +
        '</a>' +
        '<div class="body">' +
          '<div class="min-w-0">' +
            '<p class="eyebrow card-eyebrow"' + (p.brand ? '' : ' hidden') + '>' + esc(p.brand) + '</p>' +
            '<div class="row">' +
              '<h3 class="name">' + esc(p.name) + '</h3>' +
              '<span class="price">' + esc(p.price) + '</span>' +
            '</div>' +
            '<p class="note">' + esc(p.note) + '</p>' +
          '</div>' +
          '<button type="button" class="add btn btn-sm btn-outline add-btn" data-add="' + esc(p.id) + '">' +
            '<span class="ico">' + ICON.plus + '</span><span class="lbl" data-i18n="add_to_inquiry">Add to Inquiry</span>' +
          '</button>' +
        '</div>' +
      '</article>';
  }

  /* 详情页主图画廊：**主图永远作为第 1 张参与轮播**，后面接 p.images（合计最多 4 张，自动去重）。
     单图时只渲染静态图（无箭头/圆点/缩略图）；多图时启用轮播控件。 */
  function productGalleryHTML(p) {
    var imgs = [];
    if (p.image) imgs.push(p.image);
    (p.images || []).forEach(function (src) {
      if (src && imgs.indexOf(src) === -1 && imgs.length < 4) imgs.push(src);
    });
    imgs = imgs.filter(Boolean);
    if (!imgs.length) {
      return '<div class="gallery-stage gallery-empty"><div class="gallery-empty-ph">📷</div></div>';
    }
    var multi = imgs.length > 1;
    var stage = imgs.map(function (src, i) {
      return '<img class="gallery-img' + (i === 0 ? ' is-active' : '') + '"' +
        (i === 0 ? ' data-variant-img' : ' loading="lazy"') +
        ' src="' + esc(src) + '" alt="' + esc(p.name) + (multi ? ' · ' + (i + 1) : '') + '">';
    }).join('');
    var nav = multi
      ? '<button type="button" class="gallery-nav prev" data-gal-prev aria-label="Previous image">‹</button>' +
        '<button type="button" class="gallery-nav next" data-gal-next aria-label="Next image">›</button>' +
        '<div class="gallery-dots" data-gal-dots>' +
          imgs.map(function (_, i) {
            return '<button type="button" class="dot' + (i === 0 ? ' is-active' : '') + '" data-gal-go="' + i + '" aria-label="Image ' + (i + 1) + '"></button>';
          }).join('') +
        '</div>'
      : '';
    var thumbs = multi
      ? '<div class="gallery-thumbs" data-gal-thumbs>' +
          imgs.map(function (src, i) {
            return '<button type="button" class="thumb' + (i === 0 ? ' is-active' : '') + '" data-gal-go="' + i + '"><img src="' + esc(src) + '" alt=""></button>';
          }).join('') +
        '</div>'
      : '';
    var video = p.video
      ? '<video class="detail-video" data-detail-video src="' + esc(p.video) + '" controls playsinline preload="metadata" style="display:none"></video>' +
        '<button type="button" class="video-toggle" data-video-toggle data-i18n="watch_video">▶ Watch video</button>'
      : '';
    return '<div class="gallery-stage">' + stage + nav + video + '</div>' + thumbs;
  }

  function categoryCardHTML(c) {
    var empty = productsIn(c.slug).length === 0;
    return '' +
      '<a href="category.html?slug=' + esc(c.slug) + '" class="cat-card card-lift cat-' + esc(c.slug) + '">' +
        '<div class="media">' +
          (empty ? '<span class="badge-soon">Coming soon</span>' : '') +
          '<img src="' + esc(c.image) + '" alt="' + esc(c.name) + '" loading="lazy">' +
        '</div>' +
        '<div class="foot">' +
          '<p class="eyebrow">' + esc(c.tagline) + '</p>' +
          '<h3>' + esc(c.name) + '</h3>' +
        '</div>' +
      '</a>';
  }

  /* ---------------- 全局骨架（header / 抽屉 / FAB / 页脚） ---------------- */
  function mountChrome() {
    var headerHost = $('[data-header]');
    if (headerHost) {
      headerHost.outerHTML = '' +
        '<header class="site-header"><div class="wrap">' +
          '<a class="brand" href="index.html">' +
            '<span class="brand-mark">' + esc(CFG.brand.charAt(0)) + '</span>' +
            '<span class="brand-name">' + esc(CFG.brand) + '</span>' +
          '</a>' +
          '<nav class="site-nav">' +
            '<a href="index.html" data-nav="home" data-i18n="nav_home">Home</a>' +
            '<a href="index.html#popular" data-nav="popular" data-i18n="nav_popular">Popular</a>' +
            '<a href="index.html#browse" data-nav="browse" data-i18n="nav_browse">Browse</a>' +
            '<a href="index.html#about" data-nav="about" data-i18n="nav_about">About Us</a>' +
          '</nav>' +
          '<div class="header-actions">' +
            '<button type="button" class="nav-search" data-open-search aria-label="Search products" title="Search products (Ctrl+K)">' +
              ICON.search +
            '</button>' +
            '<span class="lang-switch" data-lang-switch></span>' +
            '<button type="button" class="inquiry-toggle" data-open-inquiry aria-label="Open inquiry list">' +
              '<span class="inq-ico">' + ICON.basket + '</span><span class="inq-label" data-i18n="inquiry">Inquiry</span><span class="inquiry-count" data-inquiry-count>0</span>' +
            '</button>' +
            '<button type="button" class="nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">' +
              ICON.menu +
            '</button>' +
          '</div>' +
        '</div>' +
        /* 手机端下拉菜单（>=640px 隐藏） */
        '<div class="mobile-nav" id="mobile-nav" data-mobile-nav>' +
          '<button type="button" class="mnav-search" data-open-search>' +
            ICON.search.replace('<svg', '<svg style="width:17px;height:17px"') + '<span data-i18n="search_aria">Search products</span></button>' +
          '<nav>' +
            '<a href="index.html" data-i18n="nav_home">Home</a>' +
            '<a href="index.html#popular" data-i18n="nav_popular">Popular products</a>' +
            '<a href="index.html#browse" data-i18n="nav_browse">Browse collections</a>' +
            '<a href="about.html" data-i18n="nav_about">About Us</a>' +
            '<a href="about.html#faq" data-i18n="footer_faq">FAQ</a>' +
          '</nav>' +
          '<div class="mobile-nav-foot">' +
            (CFG.whatsapp
              ? '<a class="btn btn-whatsapp" data-wa-chat data-wa-text="Hi! I would like to ask about wholesale pricing." href="#">' +
                  ICON.whatsapp.replace('<svg', '<svg style="width:17px;height:17px"') + '<span data-i18n="chat_wa">Chat on WhatsApp</span></a>'
              : '') +
            (CFG.contactEmail
              ? '<a class="btn btn-outline" href="mailto:' + esc(CFG.contactEmail) + '">' + esc(CFG.contactEmail) + '</a>'
              : '') +
          '</div>' +
        '</div>' +
        '</header>';
    }

    // 抽屉 + 遮罩 + toast + FAB
    var frag = document.createElement('div');
    frag.innerHTML = '' +
      '<div class="drawer-backdrop" data-drawer-backdrop></div>' +
      '<aside class="drawer" data-drawer aria-hidden="true">' +
        '<div class="drawer-head">' +
          '<div>' +
            '<h2 data-i18n="drawer_title">Inquiry list</h2>' +
            '<p class="count" data-drawer-count>0 items</p>' +
          '</div>' +
          '<button type="button" class="drawer-close" data-close-inquiry aria-label="Close">' + ICON.close + '</button>' +
        '</div>' +
        '<div class="drawer-body" data-drawer-body></div>' +
        shipEstHTML() +
        '<div class="drawer-foot">' +
          '<div class="total"><span data-i18n="products_total">Products total</span><b data-drawer-total>—</b></div>' +
          '<button type="button" class="btn btn-whatsapp" data-send-inquiry>' +
            ICON.whatsapp.replace('<svg', '<svg style="width:18px;height:18px"') + '<span data-i18n="send_wa">Send on WhatsApp</span>' +
          '</button>' +
          '<button type="button" class="quote-dl" data-quote-pdf hidden>' +
            '<span class="qd-ico" aria-hidden="true">⤓</span><span data-i18n="quote_pdf">Download quote (PDF)</span>' +
          '</button>' +
          '<button type="button" class="share" data-share-link data-i18n="copy_link">🔗 Copy share link</button>' +
          '<button type="button" class="clear" data-clear-inquiry data-i18n="clear_list">Clear list</button>' +
        '</div>' +
      '</aside>' +
      '<a class="wa-fab" data-wa-fab href="#" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">' + ICON.whatsapp + '</a>' +
      /* 询盘接待面板（从询价篮的 Send on WhatsApp 进入，不再单独放悬浮图标） */
      '<div class="inquiry-backdrop" data-inquiry-backdrop></div>' +
      '<aside class="inquiry-panel" data-inquiry-panel aria-hidden="true">' +
        '<div class="inquiry-panel-head">' +
          '<div>' +
            '<h2 data-i18n="inquiry_title">Inquiry</h2>' +
            '<p class="count" data-i18n="inquiry_sub">Tell us what you need — we reply within 24h.</p>' +
          '</div>' +
          '<button type="button" class="inquiry-close" data-close-inquiry-form aria-label="Close">' + ICON.close + '</button>' +
        '</div>' +
        '<form class="inquiry-form" data-inquiry-form novalidate>' +
          '<label><span><span data-i18n="inquiry_name">Name</span> <em class="req">*</em></span>' +
            '<input name="name" autocomplete="name" maxlength="60" required>' +
            '<em class="f-err" data-err="name"></em></label>' +
          '<label><span><span data-i18n="inquiry_phone">Phone number</span> <em class="req">*</em></span>' +
            '<input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" placeholder="+1 415 555 0100" required>' +
            '<em class="f-err" data-err="phone"></em></label>' +
          '<label><span data-i18n="inquiry_address">Address</span>' +
            '<input name="address" autocomplete="street-address" maxlength="120" data-i18n-ph="inquiry_address_ph" placeholder="Street, building, apt.">' +
            '<em class="f-err" data-err="address"></em></label>' +
          '<div class="inquiry-row">' +
            '<label><span data-i18n="inquiry_city">City</span>' +
              '<input name="city" autocomplete="address-level2" maxlength="40">' +
              '<em class="f-err" data-err="city"></em></label>' +
            '<label><span data-i18n="inquiry_province">Province</span>' +
              '<input name="province" autocomplete="address-level1" maxlength="40">' +
              '<em class="f-err" data-err="province"></em></label>' +
          '</div>' +
          '<div class="inquiry-row">' +
            '<label><span><span data-i18n="inquiry_zip">City zip code</span> <em class="req">*</em></span>' +
              '<input name="zip" inputmode="numeric" autocomplete="postal-code" maxlength="12">' +
              '<em class="f-err" data-err="zip"></em></label>' +
            '<label><span><span data-i18n="inquiry_country">Country</span> <em class="req">*</em></span>' +
              '<select name="country" autocomplete="country" data-inquiry-country>' + countryOptionsHtml('') + '</select>' +
              '<em class="f-err" data-err="country"></em></label>' +
          '</div>' +
          '<label><span data-i18n="inquiry_email">Email</span>' +
            '<input name="email" type="email" autocomplete="email" maxlength="80">' +
            '<em class="f-err" data-err="email"></em></label>' +
          '<label><span data-i18n="inquiry_products">Products you need</span><textarea name="products" rows="2" data-inquiry-products data-i18n-ph="inquiry_products_ph" placeholder="e.g. RIMOWA style × 50, AirPods × 20"></textarea></label>' +
          '<p class="inquiry-note" data-i18n="inquiry_note">Fields marked * are required. We only use these details to prepare your quote.</p>' +
          '<button type="submit" class="btn btn-whatsapp" data-i18n="inquiry_submit_fast">Get a fast quote</button>' +
          '<button type="button" class="btn btn-outline inquiry-now" data-send-products-now data-i18n="inquiry_send_now">Send products now</button>' +
        '</form>' +
      '</aside>' +
      /* 顶栏搜索浮层：任何页面都能直接搜（复用首页那套产品检索） */
      '<div class="search-modal" data-search-modal aria-hidden="true">' +
        '<div class="search-modal-backdrop" data-close-search></div>' +
        '<div class="search-modal-card" role="dialog" aria-modal="true" aria-label="Search products">' +
          '<div class="smod-field">' +
            '<span class="smod-ico">' + ICON.search + '</span>' +
            '<input type="search" data-sm-input placeholder="Search product, brand, category…" aria-label="Search products" autocomplete="off" data-i18n-ph="search_placeholder">' +
            '<button type="button" class="smod-close" data-close-search aria-label="Close search">' + ICON.close + '</button>' +
          '</div>' +
          '<div class="smod-body" data-sm-body>' +
            '<p class="smod-hint" data-i18n="search_hint">Type to search across all 1000+ products — brand, product name or category.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      /* 右下角黑底悬浮购物车：随时可打开询价清单 */
      '<button type="button" class="cart-fab" data-open-inquiry aria-label="Open inquiry list">' +
        '<span class="cart-fab-ico">' + ICON.basketLine + '</span>' +
        '<span class="cart-fab-text" data-i18n="inquiry">Inquiry</span>' +
        '<span class="inquiry-count" data-inquiry-count>0</span>' +
      '</button>' +
      '<div class="toast" data-toast></div>';
    document.body.appendChild(frag);

    var fab = $('[data-wa-fab]');
    if (fab) fab.href = waLink();

    // 当前导航高亮：分类页/详情页归到 Browse（否则这两页顶栏永远不高亮）
    var page = document.body.getAttribute('data-page');
    if (page === 'category' || page === 'product') page = 'browse';
    $$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === page) a.classList.add('is-active');
    });
  }

  /* ---------------- 询价抽屉 ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  function openDrawer(open) {
    var d = $('[data-drawer]');
    var b = $('[data-drawer-backdrop]');
    if (!d || !b) return;
    d.classList.toggle('open', open);
    b.classList.toggle('open', open);
    d.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  /* ---------------- 询盘接待面板开关 ---------------- */
  function productsField() { return $('[data-inquiry-products]'); }
  function cartProductLine() {
    var items = Store.items || [];
    return items.map(function (it) {
      return it.name + (it.variant ? ' [' + it.variant + ']' : '') + ' × ' + it.qty;
    }).join(', ');
  }
  /** 往「产品」输入框里追加一条（已存在则不重复） */
  function setInquiryCtx(name) {
    var el = productsField();
    if (!el || !name) return;
    var cur = el.value.trim();
    if (cur.indexOf(name) > -1) return;
    el.value = cur ? cur + ', ' + name : name;
  }
  function openInquiryForm(prefillProduct, forceCart) {
    var p = $('[data-inquiry-panel]');
    var b = $('[data-inquiry-backdrop]');
    if (p) { p.classList.add('open'); p.setAttribute('aria-hidden', 'false'); }
    if (b) b.classList.add('open');
    document.body.style.overflow = 'hidden';
    // 自动带出：商品页传进来的产品名优先，其次用询价篮里已选的品
    if (prefillProduct) setInquiryCtx(prefillProduct);
    var el = productsField();
    if (el && (forceCart || !el.value.trim())) {
      var fromCart = cartProductLine();
      if (fromCart) el.value = fromCart;
    }
  }
  function closeInquiryForm() {
    var p = $('[data-inquiry-panel]');
    var b = $('[data-inquiry-backdrop]');
    if (p) { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); }
    if (b) b.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ============================================================
   *  询盘表单校验（国家 / 区号 / 邮编 / 拦乱写）
   *  原则：只硬拦「格式确定是错的」，不猜客户是不是在开玩笑；
   *        真实客户被误拦的代价远大于放过一条乱填。
   * ============================================================ */

  /* 国家表：[ISO2, EN, ES, 国际区号, 邮编正则(null=该国无邮编), 邮编示例, [国内号码位数下限, 上限]]
     号码位数按「国内有效位」算（不含国际区号；英国/德国等前导 0 会自动忽略） */
  var COUNTRIES = [
    ['US', 'United States', 'Estados Unidos', '1', /^\d{5}(-\d{4})?$/, '90210', [10, 10]],
    ['CA', 'Canada', 'Canadá', '1', /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'K1A 0B1', [10, 10]],
    ['MX', 'Mexico', 'México', '52', /^\d{5}$/, '01000', [10, 10]],
    ['GB', 'United Kingdom', 'Reino Unido', '44', /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/, 'SW1A 1AA', [10, 10]],
    ['DE', 'Germany', 'Alemania', '49', /^\d{5}$/, '10115', [6, 11]],
    ['FR', 'France', 'Francia', '33', /^\d{5}$/, '75001', [9, 9]],
    ['ES', 'Spain', 'España', '34', /^\d{5}$/, '28001', [9, 9]],
    ['IT', 'Italy', 'Italia', '39', /^\d{5}$/, '20100', [9, 10]],
    ['NL', 'Netherlands', 'Países Bajos', '31', /^\d{4}\s?[A-Z]{2}$/, '1012 AB', [9, 9]],
    ['BE', 'Belgium', 'Bélgica', '32', /^\d{4}$/, '1000', [8, 9]],
    ['AT', 'Austria', 'Austria', '43', /^\d{4}$/, '1010', [7, 12]],
    ['CH', 'Switzerland', 'Suiza', '41', /^\d{4}$/, '8001', [9, 9]],
    ['SE', 'Sweden', 'Suecia', '46', /^\d{3}\s?\d{2}$/, '111 22', [7, 10]],
    ['NO', 'Norway', 'Noruega', '47', /^\d{4}$/, '0150', [8, 8]],
    ['DK', 'Denmark', 'Dinamarca', '45', /^\d{4}$/, '1050', [8, 8]],
    ['FI', 'Finland', 'Finlandia', '358', /^\d{5}$/, '00100', [8, 10]],
    ['IE', 'Ireland', 'Irlanda', '353', /^[A-Z]\d{2}\s?[A-Z\d]{4}$/, 'D02 X285', [7, 9]],
    ['PT', 'Portugal', 'Portugal', '351', /^\d{4}-?\d{3}$/, '1000-001', [9, 9]],
    ['PL', 'Poland', 'Polonia', '48', /^\d{2}-?\d{3}$/, '00-001', [9, 9]],
    ['CZ', 'Czechia', 'Chequia', '420', /^\d{3}\s?\d{2}$/, '110 00', [9, 9]],
    ['GR', 'Greece', 'Grecia', '30', /^\d{3}\s?\d{2}$/, '105 57', [10, 10]],
    ['HU', 'Hungary', 'Hungría', '36', /^\d{4}$/, '1011', [8, 9]],
    ['RO', 'Romania', 'Rumanía', '40', /^\d{6}$/, '010011', [9, 9]],
    ['TR', 'Türkiye', 'Turquía', '90', /^\d{5}$/, '34000', [10, 10]],
    ['AU', 'Australia', 'Australia', '61', /^\d{4}$/, '2000', [9, 9]],
    ['NZ', 'New Zealand', 'Nueva Zelanda', '64', /^\d{4}$/, '1010', [8, 10]],
    ['CN', 'China', 'China', '86', /^\d{6}$/, '100000', [11, 11]],
    ['HK', 'Hong Kong SAR, China', 'Hong Kong (RAE de China)', '852', null, '', [8, 8]],
    ['TW', 'Taiwan, China', 'Taiwán, China', '886', /^\d{3}(\d{2})?$/, '100', [9, 9]],
    ['JP', 'Japan', 'Japón', '81', /^\d{3}-?\d{4}$/, '100-0001', [9, 10]],
    ['KR', 'South Korea', 'Corea del Sur', '82', /^\d{5}$/, '04524', [9, 10]],
    ['SG', 'Singapore', 'Singapur', '65', /^\d{6}$/, '018956', [8, 8]],
    ['MY', 'Malaysia', 'Malasia', '60', /^\d{5}$/, '50000', [7, 10]],
    ['TH', 'Thailand', 'Tailandia', '66', /^\d{5}$/, '10110', [9, 9]],
    ['VN', 'Vietnam', 'Vietnam', '84', /^\d{5,6}$/, '100000', [9, 10]],
    ['IN', 'India', 'India', '91', /^\d{6}$/, '110001', [10, 10]],
    ['ID', 'Indonesia', 'Indonesia', '62', /^\d{5}$/, '10110', [9, 12]],
    ['PH', 'Philippines', 'Filipinas', '63', /^\d{4}$/, '1000', [10, 10]],
    ['PK', 'Pakistan', 'Pakistán', '92', /^\d{5}$/, '44000', [10, 10]],
    ['AE', 'United Arab Emirates', 'Emiratos Árabes Unidos', '971', null, '', [9, 9]],
    ['SA', 'Saudi Arabia', 'Arabia Saudita', '966', /^\d{5}$/, '11564', [9, 9]],
    ['IL', 'Israel', 'Israel', '972', /^\d{5}(\d{2})?$/, '6100001', [9, 9]],
    ['BR', 'Brazil', 'Brasil', '55', /^\d{5}-?\d{3}$/, '01310-100', [10, 11]],
    ['AR', 'Argentina', 'Argentina', '54', /^([A-Z]\d{4}[A-Z]{3}|\d{4})$/, 'C1000ABC', [10, 11]],
    ['CL', 'Chile', 'Chile', '56', /^\d{7}$/, '8320000', [9, 9]],
    ['CO', 'Colombia', 'Colombia', '57', /^\d{6}$/, '110111', [10, 10]],
    ['PE', 'Peru', 'Perú', '51', /^\d{5}$/, '15001', [9, 9]],
    ['ZA', 'South Africa', 'Sudáfrica', '27', /^\d{4}$/, '0001', [9, 9]],
    ['EG', 'Egypt', 'Egipto', '20', /^\d{5}$/, '11511', [9, 10]],
    ['NG', 'Nigeria', 'Nigeria', '234', /^\d{6}$/, '100001', [9, 10]],
    ['MA', 'Morocco', 'Marruecos', '212', /^\d{5}$/, '10000', [9, 9]],
    ['KE', 'Kenya', 'Kenia', '254', /^\d{5}$/, '00100', [9, 9]]
  ];
  /* 兜底项放最后（不参与排序）：区号未知、邮编规则宽松 */
  var COUNTRY_OTHER = ['OTHER', 'Other country', 'Otro país', '',
    /^[A-Z0-9][A-Z0-9\s-]{1,9}$/, '12345', [6, 15]];

  var COUNTRY_BY_ISO = {};
  (function () {
    COUNTRIES.sort(function (a, b) { return a[1].localeCompare(b[1]); });
    COUNTRIES.push(COUNTRY_OTHER);
    COUNTRIES.forEach(function (c) { COUNTRY_BY_ISO[c[0]] = c; });
  })();

  function countryLabel(c) {
    var lang = (window.getLang && window.getLang()) || 'en';
    return lang === 'es' ? (c[2] || c[1]) : c[1];
  }
  function countryOptionsHtml(selected) {
    var html = '<option value="">' + esc(window.T('inquiry_country_ph')) + '</option>';
    COUNTRIES.forEach(function (c) {
      html += '<option value="' + c[0] + '"' + (c[0] === selected ? ' selected' : '') + '>' +
        esc(countryLabel(c)) + '</option>';
    });
    return html;
  }
  /** 语言切换后重建国家下拉（保留已选值） */
  function translateCountryOptions() {
    var sel = $('[data-inquiry-country]');
    if (sel) sel.innerHTML = countryOptionsHtml(sel.value || '');
    // 运费估算里的国家下拉（选项更少，只有国家，没有手机号/邮编规则）
    var shipSel = $('[data-ship-country]');
    if (shipSel) {
      var keep = shipSel.value || 'US';
      shipSel.innerHTML = shipCountryOptionsHtml(keep);
      shipSel.value = keep;
      renderShipEst();
    }
  }

  /** 运费估算的国家下拉：按运费区（北美 / 欧洲 / 澳新 / 其他）分组 */
  function shipCountryOptionsHtml(selected) {
    var R = window.SHIPPING_RATES;
    var want = selected || 'US';
    var inZone = {};
    var html = '';
    ((R && R.zones) || []).forEach(function (z) {
      var list = (z.countries || []).map(function (iso) { return COUNTRY_BY_ISO[iso]; })
        .filter(Boolean)
        .sort(function (a, b) { return countryLabel(a).localeCompare(countryLabel(b)); });
      // 美国是默认目的地，始终排在本组第一
      for (var i = 0; i < list.length; i++) {
        if (list[i][0] === 'US') { list.unshift(list.splice(i, 1)[0]); break; }
      }
      if (!list.length) return;
      html += '<optgroup label="' + esc(zoneLabel(z)) + '">';
      list.forEach(function (c) {
        inZone[c[0]] = 1;
        html += '<option value="' + c[0] + '"' + (c[0] === want ? ' selected' : '') + '>' +
          esc(countryLabel(c)) + '</option>';
      });
      html += '</optgroup>';
    });
    var rest = '';
    COUNTRIES.forEach(function (c) {
      if (c[0] === 'OTHER' || inZone[c[0]]) return;
      rest += '<option value="' + c[0] + '"' + (c[0] === want ? ' selected' : '') + '>' +
        esc(countryLabel(c)) + '</option>';
    });
    rest += '<option value="OTHER"' + (want === 'OTHER' ? ' selected' : '') + '>' +
      esc(window.T('ship_other_country')) + '</option>';
    html += '<optgroup label="' + esc(window.T('ship_zone_other')) + '">' + rest + '</optgroup>';
    return html;
  }

  function zoneLabel(z) {
    var lang = (window.getLang && window.getLang()) || 'en';
    return lang === 'es' ? (z.es || z.en) : (z.en || z.id);
  }

  function transitLabel(z) {
    var lang = (window.getLang && window.getLang()) || 'en';
    var t = z && z.transit;
    if (!t) return '';
    return lang === 'es' ? (t.es || t.en) : (t.en || '');
  }

  /** 运费用到的国家名（纯文本，供提示语与 WhatsApp 文案） */
  function shipCountryName(iso) {
    if (!iso || iso === 'OTHER') return window.T('ship_other_country');
    var c = COUNTRY_BY_ISO[iso];
    return c ? countryLabel(c) : window.T('ship_other_country');
  }

  /* 明显乱写的词（键盘就近敲出来的那一类） */
  var MASH_WORDS = {
    asd: 1, asda: 1, asdas: 1, asdad: 1, asdasd: 1, asdsad: 1, asdf: 1, asdfg: 1, asdfgh: 1,
    dsa: 1, sda: 1, ads: 1, dad: 1, dadd: 1, ddd: 1,
    qwe: 1, qwer: 1, qwert: 1, qwerty: 1, zxc: 1, zxcv: 1, xcvb: 1,
    test: 1, tests: 1, testing: 1, abc: 1, abcd: 1, abcabc: 1,
    xxx: 1, xxxx: 1, aaa: 1, aaaa: 1, sss: 1, nnn: 1, nnnn: 1, ffff: 1,
    nil: 1, null: 1, none: 1, asdfasdf: 1
  };
  /* 键盘横向连击 ≥4 键（含反向）；3 键会误伤 Albert / Robert 这类真名，故不做 */
  var KEY_RUNS = (function () {
    var rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], out = [];
    rows.forEach(function (r) {
      for (var i = 0; i + 4 <= r.length; i++) {
        var w = r.slice(i, i + 4);
        out.push(w, w.split('').reverse().join(''));
      }
    });
    return out;
  })();

  /* 3 键连击：asd / qwe 这类在真实人名地名里不会出现，可以安全做子串判断
     （'ert'、'wer' 会误伤 Albert、Werner，所以不收） */
  var MASH_RUNS_3 = ['asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'zxc', 'xcv', 'cvb', 'vbn', 'bnm', 'qwe', 'qaz', 'wsx', 'edc'];

  /* 允许的「文字字符」：拉丁（含重音）、希腊、西里尔、希伯来、阿拉伯、中日韩 */
  var LETTERS = 'A-Za-z\\u00c0-\\u024f\\u0370-\\u03ff\\u0400-\\u04ff\\u0590-\\u05ff\\u0600-\\u06ff\\u3040-\\u30ff\\u4e00-\\u9fa5';
  var RE_WORDS = new RegExp("^[" + LETTERS + "][ " + LETTERS + "'’.\\-]*$");

  function normLetters(v) {
    return (v || '').toLowerCase().replace(new RegExp('[^' + LETTERS + ']', 'g'), '');
  }
  /** 疑似乱敲：词表命中 / 键盘连击 / 两段重复(dada) / 同字 3 连 / 只有一种字母 / 长串无元音
   *  全大写缩写（CDMX / NSW / UAE）不套「无元音」这条，否则会被误判 */
  function looksMash(v) {
    var raw = (v || '').trim();
    var s = normLetters(raw);
    if (!s || s.length < 2) return false;
    if (MASH_WORDS[s]) return true;
    for (var m = 0; m < MASH_RUNS_3.length; m++) if (s.indexOf(MASH_RUNS_3[m]) > -1) return true;
    for (var i = 0; i < KEY_RUNS.length; i++) if (s.indexOf(KEY_RUNS[i]) > -1) return true;
    if (s.length >= 4 && s.length % 2 === 0 && s.slice(0, s.length / 2) === s.slice(s.length / 2)) return true;
    if (/(.)\1{2,}/.test(s)) return true;
    var uniq = {};
    for (var j = 0; j < s.length; j++) uniq[s[j]] = 1;
    if (s.length >= 3 && Object.keys(uniq).length < 2) return true;
    var allCaps = /[A-Z]/.test(raw) && raw === raw.toUpperCase();
    if (!allCaps && s.length >= 4 && !/[aeiouy\u00e0-\u00ff]/.test(s)) return true;
    return false;
  }

  /** 整串是同一个数字 / 经典顺序号（1234567、0123456、9876543）→ 假号
   *  只认 0/1 开头的升序和 9 开头的降序：像日本 90-1234-5678
   *  这种真实号码本身带递增片段，不能一律当假号。 */
  function looksFakeNumber(d) {
    if (/^(\d)\1{5,}$/.test(d)) return true;
    if (d.length >= 6) {
      var inc = true, dec = true;
      for (var i = 1; i < d.length; i++) {
        var diff = (+d.charAt(i) - +d.charAt(i - 1) + 10) % 10;
        if (diff !== 1) inc = false;
        if (diff !== 9) dec = false;
      }
      var head = d.charAt(0);
      if (inc && (head === '0' || head === '1')) return true;
      if (dec && head === '9') return true;
    }
    return false;
  }

  function vName(v) {
    v = (v || '').trim();
    if (!v) return { k: 'inquiry_err_name' };
    if (v.length < 2) return { k: 'inquiry_err_name_short' };
    if (v.length > 60 || !RE_WORDS.test(v)) return { k: 'inquiry_err_name_chars' };
    if (looksMash(v)) return { k: 'inquiry_err_junk' };
    return null;
  }
  function vCity(v, isProvince) {
    v = (v || '').trim();
    if (!v) return null;
    if (v.length < 2) return { k: 'inquiry_err_city_short' };
    if (v.length > 40 || !RE_WORDS.test(v)) return { k: 'inquiry_err_city_chars' };
    if (looksMash(v)) return { k: 'inquiry_err_junk' };
    return null;
  }
  function vAddress(v) {
    v = (v || '').trim();
    if (!v) return null;
    if (v.length < 5) return { k: 'inquiry_err_addr_short' };
    if (v.length > 120) return { k: 'inquiry_err_addr_long' };
    if (normLetters(v).length < 3) return { k: 'inquiry_err_addr_short' };
    if (!/\d/.test(v) && looksMash(v)) return { k: 'inquiry_err_junk' };
    return null;
  }
  function vEmail(v) {
    v = (v || '').trim();
    if (!v) return null;
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v) ? null : { k: 'inquiry_err_email' };
  }
  function vPhone(raw, iso) {
    var s = (raw || '').trim();
    if (!s) return { k: 'inquiry_err_phone' };
    if (/[^\d+\s()\-.]/.test(s)) return { k: 'inquiry_err_phone_chars' };
    var plus = s.charAt(0) === '+';
    var d = s.replace(/\D/g, '');
    var c = COUNTRY_BY_ISO[iso];
    if (c && c[3]) {
      var dial = c[3], lo = c[6][0], hi = c[6][1];
      if (plus) {
        if (d.indexOf(dial) !== 0) {
          return { k: 'inquiry_err_phone_dial', p: { dial: '+' + dial, country: countryLabel(c) } };
        }
        d = d.slice(dial.length);
      } else if (d.indexOf('00' + dial) === 0) {
        d = d.slice(2 + dial.length);
      }
      if (!d) return { k: 'inquiry_err_phone' };
      // 国内长途前导 0（英国 07… / 德国 017…）不算有效位
      if (!plus && d.charAt(0) === '0' && d.length > hi) d = d.slice(1);
      if (d.length < lo || d.length > hi) {
        return { k: 'inquiry_err_phone_len', p: { min: lo, max: hi, country: countryLabel(c) } };
      }
    } else if (d.length < 6 || d.length > 15) {
      return { k: 'inquiry_err_phone_len_generic' };
    }
    if (looksFakeNumber(d)) return { k: 'inquiry_err_phone_fake' };
    return null;
  }
  function vZip(raw, iso) {
    var v = (raw || '').trim().toUpperCase().replace(/\s+/g, ' ');
    var c = COUNTRY_BY_ISO[iso];
    if (!c) {
      if (!v) return null;
      if (!/^[A-Z0-9][A-Z0-9\s-]{1,9}$/.test(v)) return { k: 'inquiry_err_zip_chars' };
      return looksMash(v) ? { k: 'inquiry_err_junk' } : null;
    }
    if (!c[4]) return null;                       // 该国无邮编（香港 / 阿联酋）
    if (!v) return { k: 'inquiry_err_zip_req', p: { ex: c[5], country: countryLabel(c) } };
    if (!c[4].test(v)) return { k: 'inquiry_err_zip_fmt', p: { ex: c[5], country: countryLabel(c) } };
    // 兜底国家（OTHER）的邮编规则很宽松，额外拦一下乱敲（asda / dada）
    if (c[0] === 'OTHER' && looksMash(v)) return { k: 'inquiry_err_junk' };
    return null;
  }

  /* ---------------- 运费估算（抽屉内折叠面板） ---------------- */
  function shipEstHTML() {
    var R = window.SHIPPING_RATES;
    if (!R || !R.zones) return '';
    var opts = shipCountryOptionsHtml();
    return '' +
      '<div class="ship-est" data-ship-est>' +
        '<button type="button" class="ship-toggle" data-ship-toggle aria-expanded="false">' +
          '<span class="ship-ico" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/>' +
              '<path d="M3 7.5 12 12l9-4.5M12 12v9"/>' +
            '</svg>' +
          '</span>' +
          '<span class="ship-lbl" data-i18n="ship_title">Estimate shipping</span>' +
          '<span class="ship-caret" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="ship-body" data-ship-body hidden>' +
          '<div class="ship-row">' +
            '<label class="ship-dest"><span data-i18n="ship_dest">Destination</span>' +
              '<select data-ship-country>' + opts + '</select></label>' +
          '</div>' +
          '<div class="ship-row">' +
            '<label><span data-i18n="ship_weight">Actual weight (kg)</span>' +
              '<input type="number" min="0" step="0.1" value="10" inputmode="decimal" data-ship-kg></label>' +
            '<div class="ship-dims">' +
              '<span class="ship-dims-l" data-i18n="ship_dims">Box size (cm)</span>' +
              '<div class="ship-dims-in">' +
                '<input type="number" min="0" step="1" placeholder="L" inputmode="numeric" data-ship-l>' +
                '<span>×</span>' +
                '<input type="number" min="0" step="1" placeholder="W" inputmode="numeric" data-ship-w>' +
                '<span>×</span>' +
                '<input type="number" min="0" step="1" placeholder="H" inputmode="numeric" data-ship-h>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ship-out" data-ship-out></div>' +
          '<p class="ship-note" data-i18n="ship_note">Indicative only — final freight is confirmed with your quotation.</p>' +
        '</div>' +
      '</div>';
  }

  /** 重算并渲染运费结果 */
  function renderShipEst() {
    var host = $('[data-ship-est]');
    if (!host) return;
    var out = $('[data-ship-out]', host);
    if (!out) return;
    function val(sel) { var el = $(sel, host); return el ? el.value : ''; }
    var iso = val('[data-ship-country]') || 'US';
    var q = shipQuote(iso, val('[data-ship-kg]'),
      val('[data-ship-l]'), val('[data-ship-w]'), val('[data-ship-h]'));

    // 未开通固定价的国家：给一句说明 + 直接问 Eddy
    if (q && q.quoteOnly) {
      var cname = shipCountryName(iso);
      out.innerHTML = '' +
        '<p class="ship-quote-only">' + esc(window.T('ship_quote_only', { country: cname })) + '</p>' +
        '<a class="ship-wa" href="' + esc(waLink('Hi Eddy! What is the shipping cost to ' + cname + '?')) +
          '" target="_blank" rel="noreferrer">' +
          ICON.whatsapp.replace('<svg', '<svg style="width:15px;height:15px"') +
          '<span>' + esc(window.T('ship_quote_cta')) + '</span></a>';
      return;
    }
    if (!q) {
      out.innerHTML = '<p class="ship-empty">' + esc(window.T('ship_empty')) + '</p>';
      return;
    }
    var sym = q.currency === 'USD' ? '$' : (q.currency === 'EUR' ? '€' : q.currency + ' ');
    var lines = [];
    lines.push('<div class="sr"><span>' + esc(window.T('ship_chargeable')) + '</span><b>' + fmtKg(q.bill) + ' kg</b></div>');
    if (q.vol > 0) {
      lines.push('<div class="sr"><span>' + esc(window.T('ship_vol')) + '</span><b>' + fmtKg(q.vol) + ' kg</b></div>');
    }
    lines.push('<div class="sr"><span>' + esc(window.T('ship_first')) + '</span><b>' + money(q.base, sym) + '</b></div>');
    if (q.extra > 0) {
      lines.push('<div class="sr"><span>' + esc(window.T('ship_extra', { n: q.extra })) + '</span>' +
        '<b>' + money(q.extra * q.perKg, sym) + '</b></div>');
    }
    out.innerHTML = '<div class="ship-lines">' + lines.join('') + '</div>' +
      '<div class="ship-total"><span>' + esc(window.T('ship_estimate')) + '</span>' +
        '<b>' + money(q.cost, sym) + '</b></div>' +
      fxApproxHtml(q.cost, q.currency, true) +
      '<p class="ship-transit">' + esc(window.T('ship_transit', { d: transitLabel(q.zone) })) + '</p>';
  }

  function initShipping() {
    var host = $('[data-ship-est]');
    if (!host) return;
    var tog = $('[data-ship-toggle]', host);
    var body = $('[data-ship-body]', host);
    if (tog && body) {
      tog.addEventListener('click', function () {
        var willOpen = body.hasAttribute('hidden');
        if (willOpen) body.removeAttribute('hidden');
        else body.setAttribute('hidden', '');
        host.classList.toggle('is-open', willOpen);
        tog.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (willOpen) renderShipEst();
      });
    }
    host.addEventListener('input', function (e) {
      if (e.target.closest('[data-ship-kg],[data-ship-l],[data-ship-w],[data-ship-h]')) renderShipEst();
    });
    host.addEventListener('change', function (e) {
      if (e.target.closest('[data-ship-country]')) renderShipEst();
    });
    renderShipEst();
  }

  function renderInquiry() {
    var body = $('[data-drawer-body]');
    var cntEl = $('[data-inquiry-count]');
    var cntAll = $$('[data-inquiry-count]');
    var dCnt = $('[data-drawer-count]');
    var totalEl = $('[data-drawer-total]');
    var sendEl = $('[data-send-inquiry]');
    var n = Store.count();

    cntAll.forEach(function (el) {
      el.textContent = n;
      el.classList.toggle('has-items', n > 0);
    });
    if (dCnt) dCnt.textContent = window.T('drawer_count', { n: n });
    if (totalEl) {
      var dtxt = Store.total();
      if (!dtxt) {
        totalEl.textContent = '—';
      } else {
        var dsum = 0, dcur = '';
        Store.items.forEach(function (it) {
          var pr = parsePrice(it.price);
          if (!pr) return;
          if (!dcur) dcur = symToCurrency(pr.symbol);
          dsum += pr.value * it.qty;
        });
        totalEl.innerHTML = esc(dtxt) + (dcur ? fxApproxHtml(dsum, dcur) : '');
      }
    }
    if (sendEl) {
      var disabled = n === 0;
      sendEl.style.opacity = disabled ? '0.45' : '1';
      sendEl.style.pointerEvents = disabled ? 'none' : 'auto';
    }
    var shareEl = $('[data-share-link]');
    if (shareEl) {
      shareEl.style.opacity = n === 0 ? '0.45' : '1';
      shareEl.style.pointerEvents = n === 0 ? 'none' : 'auto';
    }
    var quoteEl = $('[data-quote-pdf]');
    if (quoteEl) quoteEl.hidden = n === 0;   // 空清单不显示「导出报价单」

    if (!body) return;
    if (!Store.items.length) {
      body.innerHTML = '<div class="drawer-empty">' + window.T('drawer_empty') + '</div>';
      return;
    }
    body.innerHTML = Store.items.map(function (it) {
      var key = itemKey(it);
      var minQ = minQtyOf(it);
      var atMin = minQ > 1 && it.qty <= minQ;   // 已到起订量 → 减号锁定
      return '' +
        '<div class="inq-item">' +
          '<img src="' + esc(it.image) + '" alt="' + esc(it.name) + '">' +
          '<div class="info">' +
            '<p class="i-name">' + esc(it.name) + (it.variant ? ' <span class="i-var">· ' + esc(it.variant) + '</span>' : '') + '</p>' +
            '<p class="i-brand">' + esc(it.brand) + '</p>' +
            '<p class="i-price">' + esc(it.price) + '</p>' +
            '<div class="qty">' +
              '<button type="button" data-qty="' + esc(key) + '" data-delta="-1" aria-label="Decrease"' +
                (atMin ? ' data-moqlock="1" aria-disabled="true"' : '') + '>−</button>' +
              '<span class="n">' + it.qty + '</span>' +
              '<button type="button" data-qty="' + esc(key) + '" data-delta="1" aria-label="Increase">+</button>' +
            '</div>' +
            (minQ > 1 ? '<p class="i-moq">' + esc(window.T('moq_min_label', { n: minQ })) + '</p>' : '') +
          '</div>' +
          '<button type="button" class="inq-remove" data-remove="' + esc(key) + '" aria-label="Remove">' + ICON.trash + '</button>' +
        '</div>';
    }).join('');
  }

  /** 同步所有「Add to Inquiry」按钮的状态 */
  function syncAddButtons() {
    $$('[data-add]').forEach(function (btn) {
      var key = itemKey({ id: btn.getAttribute('data-add'), variant: btn.getAttribute('data-variant') || '' });
      var inList = Store.has(key);
      btn.classList.toggle('btn-in-cart', inList);
      btn.classList.toggle('btn-outline', !inList);
      btn.setAttribute('aria-pressed', inList ? 'true' : 'false');
      var lbl = $('.lbl', btn);
      if (lbl) lbl.textContent = inList ? window.T('in_inquiry_list') : window.T('add_to_inquiry');
      var ico = $('.ico', btn);
      if (ico) ico.innerHTML = inList ? ICON.check : ICON.plus;
    });
  }

  var bumpTimer = null;
  var bumpSuppress = false; // 飞入动画期间先不跳动，等「飞到位」再跳
  function bumpCount() {
    if (bumpSuppress) return;
    // 跳动与光环保持在同一处：优先右下角浮动购物车
    var el = $('.cart-fab [data-inquiry-count]') || $('[data-inquiry-count]');
    if (!el) return;
    el.classList.remove('inquiry-bump');
    void el.offsetWidth; // 强制重排以重启动画
    el.classList.add('inquiry-bump');
    clearTimeout(bumpTimer);
  }

  /** 飞到购物篮时的「接住」脉冲光环 */
  function catchPulse() {
    var btn = $('.cart-fab') || $('.inquiry-toggle') || $('[data-open-inquiry]');
    if (!btn) return;
    btn.classList.remove('inquiry-catch');
    void btn.offsetWidth;
    btn.classList.add('inquiry-catch');
  }

  /** 取某个产品（可带型号）用于飞行动画的缩略图 */
  function flyImageFor(id, variant) {
    var p = getProduct(id);
    if (!p) return '';
    if (variant && p.variants) {
      for (var i = 0; i < p.variants.length; i++) {
        if (p.variants[i].name === variant && p.variants[i].image) return p.variants[i].image;
      }
    }
    return p.image || '';
  }

  /**
   * 点击 Add to Inquiry 后，让商品小图从按钮/卡片图片「飞入」右上角购物篮。
   * fromEl 为被点击的按钮；使用 fixed 定位 + 视口坐标，兼容粘性头部。
   */
  function flyToCart(fromEl, id, variant) {
    // 终点优先用右下角浮动购物车，回退到导航栏购物篮
    var target = $('.cart-fab') || $('.inquiry-toggle');
    if (!target || !fromEl) { catchPulse(); return; }
    // 尊重系统的「减少动效」设置
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bumpCount(); catchPulse(); return;
    }

    // 起点优先用卡片/详情页上的商品图，找不到就用按钮本身
    var card = fromEl.closest('article');
    var srcImg = card
      ? card.querySelector('.thumb img, .media img')
      : (fromEl.closest('.detail-actions') ? document.querySelector('.detail-media img') : null);
    var startEl = srcImg || fromEl;

    var f = startEl.getBoundingClientRect();
    var t = target.getBoundingClientRect();
    if (!f.width || !t.width) { bumpCount(); catchPulse(); return; }

    var size = 52;
    var sx = f.left + f.width / 2 - size / 2;
    var sy = f.top + f.height / 2 - size / 2;
    var tx = t.left + t.width / 2 - size / 2;
    var ty = t.top + t.height / 2 - size / 2;

    var fly = document.createElement('div');
    fly.className = 'fly-to-cart';
    fly.style.width = size + 'px';
    fly.style.height = size + 'px';
    fly.style.left = sx + 'px';
    fly.style.top = sy + 'px';
    var imgUrl = flyImageFor(id, variant);
    fly.innerHTML = '<img src="' + esc(imgUrl) + '" alt="">';
    document.body.appendChild(fly);

    // 弧线路径：中途往上抛一点（并保证不会飞出屏幕顶部）
    var arc = Math.min(140, Math.abs(ty - sy) * 0.45 + 36);
    var mx = (sx + tx) / 2 - 24;
    var my = Math.min(sy, ty) - arc;
    if (my < 8) my = 8;

    var anim;
    try {
      anim = fly.animate([
        { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
        { transform: 'translate(' + (mx - sx) + 'px,' + (my - sy) + 'px) scale(1.15)', opacity: 1, offset: 0.5 },
        { transform: 'translate(' + (tx - sx) + 'px,' + (ty - sy) + 'px) scale(0.28)', opacity: 0.9 },
      ], { duration: 680, easing: 'cubic-bezier(.32,.72,.36,1)', fill: 'forwards' });
    } catch (e) {
      fly.parentNode && fly.parentNode.removeChild(fly);
      bumpCount(); catchPulse(); return;
    }
    anim.onfinish = function () {
      if (fly.parentNode) fly.parentNode.removeChild(fly);
      bumpCount();
      catchPulse();
    };
  }

  function addProduct(id, variant, silent) {
    var p = getProduct(id);
    if (!p) return;
    var v = null;
    if (variant && p.variants && p.variants.length) {
      p.variants.forEach(function (x) { if (x.name === variant) v = x; });
    }
    Store.add({
      id: p.id,
      variant: v ? v.name : '',
      name: p.name,
      brand: p.brand,
      image: v ? v.image : p.image,
      price: v ? (v.price || p.price) : p.price,
      qty: 1,
    });
    if (!silent) toast(window.T('toast_added', { name: p.name + (v ? ' [' + v.name + ']' : '') }));
  }

  /* ---------------- 全局事件委托 ---------------- */
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var t = e.target;

      var addBtn = t.closest('[data-add]');
      if (addBtn) {
        var addId = addBtn.getAttribute('data-add');
        var addVar = addBtn.getAttribute('data-variant') || '';
        bumpSuppress = true;            // 先不跳动，等商品图飞到位再跳
        addProduct(addId, addVar);
        bumpSuppress = false;
        flyToCart(addBtn, addId, addVar);
        return;
      }

      if (t.closest('[data-open-inquiry]')) { openDrawer(true); return; }
      if (t.closest('[data-close-inquiry]') || t.closest('[data-drawer-backdrop]')) { openDrawer(false); return; }

      // 询价篮里的「Send on WhatsApp」→ 先打开接待表单（产品自动带入），不再直接跳 WhatsApp
      if (t.closest('[data-send-inquiry]')) {
        e.preventDefault();
        openDrawer(false);
        openInquiryForm(null, true);
        var pf = productsField();
        if (pf && window.matchMedia && window.matchMedia('(min-width: 900px)').matches) pf.focus();
        return;
      }

      if (t.closest('[data-open-inquiry-form]')) { openInquiryForm(null, true); return; }
      if (t.closest('[data-close-inquiry-form]') || t.closest('[data-inquiry-backdrop]')) { closeInquiryForm(); return; }
      var prodInq = t.closest('[data-inquiry-product-trigger]');
      if (prodInq) { openInquiryForm(prodInq.getAttribute('data-product-name')); return; }

      var qtyBtn = t.closest('[data-qty]');
      if (qtyBtn) {
        var key = qtyBtn.getAttribute('data-qty');
        var delta = parseInt(qtyBtn.getAttribute('data-delta'), 10);
        var cur = Store.items.filter(function (it) { return itemKey(it) === key; })[0];
        if (cur) {
          var minQ = minQtyOf(cur);
          // 减号到起订量就停：静默钳制会让人以为按钮坏了，所以明确提示
          if (cur.qty + delta < minQ) {
            qtyBtn.classList.remove('shake');
            void qtyBtn.offsetWidth;
            qtyBtn.classList.add('shake');
            toast(window.T('toast_moq_min', { n: minQ }));
            return;
          }
          Store.setQty(key, cur.qty + delta);
        }
        return;
      }

      var rmBtn = t.closest('[data-remove]');
      if (rmBtn) { Store.remove(rmBtn.getAttribute('data-remove')); return; }

      if (t.closest('[data-clear-inquiry]')) {
        if (Store.items.length) { Store.clear(); toast(window.T('toast_cleared')); }
        return;
      }

      if (t.closest('[data-share-link]')) {
        var url = buildShareUrl(Store.items);
        if (url) copyText(url, window.T('toast_share'));
        return;
      }

      /* 导出报价单：复用分享链接的数据编码，带 &print=1 打开后自动唤起打印（浏览器「另存为 PDF」） */
      if (t.closest('[data-quote-pdf]')) {
        var qUrl = buildShareUrl(Store.items);
        if (!qUrl) return;
        openDrawer(false);
        window.open(qUrl + '&print=1', '_blank', 'noopener');
        return;
      }

      var sqBtn = t.closest('[data-sqty]');
      if (sqBtn) {
        var sIdx = parseInt(sqBtn.getAttribute('data-sqty'), 10);
        var sDelta = parseInt(sqBtn.getAttribute('data-delta'), 10);
        if (sharedItems[sIdx]) {
          var sCur = sharedItems[sIdx];
          var sMin = minQtyOf(sCur);
          if (sCur.qty + sDelta < sMin) {
            sqBtn.classList.remove('shake');
            void sqBtn.offsetWidth;
            sqBtn.classList.add('shake');
            toast(window.T('toast_moq_min', { n: sMin }));
            return;
          }
          sCur.qty = Math.max(1, sCur.qty + sDelta);
          renderSharedQuote();
        }
        return;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { openDrawer(false); closeInquiryForm(); }
    });

    Store.onChange(function () {
      renderInquiry();
      syncAddButtons();
      bumpCount();
    });
  }

  /* ---------------- 语言切换时重新渲染动态文案 ---------------- */
  function applyHeroLang() {
    var lang = window.getLang ? window.getLang() : 'en';
    var titleEl = $('[data-hero-title]');
    if (titleEl) {
      titleEl.innerHTML = esc(lang === 'es' && CFG.heroTitleEs ? CFG.heroTitleEs : CFG.heroTitle) + '<br><span class="accent">' + esc(lang === 'es' && CFG.heroTitleAccentEs ? CFG.heroTitleAccentEs : CFG.heroTitleAccent) + '</span>';
    }
    var subEl = $('[data-hero-sub]');
    if (subEl) subEl.textContent = lang === 'es' && CFG.heroSubtitleEs ? CFG.heroSubtitleEs : CFG.heroSubtitle;
    var badgeEl = $('[data-hero-badge]');
    if (badgeEl) badgeEl.textContent = CFG.heroBadge || (CFG.brand + ' · genuine supplier');
    var phEl = $('[data-search-input]');
    if (phEl) {
      var narrow = window.matchMedia && window.matchMedia('(max-width: 639px)').matches;
      var phEs = lang === 'es' && CFG.searchPlaceholderEs ? CFG.searchPlaceholderEs : '';
      phEl.placeholder = narrow ? (CFG.searchPlaceholderShort || (phEs || 'Search products…')) : (phEs || CFG.searchPlaceholder);
    }
  }

  /** 语言切换后：刷新当前页的动态文案（数据驱动、无 data-i18n 的部分） */
  window.__translateDynamic = function () {
    var page = document.body.getAttribute('data-page');
    if (page === 'product') initProduct();
    else if (page === 'category') initCategory();
    else applyHeroLang();
    renderInquiry();
    syncAddButtons();
    // 国家下拉的国家名随语言重建（保留已选项）
    translateCountryOptions();
    var mstat = $('[data-about-stat]');
    if (mstat) {
      var mcats = CATEGORIES.filter(function (c) { return productsIn(c.slug).length > 0; }).slice(0, 6);
      mstat.textContent = window.T('about_stat', { n: mcats.length });
    }
  };

  /* ============================================================
   *  首页
   * ============================================================ */
  function initHome() {
    // Hero 文案（含搜索框占位符，随语言切换）
    applyHeroLang();

    // 主推品区块已移除（2026-09-03 需求），首页直接进入热门产品

    // 热门轮播
    var scroller = $('[data-popular]');
    if (scroller) {
      scroller.innerHTML = popularProducts().map(function (p) {
        return '<div class="slide">' + productCardHTML(p) + '</div>';
      }).join('');
      var prev = $('[data-carousel-prev]');
      var next = $('[data-carousel-next]');
      var step = function () { return Math.min(scroller.clientWidth * 0.8, 340); };

      // 无缝循环播放：把整组卡片克隆一份接在尾部，滚入克隆区后瞬时回位（前后内容相同，肉眼不可见）
      var setWidth = 0;
      var realCount = scroller.children.length;
      if (realCount) {
        Array.prototype.slice.call(scroller.children).forEach(function (el) {
          var c = el.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          scroller.appendChild(c);
        });
        setWidth = scroller.children[realCount].offsetLeft - scroller.children[0].offsetLeft;
      }
      // 滚动停稳后：若已进入克隆区，瞬时跳回等价的真实位置
      // 注意：容器 CSS 有 scroll-behavior: smooth，直接赋值 scrollLeft 也会带动画（看起来就是"退回去"），
      // 必须临时改成 auto 再赋值，才是真正的瞬时无缝跳转
      var settleTimer = null;
      function snapBack() {
        if (setWidth <= 0 || scroller.scrollLeft < setWidth) return;
        scroller.style.scrollBehavior = 'auto';
        scroller.scrollLeft -= setWidth;
        scroller.style.scrollBehavior = '';
      }
      scroller.addEventListener('scroll', function () {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(snapBack, 80);
      });

      // 每 2 秒自动播放一格；悬停/触摸暂停，移开后继续；用户偏好减少动效时不启用
      var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var autoTimer = null;
      function tick() {
        try { scroller.scrollBy({ left: step(), behavior: 'smooth' }); } catch (e) { /* 环境不支持平滑滚动时静默跳过 */ }
      }
      function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
      function startAuto() {
        if (reduceMotion || autoTimer) return;
        autoTimer = setInterval(tick, 2000);
      }
      scroller.addEventListener('mouseenter', stopAuto);
      scroller.addEventListener('mouseleave', startAuto);
      scroller.addEventListener('touchstart', stopAuto, { passive: true });
      scroller.addEventListener('touchend', startAuto);
      if (prev) prev.onclick = function () {
        stopAuto();
        try {
          if (setWidth > 0 && scroller.scrollLeft < step()) {
            scroller.style.scrollBehavior = 'auto';
            scroller.scrollLeft += setWidth;
            scroller.style.scrollBehavior = '';
          }
          scroller.scrollBy({ left: -step(), behavior: 'smooth' });
        } catch (e) { /* 同上 */ }
        startAuto();
      };
      if (next) next.onclick = function () { stopAuto(); tick(); startAuto(); };
      startAuto();
    }

    // 分类网格
    var grid = $('[data-categories]');
    if (grid) grid.innerHTML = CATEGORIES.map(categoryCardHTML).join('');

    bindSearch();
  }

  /** Hero 主推图跟随鼠标做 3D 倾斜 */
  function bindTilt() {
    var stage = $('[data-tilt]');
    var img = $('[data-tilt-img]');
    if (!stage || !img) return;
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduce) return;

    img.addEventListener('mousemove', function (e) {
      var r = img.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform =
        'translateY(-6px) rotateX(' + (-py * 16).toFixed(2) + 'deg) rotateY(' + (px * 20).toFixed(2) + 'deg) scale(1.02)';
    });
    img.addEventListener('mouseleave', function () {
      stage.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }

  /** 搜索框：下拉建议 + 回车跳转 */
  function bindSearch() {
    var input = $('[data-search-input]');
    var shell = $('[data-search-shell]');
    if (!input || !shell) return;

    var panel = null;
    var active = -1;

    function close() {
      if (panel) { panel.remove(); panel = null; }
      active = -1;
    }

    function open(results) {
      close();
      panel = document.createElement('div');
      panel.className = 'search-suggest';
      panel.innerHTML = results.length
        ? results.map(function (p) {
            return '<a class="suggest-item" href="product.html?id=' + esc(p.id) + '">' +
              '<img src="' + esc(p.image) + '" alt="">' +
              '<span><span class="s-name">' + esc(p.name) + '</span><br>' +
              '<span class="s-meta">' + esc(p.brand) + ' · ' + esc(p.price) + '</span></span></a>';
          }).join('')
        : '<div class="suggest-empty">' + window.T('search_no_match') + '</div>';
      shell.appendChild(panel);
    }

    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (!q) return close();
      open(search(q, 6));
    });

    input.addEventListener('keydown', function (e) {
      if (!panel) return;
      var items = $$('.suggest-item', panel);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (el, i) { el.classList.toggle('is-active', i === active); });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0 && items[active]) { location.href = items[active].href; return; }
        var first = search(input.value.trim(), 1)[0];
        if (first) location.href = 'product.html?id=' + encodeURIComponent(first.id);
      } else if (e.key === 'Escape') {
        close();
      }
    });

    document.addEventListener('click', function (e) {
      if (!shell.contains(e.target)) close();
    });
  }

  /* ---------------- 顶栏搜索浮层（P1-6） ----------------
     让分类页 / 详情页 / About 页也能直接搜产品，不必先回首页。 */
  function initHeaderSearch() {
    var modal = $('[data-search-modal]');
    var input = $('[data-sm-input]');
    var body = $('[data-sm-body]');
    var triggers = $$('[data-open-search]');
    if (!modal || !input || !body || !triggers.length) return;

    var active = -1;
    var hint = '<p class="smod-hint" data-i18n="search_hint">Type to search across all 1000+ products — brand, product name or category.</p>';

    function render(list, q) {
      if (!q) { body.innerHTML = hint; active = -1; return; }
      if (!list.length) {
        body.innerHTML = '<div class="suggest-empty">No products match “' + esc(q) + '”.<br>' +
          'Try a brand (Dior, Dyson), a category (Perfumes, Watches) or ask us on WhatsApp.</div>';
        active = -1;
        return;
      }
      body.innerHTML = '<div class="smod-list">' + list.map(function (p) {
        return '<a class="suggest-item" href="product.html?id=' + esc(p.id) + '">' +
          '<img src="' + esc(p.image) + '" alt="" loading="lazy">' +
          '<span><span class="s-name">' + esc(p.name) + '</span><br>' +
          '<span class="s-meta">' + esc(p.brand) + ' · ' + esc(p.price) + '</span></span></a>';
      }).join('') + '</div>' +
        '<a class="smod-all" href="index.html#browse">Browse all collections →</a>';
      active = -1;
    }

    function open() {
      // 手机上从汉堡菜单进来时，先把菜单收起来
      var mnav = $('[data-mobile-nav]');
      var mtog = $('[data-nav-toggle]');
      if (mnav) mnav.classList.remove('is-open');
      if (mtog) { mtog.classList.remove('is-open'); mtog.setAttribute('aria-expanded', 'false'); }
      document.body.classList.remove('nav-open');

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('search-open');
      input.value = '';
      render(null, '');
      setTimeout(function () { input.focus(); }, 30);
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('search-open');
      input.blur();
      active = -1;
    }

    triggers.forEach(function (t) { t.addEventListener('click', open); });
    $$('[data-close-search]').forEach(function (el) {
      el.addEventListener('click', close);
    });

    input.addEventListener('input', function () {
      var q = input.value.trim();
      render(q ? search(q, 8) : null, q);
    });

    input.addEventListener('keydown', function (e) {
      var items = $$('.smod-list .suggest-item', body);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (el, i) { el.classList.toggle('is-active', i === active); });
        items[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0 && items[active]) { location.href = items[active].href; return; }
        var first = search(input.value.trim(), 1)[0];
        if (first) location.href = 'product.html?id=' + encodeURIComponent(first.id);
      } else if (e.key === 'Escape') {
        close();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
      // ⌘K / Ctrl+K 快捷唤起
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        modal.classList.contains('is-open') ? close() : open();
      }
    });
  }

  /* ============================================================
   *  产品详情页
   * ============================================================ */
  /** 动态页设置 canonical / og:url（Google 会渲染 JS，直接生效） */
  function setCanonical(path) {
    var url = 'https://eddytrading.com' + path;
    var set = function (sel, attr, val) {
      var el = $(sel);
      if (el) el.setAttribute(attr, val);
    };
    set('link[rel="canonical"]', 'href', url);
    set('meta[property="og:url"]', 'content', url);
  }

  function initProduct() {
    var host = $('[data-product]');
    if (!host) return;
    var p = getProduct(param('id'));

    if (!p) {
      host.innerHTML = '' +
        '<div class="empty-state">' +
          '<h2 data-i18n="product_not_found">Product not found</h2>' +
          '<p data-i18n="product_not_found_desc">The product you\'re looking for doesn\'t exist or has been removed.</p>' +
          '<a class="btn btn-dark" href="index.html" data-i18n="back_home">Back home</a>' +
        '</div>';
      return;
    }

    var cat = getCategory(p.collection);
    document.title = p.name + ' — ' + CFG.brand;
    setCanonical('/product.html?id=' + encodeURIComponent(p.id));

    var variants = (p.variants && p.variants.length) ? p.variants : null;
    var defImage = p.image || '';
    var defPrice = p.price || '';

    host.innerHTML = '' +
      '<nav class="breadcrumb">' +
        '<a href="index.html" data-i18n="nav_home">Home</a><span class="sep">/</span>' +
        '<a href="category.html?slug=' + esc(p.collection) + '">' + esc(cat ? cat.name : p.collection) + '</a>' +
        '<span class="sep">/</span><span>' + esc(p.name) + '</span>' +
      '</nav>' +
      '<div class="detail">' +
        '<div class="detail-media" data-gallery>' +
          productGalleryHTML(p) +
        '</div>' +
        '<div class="detail-info">' +
          '<p class="eyebrow-lg">' + esc(p.brand) + '</p>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<p class="detail-price" data-variant-price>' + esc(defPrice) +
            '<span class="price-note" data-i18n="wholesale_vol">Wholesale · Ask for volume pricing</span>' +
          '</p>' +
          ((p.note || p.desc) ? '<p class="detail-desc">' + esc(p.note || p.desc) + '</p>' : '') +
          (variants
            ? '<div class="variant-block">' +
                '<div class="variant-label" data-i18n="model_option">Model / Option</div>' +
                '<div class="variant-row">' +
                  variants.map(function (v, i) {
                    // 初始不高亮任何一个：无选择 = 详情页轮播自动播放（Eddy 定）
                    return '<button type="button" class="variant-chip" data-variant="' + esc(v.name) + '" data-variant-price="' + esc(v.price || p.price) + '" data-variant-image="' + esc(v.image || p.image) + '">' + esc(v.name) + '</button>';
                  }).join('') +
                '</div>' +
                '<p class="variant-hint" data-i18n="variant_hint">Tap once to preview · tap again to confirm · tap again to add. Double-tap to deselect.</p>' +
              '</div>'
            : '') +
          '<div class="detail-actions">' +
            '<button type="button" class="btn btn-dark" data-add="' + esc(p.id) + '"' + (variants ? ' data-variant="' + esc(variants[0].name) + '"' : '') + '>' +
              '<span class="ico">' + ICON.plus + '</span><span class="lbl" data-i18n="add_to_inquiry">Add to Inquiry</span>' +
            '</button>' +
            '<button type="button" class="btn btn-outline" data-open-inquiry data-i18n="review_list">Review inquiry list</button>' +
            '<button type="button" class="btn btn-outline" data-inquiry-product-trigger data-product-name="' + esc(p.name) + '" data-i18n="inquiry_product_btn">Inquire this product</button>' +
          '</div>' +
          tierBoxHTML(p) +
          '<a class="back-link" href="category.html?slug=' + esc(p.collection) + '">&#8592; <span data-i18n="back_to">Back to </span>' + esc(cat ? cat.name : p.collection) + '</a>' +
          '<div class="spec-list">' +
            '<div class="spec-row"><span class="k" data-i18n="spec_brand">Brand</span><span>' + esc(p.brand || '—') + '</span></div>' +
            '<div class="spec-row"><span class="k" data-i18n="spec_collection">Collection</span><span>' + esc(cat ? cat.name : p.collection) + '</span></div>' +
            '<div class="spec-row"><span class="k" data-i18n="spec_shipping">Shipping</span><span data-i18n="spec_shipping_val">Worldwide · Quoted on request</span></div>' +
            '<div class="spec-row"><span class="k" data-i18n="spec_moq">MOQ</span>' +
            (p.moq ? '<span class="spec-moq-text">' + esc(p.moq) + '</span>'
                   : '<span data-i18n="spec_flexible">Flexible</span>') +
          '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 主图轮播画廊：自动循环 + 手动（箭头/圆点/缩略图）+ 悬停暂停
    var galMedia = $('[data-gallery]');
    var galImgs = galMedia ? $$('.gallery-img', galMedia) : [];
    var galTimer = null;
    var galHold = false; // true = 已选中型号 → 轮播保持停止（悬停离开、视频切换都不会重启）
    /* 型号选择状态同步到 DOM（data-gal-hold），便于样式/调试/回归测试判断 */
    function galSyncHold() { if (galMedia) galMedia.setAttribute('data-gal-hold', galHold ? '1' : '0'); }
    /* 选中型号 → 停轮播；取消选择 → 恢复轮播 */
    function galSetHold(on) { galHold = !!on; galSyncHold(); if (galHold) galStop(); else galStart(); }
    function galShow(i) {
      var n = galImgs.length; if (!n) return;
      var idx = (i % n + n) % n;
      galImgs.forEach(function (im, k) { im.classList.toggle('is-active', k === idx); });
      $$('.dot', galMedia).forEach(function (d, k) { d.classList.toggle('is-active', k === idx); });
      $$('.thumb', galMedia).forEach(function (t, k) { t.classList.toggle('is-active', k === idx); });
      galMedia.setAttribute('data-gal-idx', String(idx));
    }
    function galStart() {
      if (galTimer || galHold || galImgs.length <= 1) return;
      galTimer = setInterval(function () {
        galShow(parseInt(galMedia.getAttribute('data-gal-idx') || '0', 10) + 1);
      }, GALLERY_INTERVAL_MS);
    }
    function galStop() { if (galTimer) { clearInterval(galTimer); galTimer = null; } }
    /* 破图兜底：某张图 404（如主图未上传、轮播图路径写错）时把它从轮播里摘掉，
       避免第 1 张是破图导致整组画廊不可用；摘到只剩 1 张时自动退回静态图。 */
    function galDrop(el) {
      var i = galImgs.indexOf(el);
      if (i < 0) return;
      el.remove();
      var dots = $$('.dot', galMedia), ths = $$('.thumb', galMedia);
      if (dots[i]) dots[i].remove();
      if (ths[i]) ths[i].remove();
      galImgs.splice(i, 1);
      $$('.dot', galMedia).forEach(function (d, k) { d.setAttribute('data-gal-go', k); });
      $$('.thumb', galMedia).forEach(function (t, k) { t.setAttribute('data-gal-go', k); });
      if (el.hasAttribute('data-variant-img') && galImgs.length) galImgs[0].setAttribute('data-variant-img', '');
      if (galImgs.length <= 1) {
        galStop();
        $$('.gallery-nav, .gallery-dots, .gallery-thumbs', galMedia).forEach(function (x) { x.style.display = 'none'; });
        if (galImgs.length === 1) galShow(0);
        return;
      }
      galShow(0);
    }
    if (galMedia) {
      galSyncHold(); // 初始 data-gal-hold = 0（未选中型号 → 轮播自动播放）
      $$('.gallery-img', galMedia).forEach(function (im) {
        im.addEventListener('error', function () { galDrop(im); });
        if (im.complete && im.naturalWidth === 0) galDrop(im); // 已在缓存里失败过的图
      });
    }
    if (galMedia && galImgs.length > 1) {
      galMedia.setAttribute('data-gal-idx', '0');
      galMedia.addEventListener('click', function (e) {
        var b = e.target.closest('[data-gal-prev],[data-gal-next],[data-gal-go]');
        if (!b) return;
        if (b.hasAttribute('data-gal-prev')) galShow(parseInt(galMedia.getAttribute('data-gal-idx') || '0', 10) - 1);
        else if (b.hasAttribute('data-gal-next')) galShow(parseInt(galMedia.getAttribute('data-gal-idx') || '0', 10) + 1);
        else galShow(parseInt(b.getAttribute('data-gal-go'), 10));
        galStop(); galStart(); // 手动操作后重置自动计时
      });
      galMedia.addEventListener('mouseenter', galStop);
      galMedia.addEventListener('mouseleave', function () {
        var v = $('[data-detail-video]', galMedia);
        if (!v || v.style.display === 'none' || !v.style.display) galStart();
      });
      galStart();
    }

    // 视频切换：图 ↔ 视频 互斥显示；切型号时回到图片
    // 主图元素每次现取：破图兜底 galDrop() 会把 data-variant-img 转移到新的第一张
    function curVariantImg() { return $('[data-variant-img]'); }
    var vToggle = $('[data-video-toggle]');
    if (vToggle) {
      var vEl = $('[data-detail-video]');
      vToggle.addEventListener('click', function () {
        var showVideo = vEl.style.display === 'none';
        var vImg = curVariantImg();
        vEl.style.display = showVideo ? '' : 'none';
        if (vImg) vImg.style.display = showVideo ? 'none' : '';
        vToggle.textContent = showVideo ? window.T('show_photo') : window.T('watch_video');
        if (showVideo) { vEl.currentTime = 0; vEl.play().catch(function () {}); galStop(); }
        else { vEl.pause(); galStart(); }
      });
    }

    /* 型号选择（Eddy 定的三步逻辑）：
         第 1 下 = 选中（预览：换主图/价格，轮播停止）
         第 2 下 = 确认（锁定型号，chip 带实心勾）
         第 3 下起 = 加入询价篮（之后每一下继续加）
         双击（同一 chip 上 320ms 内连点两下）= 取消选中 → 回默认主图/价格，轮播恢复。
       用点击间隔判断而不是原生 dblclick：触屏上双击经常不派发 dblclick。
       加购延迟 200ms 执行，给「第二下」留出双击判定窗口，避免快速双击把东西加进篮子。 */
    if (variants) {
      var priceEl = $('[data-variant-price]');
      var addBtn = $('[data-add][data-variant]');
      var vEl2 = $('[data-detail-video]');
      var vTog2 = $('[data-video-toggle]');
      var lastTapName = '', lastTapAt = 0, swallowChip = null, swallowAt = 0;
      var pendingAdd = null;

      function stageOf(chip) { return parseInt(chip.getAttribute('data-stage') || '0', 10) || 0; }
      function setStage(chip, st) {
        chip.setAttribute('data-stage', String(st));
        chip.classList.toggle('is-active', st >= 1);
        chip.classList.toggle('is-confirmed', st >= 2);
        chip.setAttribute('aria-pressed', st >= 1 ? 'true' : 'false');
      }
      function cancelPendingAdd() {
        if (pendingAdd) { clearTimeout(pendingAdd); pendingAdd = null; }
      }

      /** 选中某型号：换图/换价 + 暂停轮播；其它 chip 一律回到未选 */
      function selectChip(chip) {
        $$('.variant-chip').forEach(function (c) { setStage(c, c === chip ? 1 : 0); });
        var vImg = chip.getAttribute('data-variant-image');
        var vPrice = chip.getAttribute('data-variant-price');
        var vName = chip.getAttribute('data-variant');
        var imgEl = curVariantImg();
        if (imgEl) {
          imgEl.src = vImg;
          galShow(0);
          var th0 = $('.thumb img', galMedia); // 缩略图 1 同步，避免与主图不一致
          if (th0) th0.src = vImg;
        }
        if (priceEl) priceEl.textContent = vPrice;
        if (addBtn) addBtn.setAttribute('data-variant', vName);
        updateTierBox(vPrice);   // 阶梯价跟着型号价格走
        // 选中型号时退出视频回到图片
        if (vEl2 && imgEl && vEl2.style.display !== 'none') {
          vEl2.pause(); vEl2.style.display = 'none';
          imgEl.style.display = '';
          if (vTog2) vTog2.textContent = window.T('watch_video');
        }
        galSetHold(true); // 已选中 → 轮播停止
        syncAddButtons();
      }

      /** 取消选择：回到默认主图/价格 + 恢复轮播（Add 按钮回落第一个型号，与页面初载一致） */
      function deselectChip() {
        $$('.variant-chip').forEach(function (c) { setStage(c, 0); });
        var imgEl = curVariantImg();
        if (imgEl) {
          imgEl.src = defImage;
          galShow(0);
          var th0 = $('.thumb img', galMedia);
          if (th0) th0.src = defImage;
        }
        if (priceEl) priceEl.textContent = defPrice;
        if (addBtn) addBtn.setAttribute('data-variant', variants[0].name);
        updateTierBox(defPrice);  // 取消选择 → 阶梯价回到默认价格基准
        galSetHold(false); // 无选择 → 轮播恢复
        syncAddButtons();
      }

      $$('.variant-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var now = Date.now();
          if (swallowChip === chip && now < swallowAt) return; // 双击后的余点击吞掉，避免又被选上
          var name = chip.getAttribute('data-variant');
          var isDouble = (name === lastTapName) && (now - lastTapAt <= GALLERY_DBLCLICK_MS);
          lastTapName = name; lastTapAt = now;

          if (isDouble) {                       // 双击 = 取消选中
            swallowChip = chip; swallowAt = now + GALLERY_DBLCLICK_MS;
            cancelPendingAdd();
            deselectChip();
            return;
          }

          var st = stageOf(chip);
          if (st === 0) { selectChip(chip); return; }          // 第 1 下：选中
          if (st === 1) { setStage(chip, 2); syncAddButtons(); return; } // 第 2 下：确认

          // 第 3 下起：加入询价篮
          setStage(chip, st + 1);
          cancelPendingAdd();
          pendingAdd = setTimeout(function () {
            pendingAdd = null;
            bumpSuppress = true;
            addProduct(p.id, name);
            bumpSuppress = false;
            flyToCart(chip, p.id, name);
            syncAddButtons();
          }, 200);
        });
      });
    }

    // 同分类推荐
    var rel = $('[data-related]');
    if (rel) {
      var list = productsIn(p.collection).filter(function (x) { return x.id !== p.id; }).slice(0, 4);
      if (list.length) {
        rel.innerHTML = '' +
          '<div class="section-head">' +
            '<p class="eyebrow-lg" data-i18n="you_may_like">You may also like</p>' +
            '<h2 class="display"><span data-i18n="more_in">More in </span>' + esc(cat ? cat.name : p.collection) + '</h2>' +
          '</div>' +
          '<div class="product-grid" style="padding-bottom:0">' +
            list.map(function (x) { return '<div>' + productCardHTML(x) + '</div>'; }).join('') +
          '</div>';
      }
    }

    initTier();   // 阶梯价控件（页面重建后需要重新绑定）
  }

  /* ============================================================
   *  分类页
   * ============================================================ */
  function initCategory() {
    var host = $('[data-category]');
    if (!host) return;
    var slug = param('slug');
    var cat = getCategory(slug);

    if (!cat) {
      host.innerHTML = '' +
        '<div class="empty-state">' +
          '<h2 data-i18n="collection_not_found">Collection not found</h2>' +
          '<p data-i18n="collection_not_found_desc">The collection you\'re looking for doesn\'t exist.</p>' +
          '<a class="btn btn-dark" href="index.html" data-i18n="back_home">Back home</a>' +
        '</div>';
      return;
    }

    document.title = cat.name + ' — ' + CFG.brand;
    setCanonical('/category.html?slug=' + encodeURIComponent(slug));

    var all = productsIn(slug);
    var sub = param('sub');
    var subs = cat.subcategories || [];

    host.innerHTML = '' +
      '<nav class="breadcrumb">' +
        '<a href="index.html" data-i18n="nav_home">Home</a><span class="sep">/</span><span>' + esc(cat.name) + '</span>' +
      '</nav>' +
      '<div class="page-head">' +
        '<p class="eyebrow-lg">' + esc(cat.tagline) + '</p>' +
        '<h1>' + esc(cat.name) + '</h1>' +
        '<p class="sub">' + window.T('cat_sub', { n: all.length }) + '</p>' +
      '</div>' +
      (subs.length
        ? '<div class="subnav">' +
            '<a class="chip' + (sub ? '' : ' is-active') + '" href="category.html?slug=' + esc(slug) + '" data-i18n="sub_all">All</a>' +
            subs.map(function (s) {
              return '<a class="chip' + (sub === s.slug ? ' is-active' : '') +
                '" href="category.html?slug=' + esc(slug) + '&sub=' + esc(s.slug) + '">' + esc(s.name) + '</a>';
            }).join('') +
          '</div>'
        : '') +
      '<div class="product-grid" data-cat-grid></div>';

    var list = sub ? all.filter(function (p) { return p.subcategory === sub; }) : all;
    var grid = $('[data-cat-grid]', host);
    grid.innerHTML = list.length
      ? list.map(function (p) { return '<div>' + productCardHTML(p) + '</div>'; }).join('')
      : '<div class="empty-state" style="grid-column:1/-1"><h2 data-i18n="nothing_here">Nothing here yet</h2>' +
        '<p data-i18n="no_products_sub">No products in this sub-collection at the moment.</p></div>';
  }

  /* ---------------- 专属链接落地：客户打开 #l=... 时显示报价清单 ---------------- */
  var sharedItems = [];

  /** 从 "€18" 这类价格串取数值；无效返回 null */
  function priceNum(s) {
    var n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : null;
  }

  /* ================================================================
     阶梯价 + 运费估算
     数据源：data.js 的 window.TIER_PRICING / window.SHIPPING_RATES
     （改数字只改 data.js，页面立刻跟着变）
     ================================================================ */

  /** 当前生效的阶梯档位；data.js 里 TIER_PRICING.enabled = false 即整体关闭 */
  function tierList() {
    var t = window.TIER_PRICING;
    return (t && t.enabled && t.tiers && t.tiers.length) ? t.tiers : null;
  }

  /** 数量落在哪一档 */
  function tierFor(qty) {
    var list = tierList();
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (qty >= t.min && (t.max === null || t.max === undefined || qty <= t.max)) return t;
    }
    return list[list.length - 1];
  }

  /** 金额格式：整数不带小数、非整数保留两位，并加千分位（€1,140 比 €1140 好读） */
  function money(n, sym) {
    var r = Math.round(n * 100) / 100;
    var s = (r % 1 === 0) ? String(r) : r.toFixed(2);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (sym || '') + parts.join('.');
  }

  /** 重量显示：整数不带小数，否则一位 */
  function fmtKg(n) {
    var r = Math.round(n * 10) / 10;
    return r % 1 === 0 ? String(r) : r.toFixed(1);
  }

  /* ---------- 跨币种约值（汇率在 data.js 的 FX_RATES，固定常量不联网） ---------- */

  /** 货币符号 → 货币代码（认不出就返回空） */
  function symToCurrency(sym) {
    var s = String(sym || '').trim();
    if (!s) return '';
    if (s === '€' || /eur/i.test(s)) return 'EUR';
    if (s === '$' || /usd/i.test(s)) return 'USD';
    return '';
  }

  /** 货币代码 → 显示符号 */
  function currencySym(cur) {
    if (cur === 'EUR') return '€';
    if (cur === 'USD') return '$';
    return cur ? cur + ' ' : '';
  }

  /** 按 FX_RATES 折算，结果取整；同币种 / 缺汇率返回 null */
  function fxConvert(amount, from, to) {
    var FX = window.FX_RATES;
    if (!FX || !FX.rates || !from || !to || from === to) return null;
    var f = parseFloat(FX.rates[from]), t = parseFloat(FX.rates[to]);
    if (!(f > 0) || !(t > 0)) return null;
    var v = amount * t / f;
    return isFinite(v) ? Math.round(v) : null;
  }

  /**
   * 「≈ $238」约值提示（HTML）。主报价数字不动，只在旁边补一个另一币种的约数。
   * block=true 时独占一行（小面板里用）。
   */
  function fxApproxHtml(amount, currency, block) {
    if (!(amount > 0)) return '';
    var other = currency === 'USD' ? 'EUR' : (currency === 'EUR' ? 'USD' : '');
    if (!other) return '';
    var v = fxConvert(amount, currency, other);
    if (v === null) return '';
    var note = (window.T && window.T('fx_rate_note')) || '';
    return '<span class="fx-approx' + (block ? ' fx-block' : '') + '" title="' + esc(note) + '">≈ ' +
      money(v, currencySym(other)) + ' ' + other + '</span>';
  }

  /**
   * 按数量算单价 / 总价 / 省下多少钱
   * 返回 { noPrice:true, qty } 表示该价格无法解析
   */
  function tierCalc(priceStr, qty) {
    var pr = parsePrice(priceStr);
    var q = Math.max(1, parseInt(qty, 10) || 1);
    if (!pr) return { noPrice: true, qty: q };
    var t = tierFor(q);
    var f = t ? t.factor : 1;
    var unit = pr.value * f;
    return {
      sym: pr.symbol, qty: q, tier: t, factor: f,
      base: pr.value, unit: unit, total: unit * q,
      saved: (pr.value - unit) * q
    };
  }

  /** 产品页「批量阶梯价」区块 HTML（无价格或无阶梯配置时返回空串） */
  function tierBoxHTML(p) {
    var list = tierList();
    if (!list || !p) return '';
    var pr = parsePrice(p.price);
    if (!pr) return '';
    var rows = list.map(function (t, i) {
      var label = (t.max === null || t.max === undefined) ? (t.min + '+') : (t.min + '–' + t.max);
      var off = t.factor < 1 ? '<em class="tier-off">−' + Math.round((1 - t.factor) * 100) + '%</em>' : '';
      return '<tr data-tier-row="' + i + '"><td>' + label + '</td>' +
        '<td>' + esc(money(pr.value * t.factor, pr.symbol)) + off + '</td></tr>';
    }).join('');
    return '' +
      '<div class="tier-box" data-tier-box data-tier-base="' + esc(p.price) + '">' +
        '<div class="tier-head">' +
          '<span data-i18n="tier_title">Volume pricing</span>' +
          '<span class="tier-badge" data-i18n="tier_auto">Auto-applied</span>' +
        '</div>' +
        '<table class="tier-table"><thead><tr>' +
          '<th data-i18n="tier_qty">Qty</th><th data-i18n="tier_unit">Unit price</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="tier-calc">' +
          '<label class="tier-qty-wrap"><span data-i18n="tier_your_qty">Your qty</span>' +
            '<input type="number" min="1" step="1" value="1" inputmode="numeric" data-tier-qty></label>' +
          '<div class="tier-out">' +
            '<span><span data-i18n="tier_unit">Unit price</span><b data-tier-unit>—</b></span>' +
            '<span><span data-i18n="tier_total">Total</span><b data-tier-total>—</b></span>' +
          '</div>' +
        '</div>' +
        '<p class="tier-saved" data-tier-saved></p>' +
        '<p class="tier-moq" data-tier-moq hidden></p>' +
      '</div>';
  }

  /** 重算阶梯价区块；basePrice 用于切换型号时换价格基准 */
  function updateTierBox(basePrice) {
    var box = $('[data-tier-box]');
    if (!box) return;
    if (basePrice) box.setAttribute('data-tier-base', basePrice);
    var base = box.getAttribute('data-tier-base') || '';
    var input = $('[data-tier-qty]', box);
    var r = tierCalc(base, input ? input.value : 1);
    var unitEl = $('[data-tier-unit]', box);
    var totalEl = $('[data-tier-total]', box);
    var savedEl = $('[data-tier-saved]', box);
    var moqEl = $('[data-tier-moq]', box);
    if (r.noPrice) {
      if (unitEl) unitEl.textContent = '—';
      if (totalEl) totalEl.textContent = '—';
      if (savedEl) savedEl.textContent = '';
      return;
    }
    if (unitEl) unitEl.textContent = money(r.unit, r.sym);
    if (totalEl) totalEl.textContent = money(r.total, r.sym);
    if (savedEl) savedEl.textContent = r.saved > 0.005 ? window.T('tier_saved', { v: money(r.saved, r.sym) }) : '';
    var idx = tierList().indexOf(r.tier);
    $$('[data-tier-row]', box).forEach(function (tr) {
      tr.classList.toggle('is-hit', parseInt(tr.getAttribute('data-tier-row'), 10) === idx);
    });
    /* MOQ 提示：只提醒，不强行改客户输入 */
    var p = getProduct(param('id'));
    var minQ = p ? moqQty(p) : 1;
    if (moqEl) {
      if (minQ > 1 && r.qty < minQ) {
        moqEl.textContent = window.T('tier_below_moq', { n: minQ, q: r.qty });
        moqEl.hidden = false;
      } else {
        moqEl.textContent = '';
        moqEl.hidden = true;
      }
    }
  }

  function initTier() {
    var box = $('[data-tier-box]');
    if (!box) return;
    var input = $('[data-tier-qty]', box);
    if (input) {
      input.addEventListener('input', function () { updateTierBox(); });
      input.addEventListener('change', function () { updateTierBox(); });
    }
    updateTierBox();
  }

  /** 体积重（kg）= 长×宽×高(cm) ÷ divisor；三边没填全就返回 0 */
  function volumeKg(l, w, h) {
    var R = window.SHIPPING_RATES;
    var d = (R && R.divisor) || 6000;
    l = parseFloat(l); w = parseFloat(w); h = parseFloat(h);
    if (!(l > 0 && w > 0 && h > 0)) return 0;
    return (l * w * h) / d;
  }

  /** ISO 国家代码 → 运费区域（未开通固定价的国家返回 null） */
  function shipZone(iso) {
    var R = window.SHIPPING_RATES;
    if (!R || !R.zones) return null;
    for (var i = 0; i < R.zones.length; i++) {
      if ((R.zones[i].countries || []).indexOf(iso) > -1) return R.zones[i];
    }
    return null;
  }

  /**
   * 运费估算：首重 1kg 固定价 + 每多 1kg 的续重价
   * 计费重量 = 实重与体积重【取大】→ 向上取整到整公斤
   * 未开通的国家返回 { quoteOnly:true }；数据不足返回 null
   */
  function shipQuote(iso, actualKg, l, w, h) {
    var R = window.SHIPPING_RATES;
    var z = shipZone(iso);
    var act = parseFloat(actualKg) || 0;
    if (act < 0) act = 0;
    var vol = volumeKg(l, w, h);
    var charge = Math.max(act, vol);
    if (!z || !(z.base >= 0) || !(z.perKg >= 0)) {
      return { quoteOnly: true, iso: iso, actual: act, vol: vol, charge: charge };
    }
    if (!(charge > 0)) return null;
    var step = parseFloat(R.roundKg) || 1;
    var bill = Math.ceil(charge / step - 1e-9) * step;
    if (bill < step) bill = step;
    var extra = Math.max(0, Math.round((bill - step) / step));
    return {
      zone: z, quoteOnly: false, actual: act, vol: vol,
      charge: charge, bill: bill, extra: extra,
      base: z.base, perKg: z.perKg,
      cost: z.base + extra * z.perKg,
      currency: z.currency || 'USD'
    };
  }

  /** 按当前清单数量计算预估合计（保留首个价格里的货币符号，含千分位） */
  /** 清单商品合计（金额 + 货币代码），没有可解析价格时返回 null */
  function sharedSum() {
    var sum = 0, has = false, cur = '';
    sharedItems.forEach(function (it) {
      var n = priceNum(it.price);
      if (n !== null) {
        sum += n * it.qty;
        has = true;
        if (!cur) cur = symToCurrency(String(it.price).replace(/[0-9.,\s]/g, ''));
      }
    });
    return has ? { sum: sum, currency: cur } : null;
  }

  function sharedTotal() {
    var s = sharedSum();
    if (!s) return '';
    var sym = s.currency
      ? currencySym(s.currency)
      : String(sharedItems[0].price).replace(/[0-9.,\s]/g, '');
    return money(s.sum, sym);
  }

  function renderSharedQuote() {
    var body = $('[data-shared-body]');
    if (!body) return;
    body.innerHTML = sharedItems.map(function (it, idx) {
      var minQ = minQtyOf(it);
      var atMin = minQ > 1 && it.qty <= minQ;
      var n = priceNum(it.price);
      var lineTotal = n !== null ? money(n * it.qty, String(it.price).replace(/[0-9.,\s]/g, '')) : '';
      return '' +
        '<div class="inq-item">' +
          '<img src="' + esc(it.image) + '" alt="' + esc(it.name) + '">' +
          '<div class="info">' +
            '<p class="i-name">' + esc(it.name) + (it.variant ? ' <span class="i-var">· ' + esc(it.variant) + '</span>' : '') + '</p>' +
            '<p class="i-brand">' + esc(it.brand || '') + '</p>' +
            '<p class="i-price">' +
              '<span>' + esc(it.price) + (it.qty > 1 ? ' × ' + it.qty : '') + '</span>' +
              (it.qty > 1 && lineTotal ? '<span class="i-line">' + esc(lineTotal) + '</span>' : '') +
            '</p>' +
            '<div class="qty">' +
              '<button type="button" data-sqty="' + idx + '" data-delta="-1" aria-label="Decrease"' +
                (atMin ? ' data-moqlock="1" aria-disabled="true"' : '') + '>−</button>' +
              '<span class="n">' + it.qty + '</span>' +
              '<button type="button" data-sqty="' + idx + '" data-delta="1" aria-label="Increase">+</button>' +
            '</div>' +
            (minQ > 1 ? '<p class="i-moq">' + esc(window.T('moq_min_label', { n: minQ })) + '</p>' : '') +
          '</div>' +
        '</div>';
    }).join('');
    var totalEl = $('[data-shared-total]');
    if (totalEl) {
      var st = sharedSum();
      var approx = st && st.currency ? fxApproxHtml(st.sum, st.currency) : '';
      totalEl.innerHTML = esc(sharedTotal() || '—') + approx;
    }
  }

  /** 报价单条款与联系信息（打印出来要看得到，所以是纯文本不是按钮） */
  function sharedTermsHtml() {
    // 报价单属于询盘链路，优先用询盘专用号（data.js 的 whatsappInquiry）
    var wa = CFG.whatsappInquiryDisplay || CFG.whatsappDisplay || CFG.whatsapp || '';
    return '<div class="shared-terms">' +
      '<p class="st-contact">' +
        '<b>' + esc(CFG.brand || '') + '</b>' +
        (wa ? ' · WhatsApp ' + esc(wa) : '') +
        (CFG.contactEmail ? ' · ' + esc(CFG.contactEmail) : '') +
      '</p>' +
      '<p class="st-note" data-i18n="quote_terms">Prices are wholesale, ex-works. Freight, duties and taxes are quoted separately. ' +
        'Quantities and prices are indicative until confirmed by our written quotation.</p>' +
      '<p class="st-fx" data-i18n="fx_rate_note">Approximate conversion at 1 EUR = 1.1 USD — we invoice in the quoted currency.</p>' +
    '</div>';
  }

  /** 报价单底部引流联系区（WhatsApp + 邮箱）—— 正常报价单与「链接失效」提示都用它 */
  function sharedContactHtml() {
    return '<div class="shared-contact">' +
      '<a class="btn btn-whatsapp" data-shared-wa href="' + esc(waLink('Hi ' + (CFG.contactName || CFG.brand) + '! I reviewed the quote list and would like to discuss prices.')) + '" target="_blank" rel="noreferrer">' +
        ICON.whatsapp.replace('<svg', '<svg style="width:18px;height:18px"') + esc(CFG.whatsappDisplay || 'WhatsApp') +
      '</a>' +
      (CFG.contactEmail
        ? '<a class="btn btn-outline shared-mail" href="mailto:' + esc(CFG.contactEmail) + '">✉ ' + esc(CFG.contactEmail) + '</a>'
        : '') +
    '</div>';
  }

  /** 链接里的产品已下架/改动时，不再静默变回首页，而是给出提示 + 联系方式 */
  function renderSharedExpired() {
    var header = $('.site-header');
    var banner = document.createElement('section');
    banner.className = 'shared-banner';
    banner.setAttribute('data-shared-banner', '');
    banner.setAttribute('data-shared-expired', '');
    banner.innerHTML = '' +
      '<div class="wrap">' +
        '<div class="shared-head">' +
          '<div>' +
            '<p class="eyebrow"><span data-i18n="shared_quote_list">Quote list · </span>' + esc(CFG.brand) + '</p>' +
            '<h2 data-i18n="shared_out_of_date">This quote list is out of date</h2>' +
          '</div>' +
        '</div>' +
        '<p class="shared-note" data-i18n="shared_note_expired">The items in this link are no longer in the catalog — our stock and prices change often. ' +
          'Message us and we\'ll send you a fresh quotation.</p>' +
        sharedContactHtml() +
      '</div>';
    if (header) header.insertAdjacentElement('afterend', banner);
    else document.body.insertBefore(banner, document.body.firstChild);
  }

  /** 报价单编号：Q-YYYYMMDD-四位。同一份清单编号稳定，便于双方对账沟通 */
  function quoteNo(items) {
    var s = encodeItems(items);
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var d = new Date();
    var mm = String(d.getMonth() + 1), dd = String(d.getDate());
    if (mm.length < 2) mm = '0' + mm;
    if (dd.length < 2) dd = '0' + dd;
    var tail = String(h % 10000);
    while (tail.length < 4) tail = '0' + tail;
    return 'Q-' + d.getFullYear() + mm + dd + '-' + tail;
  }

  /** 报价单日期：19 Oct 2026 */
  function quoteDate() {
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var d = new Date();
    return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear();
  }

  /** 报价单元信息条（单号 / 日期），正常查阅与打印都显示 */
  function sharedMetaHtml() {
    return '<div class="shared-meta">' +
      '<span><span data-i18n="quote_no">Quote no.</span> <b>' + esc(quoteNo(sharedItems)) + '</b></span>' +
      '<span><span data-i18n="quote_date">Date</span> <b>' + esc(quoteDate()) + '</b></span>' +
      '<span><span data-i18n="quote_valid">Valid</span> <b data-i18n="quote_valid_days">14 days</b></span>' +
    '</div>';
  }

  function initSharedList() {
    var m = location.hash.match(/[#&]l=([^&]+)/);
    if (!m) return;
    sharedItems = decodeItems(m[1]);
    if (!sharedItems.length) { renderSharedExpired(); return; }
    var wantPrint = /[#&]print=1/.test(location.hash);   // 从「Download quote」进来 → 自动唤起打印
    var header = $('.site-header');
    var banner = document.createElement('section');
    banner.className = 'shared-banner';
    banner.setAttribute('data-shared-banner', '');
    banner.innerHTML = '' +
      '<div class="wrap">' +
        '<div class="shared-head">' +
          '<div>' +
            '<p class="eyebrow"><span data-i18n="shared_quote_list">Quote list · </span>' + esc(CFG.brand) + '</p>' +
            '<h2>' + window.T('shared_review', { n: sharedItems.length }) + '</h2>' +
          '</div>' +
        '</div>' +
        sharedMetaHtml() +
        '<div class="shared-quote" data-shared-body></div>' +
        '<div class="shared-total"><span data-i18n="products_total">Products total</span><b data-shared-total>—</b></div>' +
        '<p class="shared-note" data-i18n="shared_note">Quantities are adjustable. Contact us for an official quotation.</p>' +
        sharedContactHtml() +
        sharedTermsHtml() +
      '</div>';
    if (header) header.insertAdjacentElement('afterend', banner);
    else document.body.insertBefore(banner, document.body.firstChild);
    renderSharedQuote();

    if (wantPrint) {
      document.body.classList.add('print-quote');
      document.title = quoteNo(sharedItems) + ' · ' + CFG.brand;
      /* 等图片与字体就位再唤起打印，避免打印出空白图 */
      setTimeout(function () { try { window.print(); } catch (e) {} }, 600);
    }
  }

  /* ---------------- 联系方式小卡片：页面里写 <div data-contact-cards></div> 即可
       内容全部取自站点配置（后台「站点设置」改号码 / 邮箱后这两张卡自动跟着变） ---------------- */
  function renderContactCards() {
    var hosts = $$('[data-contact-cards]');
    if (!hosts.length || !CFG) return;

    var wa = CFG.whatsapp
      ? '<a class="cc-card cc-wa" href="' + esc(waLink(CFG.greeting)) + '" target="_blank" rel="noreferrer">' +
          '<span class="cc-shine" aria-hidden="true"></span>' +
          '<span class="cc-ico">' + ICON.whatsapp + '</span>' +
          '<span class="cc-txt">' +
            '<span class="cc-k" data-i18n="contact_wa_k">WhatsApp · fastest</span>' +
            '<span class="cc-v">' + esc(CFG.whatsappDisplay || 'Chat now') + '</span>' +
            '<span class="cc-sub" data-i18n="contact_wa_sub">Send your inquiry list — quote within 24 hours</span>' +
          '</span>' +
          '<span class="cc-arrow">' + ICON.arrowRight + '</span>' +
        '</a>'
      : '';

    var mail = CFG.contactEmail
      ? '<a class="cc-card cc-mail" href="mailto:' + esc(CFG.contactEmail) + '?subject=' + encodeURIComponent('Wholesale inquiry') + '">' +
          '<span class="cc-ico">' + ICON.mail + '</span>' +
          '<span class="cc-txt">' +
            '<span class="cc-k" data-i18n="contact_mail_k">Email · catalogs &amp; docs</span>' +
            '<span class="cc-v">' + esc(CFG.contactEmail) + '</span>' +
            '<span class="cc-sub" data-i18n="contact_mail_sub">Price lists, shipping documents and invoices</span>' +
          '</span>' +
          '<span class="cc-arrow">' + ICON.arrowRight + '</span>' +
        '</a>'
      : '';

    if (!wa && !mail) return;
    hosts.forEach(function (h) { h.innerHTML = wa + mail; });
  }

  /* ---------------- 首屏产品缩略图跑马灯：填补首屏空白，一眼看到「有货」 ---------------- */
  function renderHeroStrip() {
    var host = $('[data-hero-strip]');
    if (!host) return;
    var cats = CATEGORIES.filter(function (c) { return productsIn(c.slug).length > 0; });
    if (cats.length < 4) return;

    var oneSet = cats.map(function (c) {
      return '<a class="hero-strip-item" href="category.html?slug=' + esc(c.slug) + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + esc(c.image) + '" alt="" loading="eager"></a>';
    }).join('');

    // 复制一份接在尾部，配合 translateX(-50%) 形成无缝循环
    host.innerHTML =
      '<div class="hero-strip-head"><span data-i18n="hero_strip_what">What we ship</span><span class="hero-strip-rule"></span>' +
        '<span>' + window.T('hero_strip_collections', { n: cats.length }) + '</span></div>' +
      '<div class="hero-strip-clip"><div class="hero-strip-track">' + oneSet + oneSet + '</div></div>';
  }

  /* ---------------- About 页图片墙：让「我们是谁」有画面 ---------------- */
  function renderAboutMosaic() {
    var host = $('[data-about-mosaic]');
    if (!host) return;
    var cats = CATEGORIES.filter(function (c) { return productsIn(c.slug).length > 0; }).slice(0, 6);
    if (!cats.length) return;

    var items = cats.map(function (c) {
      return '<a class="mosaic-item" href="category.html?slug=' + esc(c.slug) + '">' +
        '<img src="' + esc(c.image) + '" alt="' + esc(c.name) + '" loading="lazy">' +
        '<span class="mosaic-cap">' + esc(c.name) + '</span></a>';
    }).join('');

    var stat = $('[data-about-stat]');
    if (stat) stat.textContent = window.T('about_stat', { n: cats.length });
    host.innerHTML = items;
  }

  /* ---------------- About 实拍图：点击放大查看 ---------------- */
  function initPhotoViewer() {
    var items = $$('[data-real-photo]');
    if (!items.length) return;

    var box = document.createElement('div');
    box.className = 'photo-viewer';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button class="pv-close" type="button" aria-label="Close">&#10005;</button>' +
      '<img alt=""><span class="pv-cap"></span>';
    document.body.appendChild(box);

    var pic = $('img', box);
    var cap = $('.pv-cap', box);

    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('viewer-open');
    }
    function open(a) {
      pic.src = a.getAttribute('href');
      var b = $('.real-cap b', a);
      cap.textContent = b ? b.textContent : '';
      box.classList.add('is-open');
      document.body.classList.add('viewer-open');
    }

    items.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        open(a);
      });
    });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('pv-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------------- 手机端下拉菜单 ---------------- */
  function initNavMenu() {
    var btn = $('[data-nav-toggle]');
    var menu = $('[data-mobile-nav]');
    if (!btn || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!menu.classList.contains('is-open'));
    });
    // 点菜单里的链接后自动收起
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    setOpen(false);
  }

  /* ---------------- 通用 WhatsApp 按钮：任何页面只要写 [data-wa-chat] 即可 ---------------- */
  function initWaChat() {
    $$('[data-wa-chat]').forEach(function (a) {
      if (!CFG.whatsapp) return;
      var text = a.getAttribute('data-wa-text') ||
        ('Hi ' + (CFG.contactName || CFG.brand) + '! I have a question before ordering.');
      a.href = waLink(text);
    });
  }

  /* ---------------- 询盘接待表单 ---------------- */
  function initInquiry() {
    var form = $('[data-inquiry-form]');
    if (!form) return;
    // 表单提交直达号码：data.js 的 whatsappInquiry，留空则回落到 whatsapp
    var INQ_NO = CFG.whatsappInquiry || CFG.whatsapp;

    /* -------- 字段校验：错误就地显示在字段下方 -------- */
    function field(name) { return form.querySelector('[name="' + name + '"]'); }
    function setErr(name, res) {
      var el = field(name);
      var box = form.querySelector('[data-err="' + name + '"]');
      if (el) el.classList.toggle('is-invalid', !!res);
      if (box) box.textContent = res ? window.T(res.k, res.p) : '';
      return res;
    }
    function validate() {
      var iso = (field('country') || {}).value || '';
      function val(n) { var el = field(n); return el ? el.value : ''; }
      var list = [
        ['name', vName(val('name'))],
        ['phone', vPhone(val('phone'), iso)],
        ['address', vAddress(val('address'))],
        ['city', vCity(val('city'))],
        ['province', vCity(val('province'))],
        ['zip', vZip(val('zip'), iso)],
        ['country', iso && COUNTRY_BY_ISO[iso] ? null : { k: 'inquiry_err_country' }],
        ['email', vEmail(val('email'))]
      ];
      var bad = [];
      list.forEach(function (p) { if (setErr(p[0], p[1])) bad.push(p[0]); });
      return bad;
    }
    // 一改动就清掉该字段的报错，别让红字黏着
    form.addEventListener('input', function (e) {
      var n = e.target && e.target.getAttribute('name');
      if (n) setErr(n, null);
    });
    form.addEventListener('change', function (e) {
      var n = e.target && e.target.getAttribute('name');
      if (n && e.target.tagName !== 'SELECT') setErr(n, null);
    });

    /* -------- 国家联动：自动带区号、换邮编示例与键盘类型 -------- */
    var csel = form.querySelector('[data-inquiry-country]');
    function syncCountry() {
      var c = COUNTRY_BY_ISO[(csel && csel.value) || ''];
      var phoneEl = field('phone');
      var zipEl = field('zip');
      if (c && c[3]) {
        var pv = phoneEl ? phoneEl.value.trim() : '';
        // 空着、或只填了别的区号 → 换成所选国家的区号，省得客户自己查
        if (phoneEl && (!pv || /^\+\d{1,4}\s*$/.test(pv))) phoneEl.value = '+' + c[3] + ' ';
      }
      if (zipEl) {
        var numeric = !!(c && c[4] && c[4].source.indexOf('^\\d') === 0);
        zipEl.setAttribute('inputmode', numeric ? 'numeric' : 'text');
        if (c && c[5]) zipEl.setAttribute('placeholder', c[5]);
        else if (c) zipEl.removeAttribute('placeholder');
        if (zipEl.value.trim()) setErr('zip', vZip(zipEl.value, csel.value));
      }
      setErr('country', null);
      setErr('phone', null);
    }
    if (csel) csel.addEventListener('change', syncCountry);

    function buildMsg() {
      var fd = new FormData(form);
      function v(k) { return ((fd.get(k) || '') + '').trim(); }
      var name = v('name');
      var c = COUNTRY_BY_ISO[v('country')];
      var lines = ['Hi ' + (CFG.contactName || CFG.brand) + '! New inquiry:'];
      [
        ['Name', name],
        ['Phone', v('phone')],
        ['Email', v('email')],
        ['Address', v('address')],
        ['City', v('city')],
        ['Province', v('province')],
        ['Zip code', v('zip')],
        ['Country', c ? countryLabel(c) : v('country')]
      ].forEach(function (p) { if (p[1]) lines.push(p[0] + ': ' + p[1]); });
      var prods = v('products');
      if (prods) lines.push('Products: ' + prods);
      lines.push('');
      lines.push(CFG.inquiryOutro || 'Please send me pricing, MOQ and shipping details.');
      return { text: lines.join('\n'), name: name };
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad.length) {
        var first = field(bad[0]);
        if (first) first.focus();
        toast(window.T('inquiry_err_fix'));
        return;
      }
      var r = buildMsg();
      window.open(waLink(r.text, INQ_NO), '_blank', 'noopener');
      closeInquiryForm();
    });

    // 「Send products now」：只要产品清单，不用填表 → 直接发 WhatsApp
    var nowBtn = $('[data-send-products-now]');
    if (nowBtn) nowBtn.addEventListener('click', function () {
      var pf = productsField();
      var prods = pf ? pf.value.trim() : '';
      if (!prods) {
        prods = cartProductLine();
        if (pf && prods) pf.value = prods;
      }
      if (!prods) { toast(window.T('inquiry_err_products')); if (pf) pf.focus(); return; }
      var text = 'Hi ' + (CFG.contactName || CFG.brand) + '! I\'d like a quote for:\n\n' +
        prods.split(',').map(function (x) { return '• ' + x.trim(); }).join('\n') + '\n\n' +
        (CFG.inquiryOutro || 'Please send me pricing, MOQ and shipping details.');
      window.open(waLink(text, INQ_NO), '_blank', 'noopener');
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    mountChrome();
    Store.load();
    bindGlobal();
    renderContactCards();
    renderFooter();
    renderHeroStrip();
    renderAboutMosaic();
    initPhotoViewer();
    initNavMenu();
    initHeaderSearch();
    initWaChat();
    initSharedList();

    var page = document.body.getAttribute('data-page');
    if (page === 'product') initProduct();
    else if (page === 'category') initCategory();
    else if (page !== 'about') initHome();

    renderInquiry();
    syncAddButtons();
    initInquiry();
    initShipping();   // 抽屉里的运费估算（阶梯价在 initProduct 内初始化）

    // 多语言：用 data-i18n / 词典回填当前语言（浏览器判定或用户已选）
    if (window.applyLang) window.applyLang();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
