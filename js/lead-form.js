/**
 * js/lead-form.js —— 「找不到想要的？告诉我们」需求收集表单
 *
 * 挂载方式：页面里放一个容器 <div data-lead-form></div>，本脚本自动渲染表单。
 * 提交到 /api/inquiry（Cloudflare Pages Functions + D1）。
 *
 * 兜底：如果后端还没绑定数据库（503）或网络失败，会显示「改用 WhatsApp 发」
 * 的按钮，把已填内容拼成一条消息，客户不会卡在报错上。
 */
(function () {
  'use strict';

  var MAX = { product: 1200, message: 2000, contact: 120, country: 60, qty: 40, price: 40 };
  var mountedAt = Date.now();

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function T(key, fallback) {
    try {
      if (window.T) {
        var v = window.T(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    return fallback || '';
  }

  /* ---------------- 分类下拉 ---------------- */

  function categoryOptions() {
    var cats = window.CATEGORIES || [];
    var html = '<option value="">' + esc(T('req_cat_any', 'Not sure / other')) + '</option>';
    cats.forEach(function (c) {
      if (!c || !c.name) return;
      html += '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
    });
    return html;
  }

  /* ---------------- 表单骨架 ---------------- */

  function formHtml() {
    return '' +
      '<form class="lf" novalidate>' +
        '<div class="lf-grid">' +
          '<label class="lf-field lf-full">' +
            '<span class="lf-lbl" data-i18n="req_f_product">What are you looking for?</span>' +
            '<textarea data-lf-product rows="3" maxlength="' + MAX.product + '" required ' +
              'data-i18n-ph="req_ph_product" placeholder="e.g. 200 pcs Dior Sauvage EDT 100ml, or paste a product link"></textarea>' +
          '</label>' +
          '<label class="lf-field lf-full">' +
            '<span class="lf-lbl" data-i18n="req_f_contact">Your WhatsApp or email</span>' +
            '<input type="text" data-lf-contact maxlength="' + MAX.contact + '" required ' +
              'data-i18n-ph="req_ph_contact" placeholder="+1 555 000 1234 or you@company.com" autocomplete="email">' +
          '</label>' +
          '<label class="lf-field">' +
            '<span class="lf-lbl" data-i18n="req_f_category">Category</span>' +
            '<select data-lf-category>' + categoryOptions() + '</select>' +
          '</label>' +
          '<label class="lf-field">' +
            '<span class="lf-lbl" data-i18n="req_f_country">Your country</span>' +
            '<input type="text" data-lf-country maxlength="' + MAX.country + '" autocomplete="country-name" ' +
              'data-i18n-ph="req_ph_country" placeholder="United States">' +
          '</label>' +
          '<label class="lf-field">' +
            '<span class="lf-lbl" data-i18n="req_f_qty">Quantity (pcs)</span>' +
            '<input type="text" data-lf-qty maxlength="' + MAX.qty + '" inputmode="numeric" ' +
              'data-i18n-ph="req_ph_qty" placeholder="e.g. 100">' +
          '</label>' +
          '<label class="lf-field">' +
            '<span class="lf-lbl" data-i18n="req_f_price">Target price (per unit)</span>' +
            '<input type="text" data-lf-price maxlength="' + MAX.price + '" ' +
              'data-i18n-ph="req_ph_price" placeholder="e.g. $12">' +
          '</label>' +
          '<label class="lf-field lf-full">' +
            '<span class="lf-lbl" data-i18n="req_f_msg">Anything else? (optional)</span>' +
            '<textarea data-lf-message rows="2" maxlength="' + MAX.message + '" ' +
              'data-i18n-ph="req_ph_msg" placeholder="Brand, model, packaging, deadline…"></textarea>' +
          '</label>' +
        '</div>' +
        '<input class="lf-hp" type="text" data-lf-company tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div class="lf-actions">' +
          '<button type="submit" class="btn btn-dark lf-submit">' +
            '<span data-i18n="req_submit">Send request</span>' +
          '</button>' +
          '<p class="lf-note" data-i18n="req_note">We reply within 24 hours. No spam, ever.</p>' +
        '</div>' +
        '<p class="lf-err" data-lf-err hidden></p>' +
      '</form>';
  }

  /* ---------------- 成功 / 失败视图 ---------------- */

  function doneHtml() {
    var wa = document.querySelector('[data-lf-wa-fallback]');
    var waHref = wa ? wa.getAttribute('href') : '#';
    return '' +
      '<div class="lf-done">' +
        '<span class="lf-done-ico" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M20 6 9 17l-5-5"/></svg>' +
        '</span>' +
        '<h3 data-i18n="req_ok_title">Request received</h3>' +
        '<p data-i18n="req_ok_body">Thanks — we&rsquo;ll come back to you within 24 hours with pricing and options.</p>' +
        '<a class="btn btn-whatsapp lf-done-wa" data-wa-chat href="' + esc(waHref) + '" target="_blank" rel="noreferrer">' +
          '<span data-i18n="req_ok_wa">Chat on WhatsApp now</span></a>' +
      '</div>';
  }

  /* ---------------- 提交 ---------------- */

  function collect(form) {
    var get = function (sel) {
      var n = form.querySelector(sel);
      return n ? String(n.value || '').trim() : '';
    };
    return {
      product: get('[data-lf-product]'),
      contact: get('[data-lf-contact]'),
      category: get('[data-lf-category]'),
      country: get('[data-lf-country]'),
      qty: get('[data-lf-qty]'),
      target_price: get('[data-lf-price]'),
      message: get('[data-lf-message]'),
      company: get('[data-lf-company]'),
      ts: mountedAt,
      lang: (window.getLang && window.getLang()) || 'en',
      page: location.pathname + (location.hash || ''),
      referrer: document.referrer || '',
    };
  }

  function showErr(form, msg) {
    var box = form.querySelector('[data-lf-err]');
    if (!box) return;
    box.textContent = msg;
    box.hidden = !msg;
  }

  function whatsappHref(data) {
    var parts = [T('req_wa_intro', 'Hi Eddy! I am looking for:')];
    if (data.product) parts.push('• ' + data.product);
    if (data.category) parts.push(T('req_f_category', 'Category') + ': ' + data.category);
    if (data.qty) parts.push(T('req_f_qty', 'Quantity') + ': ' + data.qty);
    if (data.target_price) parts.push(T('req_f_price', 'Target price') + ': ' + data.target_price);
    if (data.country) parts.push(T('req_f_country', 'Country') + ': ' + data.country);
    if (data.message) parts.push(data.message);
    var no = (window.SITE_CONFIG && (window.SITE_CONFIG.whatsappInquiry || window.SITE_CONFIG.whatsapp)) || '';
    return 'https://wa.me/' + no + '?text=' + encodeURIComponent(parts.join('\n'));
  }

  function fallback(form, data, reason) {
    var host = form.closest('[data-lead-form]') || form.parentNode;
    var box = el('div', 'lf-fallback');
    box.innerHTML =
      '<p class="lf-fb-title">' + esc(T('req_fb_title', 'Online form is not available right now.')) + '</p>' +
      '<p class="lf-fb-body">' + esc(T('req_fb_body', 'Send the same details straight to Eddy on WhatsApp — one tap, and it opens with your message already written.')) + '</p>' +
      '<a class="btn btn-whatsapp" href="' + esc(whatsappHref(data)) + '" target="_blank" rel="noreferrer">' +
        '<span>' + esc(T('req_fb_btn', 'Send on WhatsApp')) + '</span></a>' +
      '<p class="lf-fb-note">' + esc(reason || '') + '</p>';
    host.innerHTML = '';
    host.appendChild(box);
  }

  function submit(form) {
    var data = collect(form);
    showErr(form, '');

    if (data.product.length < 2) {
      showErr(form, T('req_err_product', 'Please tell us what you are looking for.'));
      var p = form.querySelector('[data-lf-product]');
      if (p) p.focus();
      return;
    }
    var looksLikeContact = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(data.contact) ||
      ((data.contact.match(/\d/g) || []).length >= 7 && /^[+()\-\s\d.]+$/.test(data.contact));
    if (!looksLikeContact) {
      showErr(form, T('req_err_contact', 'Please add a valid WhatsApp number or email.'));
      var c = form.querySelector('[data-lf-contact]');
      if (c) c.focus();
      return;
    }

    var btn = form.querySelector('.lf-submit');
    var label = btn ? btn.querySelector('span') : null;
    var old = label ? label.textContent : '';
    if (btn) btn.disabled = true;
    if (label) label.textContent = T('req_sending', 'Sending…');

    fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { status: r.status, body: j };
        });
      })
      .then(function (res) {
        if (res.status === 200 && res.body && res.body.ok) {
          var host = form.closest('[data-lead-form]') || form.parentNode;
          host.innerHTML = doneHtml();
          if (window.applyLang) window.applyLang();
          host.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
        if (res.status === 503 || res.status === 404 || res.status === 405) {
          // 接口还没部署 / 数据库还没绑定：直接退到 WhatsApp，别让客户看到报错
          fallback(form, data, '');
          return;
        }
        if (res.status === 429) {
          showErr(form, T('req_err_rate', 'Too many requests from your network. Please try again later, or message us on WhatsApp.'));
        } else if (res.status === 422) {
          showErr(form, T('req_err_validate', 'Please check the highlighted fields and try again.'));
        } else {
          showErr(form, T('req_err_generic', 'Something went wrong. Please try again, or message us on WhatsApp.'));
        }
        if (btn) btn.disabled = false;
        if (label) label.textContent = old;
      })
      .catch(function () {
        fallback(form, data, '');
      });
  }

  /* ---------------- 挂载 ---------------- */

  function mount(host) {
    if (!host || host.getAttribute('data-lf-ready') === '1') return;
    host.setAttribute('data-lf-ready', '1');
    host.innerHTML = formHtml();

    var form = host.querySelector('form.lf');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit(form);
    });

    // 备用 WhatsApp 链接（成功页用）：先拼一个空内容的
    if (!document.querySelector('[data-lf-wa-fallback]')) {
      var a = document.createElement('a');
      a.setAttribute('data-lf-wa-fallback', '');
      a.href = whatsappHref({});
      a.style.display = 'none';
      document.body.appendChild(a);
    }

    if (window.applyLang) window.applyLang();
  }

  function init() {
    var hosts = document.querySelectorAll('[data-lead-form]');
    if (!hosts.length) return;
    Array.prototype.forEach.call(hosts, mount);

    // 从别的页面带 ?ask=xxx 跳过来时，自动把需求填进去
    try {
      var ask = new URLSearchParams(location.search).get('ask');
      if (ask) {
        var p = document.querySelector('[data-lead-form] [data-lf-product]');
        if (p && !p.value) p.value = ask.slice(0, MAX.product);
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.EddyLeadForm = { mount: mount };
})();
