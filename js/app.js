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
  function waLink(text) {
    return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(
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
          qty: (parseInt(x.q, 10) > 0 ? Math.floor(parseInt(x.q, 10)) : 1),
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
    },

    save: function () {
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
        '<div class="drawer-foot">' +
          '<div class="total"><span data-i18n="products_total">Products total</span><b data-drawer-total>—</b></div>' +
          '<a class="btn btn-whatsapp" data-send-inquiry href="#" target="_blank" rel="noreferrer">' +
            ICON.whatsapp.replace('<svg', '<svg style="width:18px;height:18px"') + '<span data-i18n="send_wa">Send on WhatsApp</span>' +
          '</a>' +
          '<button type="button" class="share" data-share-link data-i18n="copy_link">🔗 Copy share link</button>' +
          '<button type="button" class="clear" data-clear-inquiry data-i18n="clear_list">Clear list</button>' +
        '</div>' +
      '</aside>' +
      '<a class="wa-fab" data-wa-fab href="#" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">' + ICON.whatsapp + '</a>' +
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
    if (totalEl) totalEl.textContent = Store.total() || '—';
    if (sendEl) {
      sendEl.href = waLink(buildInquiryMessage(Store.items));
      var disabled = n === 0;
      sendEl.style.opacity = disabled ? '0.45' : '1';
      sendEl.style.pointerEvents = disabled ? 'none' : 'auto';
    }
    var shareEl = $('[data-share-link]');
    if (shareEl) {
      shareEl.style.opacity = n === 0 ? '0.45' : '1';
      shareEl.style.pointerEvents = n === 0 ? 'none' : 'auto';
    }

    if (!body) return;
    if (!Store.items.length) {
      body.innerHTML = '<div class="drawer-empty">' + window.T('drawer_empty') + '</div>';
      return;
    }
    body.innerHTML = Store.items.map(function (it) {
      var key = itemKey(it);
      return '' +
        '<div class="inq-item">' +
          '<img src="' + esc(it.image) + '" alt="' + esc(it.name) + '">' +
          '<div class="info">' +
            '<p class="i-name">' + esc(it.name) + (it.variant ? ' <span class="i-var">· ' + esc(it.variant) + '</span>' : '') + '</p>' +
            '<p class="i-brand">' + esc(it.brand) + '</p>' +
            '<p class="i-price">' + esc(it.price) + '</p>' +
            '<div class="qty">' +
              '<button type="button" data-qty="' + esc(key) + '" data-delta="-1" aria-label="Decrease">−</button>' +
              '<span class="n">' + it.qty + '</span>' +
              '<button type="button" data-qty="' + esc(key) + '" data-delta="1" aria-label="Increase">+</button>' +
            '</div>' +
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

      var qtyBtn = t.closest('[data-qty]');
      if (qtyBtn) {
        var key = qtyBtn.getAttribute('data-qty');
        var delta = parseInt(qtyBtn.getAttribute('data-delta'), 10);
        var cur = Store.items.filter(function (it) { return itemKey(it) === key; })[0];
        if (cur) Store.setQty(key, cur.qty + delta);
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

      var sqBtn = t.closest('[data-sqty]');
      if (sqBtn) {
        var sIdx = parseInt(sqBtn.getAttribute('data-sqty'), 10);
        var sDelta = parseInt(sqBtn.getAttribute('data-delta'), 10);
        if (sharedItems[sIdx]) {
          sharedItems[sIdx].qty = Math.max(1, sharedItems[sIdx].qty + sDelta);
          renderSharedQuote();
        }
        return;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') openDrawer(false);
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
    if (badgeEl) badgeEl.textContent = CFG.heroBadge || (CFG.brand + ' · Product Finder');
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
    // About 页的「X of 9 collections」统计标签随语言刷新
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
                    return '<button type="button" class="variant-chip' + (i === 0 ? ' is-active' : '') + '" data-variant="' + esc(v.name) + '" data-variant-price="' + esc(v.price || p.price) + '" data-variant-image="' + esc(v.image || p.image) + '">' + esc(v.name) + '</button>';
                  }).join('') +
                '</div>' +
              '</div>'
            : '') +
          '<div class="detail-actions">' +
            '<button type="button" class="btn btn-dark" data-add="' + esc(p.id) + '"' + (variants ? ' data-variant="' + esc(variants[0].name) + '"' : '') + '>' +
              '<span class="ico">' + ICON.plus + '</span><span class="lbl" data-i18n="add_to_inquiry">Add to Inquiry</span>' +
            '</button>' +
            '<button type="button" class="btn btn-outline" data-open-inquiry data-i18n="review_list">Review inquiry list</button>' +
          '</div>' +
          '<a class="back-link" href="category.html?slug=' + esc(p.collection) + '">&#8592; <span data-i18n="back_to">Back to </span>' + esc(cat ? cat.name : p.collection) + '</a>' +
          '<div class="spec-list">' +
            '<div class="spec-row"><span class="k" data-i18n="spec_brand">Brand</span><span>' + esc(p.brand || '—') + '</span></div>' +
            '<div class="spec-row"><span class="k" data-i18n="spec_collection">Collection</span><span>' + esc(cat ? cat.name : p.collection) + '</span></div>' +
            '<div class="spec-row"><span class="k" data-i18n="spec_shipping">Shipping</span><span data-i18n="spec_shipping_val">Worldwide · Quoted on request</span></div>' +
            '<div class="spec-row"><span class="k" data-i18n="spec_moq">MOQ</span><span data-i18n="spec_flexible">Flexible</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 主图轮播画廊：自动循环 + 手动（箭头/圆点/缩略图）+ 悬停暂停
    var galMedia = $('[data-gallery]');
    var galImgs = galMedia ? $$('.gallery-img', galMedia) : [];
    var galTimer = null;
    function galShow(i) {
      var n = galImgs.length; if (!n) return;
      var idx = (i % n + n) % n;
      galImgs.forEach(function (im, k) { im.classList.toggle('is-active', k === idx); });
      $$('.dot', galMedia).forEach(function (d, k) { d.classList.toggle('is-active', k === idx); });
      $$('.thumb', galMedia).forEach(function (t, k) { t.classList.toggle('is-active', k === idx); });
      galMedia.setAttribute('data-gal-idx', String(idx));
    }
    function galStart() {
      if (galTimer || galImgs.length <= 1) return;
      galTimer = setInterval(function () {
        galShow(parseInt(galMedia.getAttribute('data-gal-idx') || '0', 10) + 1);
      }, 3500);
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
    var vToggle = $('[data-video-toggle]');
    if (vToggle) {
      var vImg = $('[data-variant-img]');
      var vEl = $('[data-detail-video]');
      vToggle.addEventListener('click', function () {
        var showVideo = vEl.style.display === 'none';
        vEl.style.display = showVideo ? '' : 'none';
        if (vImg) vImg.style.display = showVideo ? 'none' : '';
        vToggle.textContent = showVideo ? window.T('show_photo') : window.T('watch_video');
        if (showVideo) { vEl.currentTime = 0; vEl.play().catch(function () {}); galStop(); }
        else { vEl.pause(); galStart(); }
      });
    }

    // 型号切换：点型号按钮 → 换主图 / 换价格 / 更新 Add 按钮
    if (variants) {
      var imgEl = $('[data-variant-img]');
      var priceEl = $('[data-variant-price]');
      var addBtn = $('[data-add][data-variant]');
      var vEl2 = $('[data-detail-video]');
      var vTog2 = $('[data-video-toggle]');
      $$('.variant-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          $$('.variant-chip').forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');
          var vImg = chip.getAttribute('data-variant-image');
          var vPrice = chip.getAttribute('data-variant-price');
          var vName = chip.getAttribute('data-variant');
          if (imgEl) {
            imgEl.src = vImg; galShow(0); galStop(); galStart();
            var th0 = $('.thumb img', galMedia); // 缩略图 1 同步，避免与主图不一致
            if (th0) th0.src = vImg;
          }
          if (priceEl) priceEl.textContent = vPrice;
          if (addBtn) addBtn.setAttribute('data-variant', vName);
          // 切换型号时退出视频回到图片
          if (vEl2 && vEl2.style.display !== 'none') {
            vEl2.pause(); vEl2.style.display = 'none';
            imgEl.style.display = '';
            if (vTog2) vTog2.textContent = window.T('watch_video');
          }
          syncAddButtons();
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

  /** 按当前清单数量计算预估合计（保留首个价格里的货币符号） */
  function sharedTotal() {
    var sum = 0, has = false;
    sharedItems.forEach(function (it) {
      var n = priceNum(it.price);
      if (n !== null) { sum += n * it.qty; has = true; }
    });
    if (!has) return '';
    var sym = String(sharedItems[0].price).replace(/[0-9.,\s]/g, '');
    var r = Math.round(sum * 100) / 100;
    return sym + (r % 1 === 0 ? String(r) : r.toFixed(2));
  }

  function renderSharedQuote() {
    var body = $('[data-shared-body]');
    if (!body) return;
    body.innerHTML = sharedItems.map(function (it, idx) {
      return '' +
        '<div class="inq-item">' +
          '<img src="' + esc(it.image) + '" alt="' + esc(it.name) + '">' +
          '<div class="info">' +
            '<p class="i-name">' + esc(it.name) + (it.variant ? ' <span class="i-var">· ' + esc(it.variant) + '</span>' : '') + '</p>' +
            '<p class="i-brand">' + esc(it.brand || '') + '</p>' +
            '<p class="i-price">' + esc(it.price) + (it.qty > 1 ? ' × ' + it.qty : '') + '</p>' +
            '<div class="qty">' +
              '<button type="button" data-sqty="' + idx + '" data-delta="-1" aria-label="Decrease">−</button>' +
              '<span class="n">' + it.qty + '</span>' +
              '<button type="button" data-sqty="' + idx + '" data-delta="1" aria-label="Increase">+</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
    var totalEl = $('[data-shared-total]');
    if (totalEl) totalEl.textContent = sharedTotal() || '—';
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

  function initSharedList() {
    var m = location.hash.match(/[#&]l=([^&]+)/);
    if (!m) return;
    sharedItems = decodeItems(m[1]);
    if (!sharedItems.length) { renderSharedExpired(); return; }
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
        '<div class="shared-quote" data-shared-body></div>' +
        '<div class="shared-total"><span data-i18n="products_total">Products total</span><b data-shared-total>—</b></div>' +
        '<p class="shared-note" data-i18n="shared_note">Quantities are adjustable. Contact us for an official quotation.</p>' +
        sharedContactHtml() +
      '</div>';
    if (header) header.insertAdjacentElement('afterend', banner);
    else document.body.insertBefore(banner, document.body.firstChild);
    renderSharedQuote();
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

    // 多语言：用 data-i18n / 词典回填当前语言（浏览器判定或用户已选）
    if (window.applyLang) window.applyLang();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
