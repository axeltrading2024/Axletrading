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
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    chevLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
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
        '</a>' +
        '<div class="body">' +
          '<div class="min-w-0">' +
            '<p class="eyebrow" style="letter-spacing:.16em;font-size:11px">' + esc(p.brand) + '</p>' +
            '<div class="row">' +
              '<h3 class="name">' + esc(p.name) + '</h3>' +
              '<span class="price">' + esc(p.price) + '</span>' +
            '</div>' +
            '<p class="note">' + esc(p.note) + '</p>' +
          '</div>' +
          '<button type="button" class="add btn btn-sm btn-outline add-btn" data-add="' + esc(p.id) + '">' +
            '<span class="ico">' + ICON.plus + '</span><span class="lbl">Add to Inquiry</span>' +
          '</button>' +
        '</div>' +
      '</article>';
  }

  function categoryCardHTML(c) {
    var empty = productsIn(c.slug).length === 0;
    return '' +
      '<a href="category.html?slug=' + esc(c.slug) + '" class="cat-card card-lift">' +
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
            '<a href="index.html" data-nav="home">Home</a>' +
            '<a href="index.html#popular" data-nav="popular">Popular</a>' +
            '<a href="index.html#browse" data-nav="browse">Browse</a>' +
          '</nav>' +
          '<button type="button" class="inquiry-toggle" data-open-inquiry aria-label="Open inquiry list">' +
            ICON.clipboard + 'Inquiry<span class="inquiry-count" data-inquiry-count>0</span>' +
          '</button>' +
        '</div></header>';
    }

    // 抽屉 + 遮罩 + toast + FAB
    var frag = document.createElement('div');
    frag.innerHTML = '' +
      '<div class="drawer-backdrop" data-drawer-backdrop></div>' +
      '<aside class="drawer" data-drawer aria-hidden="true">' +
        '<div class="drawer-head">' +
          '<div>' +
            '<h2>Inquiry list</h2>' +
            '<p class="count" data-drawer-count>0 items</p>' +
          '</div>' +
          '<button type="button" class="drawer-close" data-close-inquiry aria-label="Close">' + ICON.close + '</button>' +
        '</div>' +
        '<div class="drawer-body" data-drawer-body></div>' +
        '<div class="drawer-foot">' +
          '<div class="total"><span>Estimated total</span><b data-drawer-total>—</b></div>' +
          '<a class="btn btn-whatsapp" data-send-inquiry href="#" target="_blank" rel="noreferrer">' +
            ICON.whatsapp.replace('<svg', '<svg style="width:18px;height:18px"') + 'Send on WhatsApp' +
          '</a>' +
          '<button type="button" class="clear" data-clear-inquiry>Clear list</button>' +
        '</div>' +
      '</aside>' +
      '<a class="wa-fab" data-wa-fab href="#" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">' + ICON.whatsapp + '</a>' +
      '<div class="toast" data-toast></div>';
    document.body.appendChild(frag);

    var fab = $('[data-wa-fab]');
    if (fab) fab.href = waLink();

    // 当前导航高亮
    var page = document.body.getAttribute('data-page');
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
    if (dCnt) dCnt.textContent = n + (n === 1 ? ' item' : ' items');
    if (totalEl) totalEl.textContent = Store.total() || '—';
    if (sendEl) {
      sendEl.href = waLink(buildInquiryMessage(Store.items));
      var disabled = n === 0;
      sendEl.style.opacity = disabled ? '0.45' : '1';
      sendEl.style.pointerEvents = disabled ? 'none' : 'auto';
    }

    if (!body) return;
    if (!Store.items.length) {
      body.innerHTML = '<div class="drawer-empty">Your list is empty.<br>Add products and send them in one message.</div>';
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
      if (lbl) lbl.textContent = inList ? 'In inquiry list' : 'Add to Inquiry';
      var ico = $('.ico', btn);
      if (ico) ico.innerHTML = inList ? ICON.check : ICON.plus;
    });
  }

  var bumpTimer = null;
  function bumpCount() {
    var el = $('[data-inquiry-count]');
    if (!el) return;
    el.classList.remove('inquiry-bump');
    void el.offsetWidth; // 强制重排以重启动画
    el.classList.add('inquiry-bump');
    clearTimeout(bumpTimer);
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
      price: v ? v.price : p.price,
      qty: 1,
    });
    if (!silent) toast(p.name + (v ? ' [' + v.name + ']' : '') + ' added to inquiry');
  }

  /* ---------------- 全局事件委托 ---------------- */
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var t = e.target;

      var addBtn = t.closest('[data-add]');
      if (addBtn) {
        addProduct(addBtn.getAttribute('data-add'), addBtn.getAttribute('data-variant') || '');
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
        if (Store.items.length) { Store.clear(); toast('Inquiry list cleared'); }
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

  /* ============================================================
   *  首页
   * ============================================================ */
  function initHome() {
    // Hero 文案
    var titleEl = $('[data-hero-title]');
    if (titleEl) {
      titleEl.innerHTML = esc(CFG.heroTitle) + '<br><span class="accent">' + esc(CFG.heroTitleAccent) + '</span>';
    }
    var subEl = $('[data-hero-sub]');
    if (subEl) subEl.textContent = CFG.heroSubtitle;
    var badgeEl = $('[data-hero-badge]');
    if (badgeEl) badgeEl.textContent = CFG.brand + ' · Product Finder';
    var phEl = $('[data-search-input]');
    if (phEl) phEl.placeholder = CFG.searchPlaceholder;

    // 主推品：从热门里随机挑一个
    var featured = $('[data-featured]');
    if (featured) {
      var pool = popularProducts();
      var pick = pool[Math.floor(Math.random() * pool.length)] || PRODUCTS[0];
      if (pick) {
        featured.innerHTML = '' +
          '<p class="eyebrow" style="letter-spacing:.28em">Featured this visit</p>' +
          '<div class="featured-stage"><div class="tilt" data-tilt>' +
            '<img class="featured-img" src="' + esc(pick.categoryImage) + '" alt="' + esc(pick.name) + '" draggable="false" data-tilt-img>' +
          '</div></div>' +
          '<div class="featured-meta">' +
            '<p class="eyebrow-lg">' + esc(pick.brand) + '</p>' +
            '<h2>' + esc(pick.name) + '</h2>' +
            '<p class="note">' + esc(pick.note) + ' · ' + esc(pick.price) + '</p>' +
            '<div class="featured-actions">' +
              '<button type="button" class="btn btn-outline" data-add="' + esc(pick.id) + '">' +
                '<span class="ico">' + ICON.plus + '</span><span class="lbl">Add to Inquiry</span>' +
              '</button>' +
              '<a class="btn btn-outline" href="product.html?id=' + esc(pick.id) + '">View details' + ICON.arrowRight + '</a>' +
            '</div>' +
          '</div>';
      }
      bindTilt();
    }

    // 热门轮播
    var scroller = $('[data-popular]');
    if (scroller) {
      scroller.innerHTML = popularProducts().map(function (p) {
        return '<div class="slide">' + productCardHTML(p) + '</div>';
      }).join('');
      var prev = $('[data-carousel-prev]');
      var next = $('[data-carousel-next]');
      var step = function () { return Math.min(scroller.clientWidth * 0.8, 340); };
      if (prev) prev.onclick = function () { scroller.scrollBy({ left: -step(), behavior: 'smooth' }); };
      if (next) next.onclick = function () { scroller.scrollBy({ left: step(), behavior: 'smooth' }); };
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
        : '<div class="suggest-empty">No products match that search.</div>';
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

  /* ============================================================
   *  产品详情页
   * ============================================================ */
  function initProduct() {
    var host = $('[data-product]');
    if (!host) return;
    var p = getProduct(param('id'));

    if (!p) {
      host.innerHTML = '' +
        '<div class="empty-state">' +
          '<h2>Product not found</h2>' +
          '<p>The product you\'re looking for doesn\'t exist or has been removed.</p>' +
          '<a class="btn btn-dark" href="index.html">Back home</a>' +
        '</div>';
      return;
    }

    var cat = getCategory(p.collection);
    document.title = p.name + ' — ' + CFG.brand;

    var variants = (p.variants && p.variants.length) ? p.variants : null;
    var defImage = p.image || '';
    var defPrice = p.price || '';

    host.innerHTML = '' +
      '<nav class="breadcrumb">' +
        '<a href="index.html">Home</a><span class="sep">/</span>' +
        '<a href="category.html?slug=' + esc(p.collection) + '">' + esc(cat ? cat.name : p.collection) + '</a>' +
        '<span class="sep">/</span><span>' + esc(p.name) + '</span>' +
      '</nav>' +
      '<div class="detail">' +
        '<div class="detail-media"><img data-variant-img src="' + esc(defImage) + '" alt="' + esc(p.name) + '"></div>' +
        '<div class="detail-info">' +
          '<p class="eyebrow-lg">' + esc(p.brand) + '</p>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<p class="detail-price" data-variant-price>' + esc(defPrice) + '</p>' +
          '<p class="detail-desc">' + esc(p.desc || p.note) + '</p>' +
          (variants
            ? '<div class="variant-block">' +
                '<div class="variant-label">Model / Option</div>' +
                '<div class="variant-row">' +
                  variants.map(function (v, i) {
                    return '<button type="button" class="variant-chip' + (i === 0 ? ' is-active' : '') + '" data-variant="' + esc(v.name) + '" data-variant-price="' + esc(v.price || p.price) + '" data-variant-image="' + esc(v.image || p.image) + '">' + esc(v.name) + '</button>';
                  }).join('') +
                '</div>' +
              '</div>'
            : '') +
          '<div class="detail-actions">' +
            '<button type="button" class="btn btn-dark" data-add="' + esc(p.id) + '"' + (variants ? ' data-variant="' + esc(variants[0].name) + '"' : '') + '>' +
              '<span class="ico">' + ICON.plus + '</span><span class="lbl">Add to Inquiry</span>' +
            '</button>' +
            '<a class="btn btn-whatsapp" data-ask="' + esc(p.id) + '" href="#" target="_blank" rel="noreferrer">' +
              ICON.whatsapp.replace('<svg', '<svg style="width:18px;height:18px"') + 'Ask on WhatsApp' +
            '</a>' +
          '</div>' +
          '<div class="spec-list">' +
            '<div class="spec-row"><span class="k">Brand</span><span>' + esc(p.brand) + '</span></div>' +
            '<div class="spec-row"><span class="k">Features</span><span>' + esc(p.note) + '</span></div>' +
            '<div class="spec-row"><span class="k">Collection</span><span>' + esc(cat ? cat.name : p.collection) + '</span></div>' +
          '</div>' +
          (p.keywords && p.keywords.length
            ? '<div class="tag-row">' + p.keywords.map(function (k) { return '<span class="tag">' + esc(k) + '</span>'; }).join('') + '</div>'
            : '') +
        '</div>' +
      '</div>';

    // 型号切换：点型号按钮 → 换主图 / 换价格 / 更新 Add 按钮与 WhatsApp
    if (variants) {
      var imgEl = $('[data-variant-img]');
      var priceEl = $('[data-variant-price]');
      var addBtn = $('[data-add][data-variant]');
      var askEl = $('[data-ask]');
      $$('.variant-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          $$('.variant-chip').forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');
          var vImg = chip.getAttribute('data-variant-image');
          var vPrice = chip.getAttribute('data-variant-price');
          var vName = chip.getAttribute('data-variant');
          if (imgEl) imgEl.src = vImg;
          if (priceEl) priceEl.textContent = vPrice;
          if (addBtn) addBtn.setAttribute('data-variant', vName);
          if (askEl) {
            askEl.href = waLink("Hi " + CFG.contactName + "! I'm interested in " + p.name +
              " (" + vName + ", " + vPrice + ", " + p.brand + "). Could you share pricing and MOQ?");
          }
          syncAddButtons();
        });
      });
    }

    // 「Ask on WhatsApp」带上这个产品的信息
    var ask = $('[data-ask]');
    if (ask) {
      ask.href = waLink("Hi " + CFG.contactName + "! I'm interested in " + p.name +
        " (" + p.brand + ", " + p.price + "). Could you share pricing and MOQ?");
    }

    // 同分类推荐
    var rel = $('[data-related]');
    if (rel) {
      var list = productsIn(p.collection).filter(function (x) { return x.id !== p.id; }).slice(0, 4);
      if (list.length) {
        rel.innerHTML = '' +
          '<div class="section-head">' +
            '<p class="eyebrow-lg">You may also like</p>' +
            '<h2 class="display">More in ' + esc(cat ? cat.name : p.collection) + '</h2>' +
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
          '<h2>Collection not found</h2>' +
          '<p>The collection you\'re looking for doesn\'t exist.</p>' +
          '<a class="btn btn-dark" href="index.html">Back home</a>' +
        '</div>';
      return;
    }

    document.title = cat.name + ' — ' + CFG.brand;

    var all = productsIn(slug);
    var sub = param('sub');
    var subs = cat.subcategories || [];

    host.innerHTML = '' +
      '<nav class="breadcrumb">' +
        '<a href="index.html">Home</a><span class="sep">/</span><span>' + esc(cat.name) + '</span>' +
      '</nav>' +
      '<div class="page-head">' +
        '<p class="eyebrow-lg">' + esc(cat.tagline) + '</p>' +
        '<h1>' + esc(cat.name) + '</h1>' +
        '<p class="sub">' + all.length + ' product' + (all.length === 1 ? '' : 's') +
          ' in this collection. Add anything you like to your inquiry list.</p>' +
      '</div>' +
      (subs.length
        ? '<div class="subnav">' +
            '<a class="chip' + (sub ? '' : ' is-active') + '" href="category.html?slug=' + esc(slug) + '">All</a>' +
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
      : '<div class="empty-state" style="grid-column:1/-1"><h2>Nothing here yet</h2>' +
        '<p>No products in this sub-collection at the moment.</p></div>';
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    mountChrome();
    Store.load();
    bindGlobal();

    var page = document.body.getAttribute('data-page');
    if (page === 'product') initProduct();
    else if (page === 'category') initCategory();
    else initHome();

    renderInquiry();
    syncAddButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
