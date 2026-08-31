/* ============================================================
 *  产品管理后台逻辑（admin.html）
 *  不用碰代码：增删改产品、图片自动改名、导出 data.js
 * ============================================================ */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG;
  var CATEGORIES = window.CATEGORIES || [];
  var PRODUCTS = window.PRODUCTS || [];

  /* ---------------- 工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }

  /** 英文名 → 网址友好的 id（abc / abc-2） */
  function slugify(name, used) {
    var base = String(name || '').toLowerCase().trim()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!base) base = 'product';
    if (used.indexOf(base) === -1) return base;
    var i = 2;
    while (used.indexOf(base + '-' + i) > -1) i++;
    return base + '-' + i;
  }

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

  /* ---------------- 状态 ---------------- */
  var state = {
    filter: '',
    catFilter: 'all',
    editingId: null,
  };

  var statusTimer = null;
  function status(msg, kind) {
    var bar = $('[data-status]');
    if (!bar) return;
    bar.textContent = msg;
    bar.className = 'status-bar show ' + (kind === 'err' ? 'err' : 'ok');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { bar.classList.remove('show'); }, 3500);
  }

  /* ---------------- 产品列表 ---------------- */
  function renderList() {
    var list = $('[data-prod-list]');
    var count = $('[data-prod-count]');
    var q = norm(state.filter);

    var rows = PRODUCTS.filter(function (p) {
      if (state.catFilter !== 'all' && p.collection !== state.catFilter) return false;
      if (!q) return true;
      var cat = getCategory(p.collection);
      var hay = norm([p.name, p.brand, p.note || '', cat ? cat.name : '', (p.keywords || []).join(' ')].join(' '));
      return hay.indexOf(q) > -1;
    });

    if (count) count.textContent = rows.length + ' / ' + PRODUCTS.length;

    if (!rows.length) {
      list.innerHTML = '<div class="prod-empty">没有匹配的产品</div>';
      return;
    }
    list.innerHTML = rows.map(function (p) {
      return '' +
        '<div class="prod-row' + (state.editingId === p.id ? ' is-active' : '') + '" data-open="' + esc(p.id) + '">' +
          '<img src="' + esc(p.image) + '" alt="" loading="lazy">' +
          '<div class="meta">' +
            '<div class="pn">' + esc(p.name) + '</div>' +
            '<div class="pm">' + esc(p.brand) + ' · ' + esc(p.price) + (p.subcategory ? ' · ' + esc(p.subcategory) : '') + '</div>' +
          '</div>' +
          (p.popular ? '<span class="star" title="首页热门">★</span>' : '') +
          '<button type="button" class="del" data-del="' + esc(p.id) + '" title="删除">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>' +
          '</button>' +
        '</div>';
    }).join('');
  }

  function renderFilters() {
    var box = $('[data-cat-filters]');
    box.innerHTML = '<button type="button" class="chip' + (state.catFilter === 'all' ? ' is-active' : '') + '" data-catf="all">全部</button>' +
      CATEGORIES.map(function (c) {
        return '<button type="button" class="chip' + (state.catFilter === c.slug ? ' is-active' : '') + '" data-catf="' + esc(c.slug) + '">' + esc(c.name) + '</button>';
      }).join('');
  }

  /* ---------------- 表单 ---------------- */
  var FIELDS = ['id', 'name', 'brand', 'price', 'note', 'desc', 'collection', 'subcategory', 'keywords', 'popular'];

  function fillForm(p) {
    if (!p) { resetForm(); return; }
    state.editingId = p.id;
    $('[data-f-id]').value = p.id;
    $('[data-f-name]').value = p.name || '';
    $('[data-f-brand]').value = p.brand || '';
    $('[data-f-price]').value = p.price || '';
    $('[data-f-note]').value = p.note || '';
    $('[data-f-desc]').value = p.desc || '';
    $('[data-f-collection]').value = p.collection || '';
    $('[data-f-popular]').checked = !!p.popular;
    $('[data-f-keywords]').value = (p.keywords || []).join(', ');
    syncSubcats();
    if (p.subcategory) $('[data-f-subcategory]').value = p.subcategory;
    $('[data-form-title]').textContent = '编辑产品';
    $('[data-img-preview]').src = p.image;
    $('[data-img-name]').textContent = p.id + '.jpg';
    $('[data-img-tip]').textContent = '已用图片：' + p.image;
    var delCur = $('[data-del-current]');
    if (delCur) delCur.style.display = 'inline-flex';
    renderList();
  }

  function resetForm() {
    state.editingId = null;
    $$('input, select, textarea', $('[data-form-grid]')).forEach(function (el) { el.value = ''; });
    $('[data-f-popular]').checked = false;
    $('[data-f-collection]').value = CATEGORIES.length ? CATEGORIES[0].slug : '';
    $('[data-form-title]').textContent = '添加新产品';
    syncSubcats();
    $('[data-img-preview]').src = '';
    $('[data-img-name]').textContent = '选择图片后自动改名';
    $('[data-img-tip]').textContent = '不上传图片则沿用分类插画';
    var delCur = $('[data-del-current]');
    if (delCur) delCur.style.display = 'none';
    renderList();
  }

  function syncSubcats() {
    var cat = getCategory($('[data-f-collection]').value);
    var box = $('[data-f-subcategory]');
    var prev = box.value;
    var subs = (cat && cat.subcategories) || [];
    box.innerHTML = '<option value="">（无子分类）</option>' +
      subs.map(function (s) { return '<option value="' + esc(s.slug) + '">' + esc(s.name) + '</option>'; }).join('');
    // 重建选项后恢复原选择（若仍存在），避免把已选值清掉
    box.value = prev && subs.some(function (s) { return s.slug === prev; }) ? prev : '';
    box.disabled = !subs.length;
  }

  function readForm() {
    var p = {};
    FIELDS.forEach(function (f) { p[f] = $('[data-f-' + f + ']').value.trim(); });
    p.popular = $('[data-f-popular]').checked;
    p.keywords = p.keywords ? p.keywords.split(',').map(function (k) { return k.trim(); }).filter(Boolean) : [];
    if (!p.subcategory) p.subcategory = undefined;
    return p;
  }

  function saveProduct() {
    var p = readForm();

    if (!p.name) { status('产品名称不能为空', 'err'); return; }
    if (!p.price) { status('价格不能为空（例如 $129）', 'err'); return; }
    if (!p.collection) { status('请选择所属分类', 'err'); return; }
    var used = PRODUCTS.map(function (x) { return x.id; }).filter(function (id) { return id !== state.editingId; });
    if (!p.id) p.id = slugify(p.name, used);
    if (used.indexOf(p.id) > -1) { status('产品 ID「' + p.id + '」已被占用，请换一个', 'err'); return; }
    if (!/^[a-z0-9-]+$/.test(p.id)) { status('ID 只能用小写字母、数字和短横线（如 apple-watch）', 'err'); return; }

    // 图片路径：新图 → assets/img/prod/<id>.jpg；若是原分类插画顶替则保持
    var old = state.editingId ? getProduct(state.editingId) : null;
    p.image = (old && old.image) || 'assets/img/prod/' + p.id + '.jpg';
    if (old && String(old.image).indexOf('assets/img/cat/') === 0) p.image = old.image;

    if (state.editingId) {
      var idx = PRODUCTS.indexOf(old);
      PRODUCTS.splice(idx, 1, p);
      status('已保存：' + p.name);
    } else {
      PRODUCTS.push(p);
      status('已添加：' + p.name + '（ID: ' + p.id + '）');
    }
    fillForm(p);
  }

  function deleteProduct(id) {
    var p = getProduct(id);
    if (!p) return;
    if (!confirm('确定删除「' + p.name + '」？\n删除后记得「导出 data.js」并重新上传。')) return;
    PRODUCTS = PRODUCTS.filter(function (x) { return x.id !== id; });
    status('已删除：' + p.name);
    resetForm();
  }

  /* ---------------- 图片工具：压缩 + 自动改名 ---------------- */
  function handleImageFile(file) {
    if (!file || file.type.indexOf('image/') !== 0) { status('请选择图片文件', 'err'); return; }
    var target = 800;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(target / img.width, target / img.height, 1);
        var w = Math.round(img.width * scale);
        var h = Math.round(img.height * scale);
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        // 预览
        $('[data-img-preview]').src = cv.toDataURL('image/jpeg', 0.82);

        // 文件名 = 产品 ID
        var id = $('[data-f-id]').value.trim();
        if (!id) {
          var used = PRODUCTS.map(function (x) { return x.id; });
          id = slugify($('[data-f-name]').value, used);
          $('[data-f-id]').value = id;
        }
        var fname = id + '.jpg';
        $('[data-img-name]').textContent = fname;
        $('[data-img-tip]').textContent = '点击「下载图片」保存到 assets/img/prod/ 文件夹';

        // 下载
        var a = document.createElement('a');
        a.href = cv.toDataURL('image/jpeg', 0.82);
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        a.remove();
        status('图片已处理并开始下载：' + fname + '（放到 assets/img/prod/ 里即可）');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- 导出 data.js ---------------- */
  function exportData() {
    var fallback = [];
    var prods = PRODUCTS.map(function (p) {
      var o = {
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        note: p.note || '',
        desc: p.desc || '',
        collection: p.collection,
      };
      if (p.subcategory) o.subcategory = p.subcategory;
      if (p.popular) o.popular = true;
      if (p.keywords && p.keywords.length) o.keywords = p.keywords;
      if (String(p.image || '').indexOf('assets/img/cat/') === 0) fallback.push(p.id);
      return o;
    });

    var lines = [];
    lines.push('/* ============================================================');
    lines.push(' *  全站配置与数据源 —— 想改品牌 / 产品 / 联系方式，只改这个文件');
    lines.push(' * ============================================================');
    lines.push(' *');
    lines.push(' * 改 WhatsApp：下面的 whatsapp 用「国家码+号码」，不要加 + 或空格');
    lines.push(' * 加产品：往 PRODUCTS 数组里照抄一条即可，image 会自动匹配同名图片');
    lines.push(' * 加分类：往 CATEGORIES 里加一条，并放一张 assets/img/cat/<slug>.png');
    lines.push(' */');
    lines.push('');
    lines.push('window.SITE_CONFIG = ' + JSON.stringify(CFG, null, 2) + ';');
    lines.push('');
    lines.push('/* ---------------- 分类 ---------------- */');
    lines.push('window.CATEGORIES = ' + JSON.stringify(CATEGORIES, null, 2) + ';');
    lines.push('');
    lines.push('/* ---------------- 产品 ---------------- */');
    lines.push('window.PRODUCTS = ' + JSON.stringify(prods, null, 2) + ';');
    lines.push('');
    lines.push('/* ---------------- 派生：图片路径 ---------------- */');
    lines.push('var FALLBACK_TO_CATEGORY = ' + JSON.stringify(fallback) + ';');
    lines.push('');
    lines.push('(function buildImagePaths() {');
    lines.push('  window.CATEGORIES.forEach(function (c) {');
    lines.push("    c.image = 'assets/img/cat/' + c.slug + '.png';");
    lines.push('  });');
    lines.push('  window.PRODUCTS.forEach(function (p) {');
    lines.push("    p.categoryImage = 'assets/img/cat/' + p.collection + '.png';");
    lines.push('    p.image = FALLBACK_TO_CATEGORY.indexOf(p.id) > -1');
    lines.push("      ? p.categoryImage");
    lines.push("      : 'assets/img/prod/' + p.id + '.jpg';");
    lines.push('  });');
    lines.push('})();');

    var blob = new Blob([lines.join('\n')], { type: 'text/javascript;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    status('已导出 data.js —— 把它覆盖到 assets/js/data.js（或上传到托管平台替换同名文件）');
  }

  /* ---------------- 导入 data.js ---------------- */
  function importData(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var blob = new Blob([reader.result], { type: 'text/javascript' });
      var url = URL.createObjectURL(blob);
      var s = document.createElement('script');
      s.src = url;
      s.onload = function () {
        if (window.PRODUCTS && window.PRODUCTS.length) {
          PRODUCTS = window.PRODUCTS;
          CATEGORIES = window.CATEGORIES || [];
          CFG = window.SITE_CONFIG || CFG;
          resetForm();
          renderFilters();
          renderList();
          status('导入成功：' + PRODUCTS.length + ' 个产品、' + CATEGORIES.length + ' 个分类');
        } else {
          status('文件里没有读到产品数据，请确认选的是导出的 data.js', 'err');
        }
        s.remove();
        URL.revokeObjectURL(url);
      };
      s.onerror = function () { status('文件加载失败，请确认选的是 data.js', 'err'); };
      document.head.appendChild(s);
    };
    reader.readAsText(file);
  }

  /* ---------------- 数据自检 ---------------- */
  function checkData() {
    var rep = $('[data-report]');
    rep.style.display = 'block';
    rep.innerHTML = '<div class="ok-line">正在检查…</div>';

    var issues = [];
    var ids = PRODUCTS.map(function (p) { return p.id; });

    // 1. 重复 ID
    ids.forEach(function (id, i) {
      if (ids.indexOf(id) !== i) issues.push({ t: 'bad', msg: '重复的产品 ID：' + id });
    });

    // 2. 分类无效
    var slugs = CATEGORIES.map(function (c) { return c.slug; });
    PRODUCTS.forEach(function (p) {
      if (slugs.indexOf(p.collection) === -1) issues.push({ t: 'bad', msg: '「' + p.name + '」的所属分类 ' + p.collection + ' 不存在' });
      if (p.subcategory) {
        var cat = getCategory(p.collection);
        var subs = (cat && cat.subcategories) || [];
        if (subs.map(function (s) { return s.slug; }).indexOf(p.subcategory) === -1) {
          issues.push({ t: 'warn', msg: '「' + p.name + '」的子分类 ' + p.subcategory + ' 在该分类下不存在' });
        }
      }
    });

    // 3. 空分类
    CATEGORIES.forEach(function (c) {
      if (productsIn(c.slug).length === 0) issues.push({ t: 'warn', msg: '分类「' + c.name + '」下没有产品（前台会显示 Coming soon）' });
    });

    // 4. 缺少关键词
    PRODUCTS.forEach(function (p) {
      if (!p.keywords || !p.keywords.length) issues.push({ t: 'warn', msg: '「' + p.name + '」没有关键词，搜索会变弱' });
    });

    // 5. 图片是否可访问（HEAD 请求，非空提示）
    var imgs = [];
    CATEGORIES.forEach(function (c) { imgs.push({ name: c.name + '（分类图）', url: c.image }); });
    PRODUCTS.forEach(function (p) { imgs.push({ name: p.name, url: p.image }); });

    var pending = imgs.length;
    var done = 0;

    function finish() {
      if (issues.length === 0) {
        rep.innerHTML = '<div class="ok-line">✓ 全部通过：' + PRODUCTS.length + ' 个产品、' + CATEGORIES.length + ' 个分类，无重复 ID、无无效分类、图片全部可访问。</div>';
      } else {
        rep.innerHTML = issues.map(function (it) {
          return '<div class="issue ' + it.t + '"><span class="tag2">' + (it.t === 'bad' ? '错误' : '提醒') + '</span><span>' + esc(it.msg) + '</span></div>';
        }).join('');
      }
    }

    imgs.forEach(function (im) {
      fetch(im.url, { method: 'HEAD' }).then(function (r) {
        if (!r.ok) issues.push({ t: 'bad', msg: '图片打不开（' + r.status + '）：' + im.name + ' → ' + im.url });
        done++; if (done === pending) finish();
      }).catch(function () {
        issues.push({ t: 'bad', msg: '图片打不开：' + im.name + ' → ' + im.url });
        done++; if (done === pending) finish();
      });
    });

    if (!pending) finish();
    status('检查完成', 'ok');
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    // 列表：搜索 / 筛选 / 打开 / 删除
    $('[data-search]').addEventListener('input', function (e) { state.filter = e.target.value; renderList(); });
    $('[data-cat-filters]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-catf]');
      if (!b) return;
      state.catFilter = b.getAttribute('data-catf');
      renderFilters();
      renderList();
    });
    $('[data-prod-list]').addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) { e.stopPropagation(); deleteProduct(del.getAttribute('data-del')); return; }
      var row = e.target.closest('[data-open]');
      if (row) fillForm(getProduct(row.getAttribute('data-open')));
    });

    // 表单
    $('[data-f-collection]').addEventListener('change', syncSubcats);
    $('[data-f-name]').addEventListener('input', function () {
      // 新产品的 ID 随名字自动生成（可手动改）
      if (!state.editingId && !$('[data-f-id]').value) {
        var used = PRODUCTS.map(function (x) { return x.id; });
        $('[data-f-id]').value = slugify($('[data-f-name]').value, used);
        $('[data-img-name]').textContent = $('[data-f-id]').value + '.jpg';
      }
    });
    $('[data-f-id]').addEventListener('input', function () {
      $('[data-img-name]').textContent = ($('[data-f-id]').value || 'product') + '.jpg';
    });
    $('[data-save]').addEventListener('click', saveProduct);
    $('[data-new]').addEventListener('click', resetForm);
    var delCur = $('[data-del-current]');
    if (delCur) delCur.addEventListener('click', function () {
      if (state.editingId) deleteProduct(state.editingId);
    });

    // 图片
    $('[data-img-file]').addEventListener('change', function (e) {
      handleImageFile(e.target.files[0]);
      e.target.value = '';
    });

    // 导出 / 导入 / 检查
    $('[data-export]').addEventListener('click', exportData);
    $('[data-import-file]').addEventListener('change', function (e) {
      importData(e.target.files[0]);
      e.target.value = '';
    });
    $('[data-import]').addEventListener('click', function () { $('[data-import-file]').click(); });
    $('[data-check]').addEventListener('click', checkData);
    $('[data-open-site]').addEventListener('click', function () { location.href = 'index.html'; });
  }

  function fillCollectionSelect() {
    var sel = $('[data-f-collection]');
    sel.innerHTML = CATEGORIES.map(function (c) {
      return '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>';
    }).join('');
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    fillCollectionSelect();
    renderFilters();
    renderList();
    resetForm();
    bind();
    document.title = '产品管理 · ' + (CFG ? CFG.brand : 'EddySupply');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
