/**
 * js/assistant.js —— 自动接待挂件（混合版：规则 + 智能体）
 *
 * 做什么：
 *   · 左下角浮出一颗气泡，点开是一个对话面板
 *   · 6 个快捷问题走即时规则（零成本，回 kb.js 的 short 短答案）
 *   · 自由输入走智能体：先打 /api/chat 调 Workers AI，简短切题还会反问；AI 不可用自动回退规则
 *   · 答不上来时展开「留联系方式」，POST 到站点已有的 /api/inquiry（Cloudflare Pages Functions + D1）
 *   · 接口不可用 / 被限流 / 客户想找真人 → 一键转 WhatsApp，消息已预填
 *
 * 设计约束：
 *   · 不重复造后端：复用 /api/chat 与 /api/inquiry，前者同平台调 AI，后者落 D1 线索
 *   · 接口有防垃圾三重校验（蜜罐 company、时间陷阱 ts、同 IP 频控），这里必须照做
 *   · 客户任何时候都能一键转真人，绝不把人卡在表单里
 */
(function () {
  'use strict';

  var KB = window.ASSISTANT_KB;
  if (!KB) return;

  /* ---------------- 基础工具 ---------------- */

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

  function lang() {
    try {
      return window.getLang && window.getLang() === 'es' ? 'es' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function t(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang()] || obj.en || '';
  }

  var CFG = window.SITE_CONFIG || {};
  /* 转人工走 KB 里指定的那条线（+86 158 7520 9571，Eddy 2026-10-28 定）。
     站点的询盘主号（+49）仍在 data.js 里负责下单/报价/物流——两条线分工不同，
     所以这里不读 SITE_CONFIG 的号码，只在 KB 缺失时兜底。 */
  var WA_NO = KB.contact.whatsapp || CFG.whatsappInquiry || CFG.whatsapp || '';

  function waHref(text) {
    var body = text || 'Hi Eddy! I have a question about your wholesale products.';
    return 'https://wa.me/' + WA_NO + '?text=' + encodeURIComponent(body);
  }

  var ICON_CHAT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.9 3 2.8 6.4 2.8 10.6c0 2.3 1.2 4.4 3.1 5.7-.1.9-.4 2-.9 2.9 1.3-.1 2.5-.6 3.4-1.3 1.1.3 2.3.5 3.6.5 5.1 0 9.2-3.4 9.2-7.8S17.1 3 12 3zm0 13.1c-1 0-2-.1-2.9-.4l-.4-.1-1.6.6.3-1.4-.3-.4c-.9-.8-1.5-1.9-1.5-3.1 0-2.5 2.4-4.5 5.4-4.5s5.4 2 5.4 4.5-2.4 4.8-5.4 4.8zM9.4 9.3a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7zm5.2 0a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7z"/></svg>';
  var ICON_SEND =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.2 20.4 21.6 12 3.2 3.6 3.2 10.2 15.6 12 3.2 13.8z"/></svg>';

  /* ---------------- 状态 ---------------- */

  var root = null;
  var panel = null;
  var body = null;
  var chipsBox = null;
  var input = null;
  var teaser = null;
  var openedAt = 0; /* 时间陷阱用：面板打开时刻 */
  var leadShown = false;

  /* ---------------- 渲染：对话气泡 ---------------- */

  function scrollDown() {
    if (!body) return;
    try {
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function pushUser(text) {
    var m = el('div', 'asst-msg asst-msg-user', esc(text));
    body.appendChild(m);
    scrollDown();
    return m;
  }

  function pushBot(text) {
    var m = el('div', 'asst-msg asst-msg-bot', esc(text));
    body.appendChild(m);
    scrollDown();
    return m;
  }

  function pushTyping() {
    var m = el('div', 'asst-msg asst-msg-bot');
    m.innerHTML =
      '<span class="asst-typing" aria-label="' + esc(t(KB.ui.typing)) + '"><i></i><i></i><i></i></span>';
    body.appendChild(m);
    scrollDown();
    return m;
  }

  /* ---------------- 留资表单（答不上来时展开） ---------------- */

  function pushLeadForm(question) {
    if (leadShown) return;
    leadShown = true;

    var form = el('form', 'asst-lead');
    form.innerHTML =
      '<p class="asst-lead-t">' + esc(t(KB.ui.leadTitle)) + '</p>' +
      '<input type="text" data-a-contact maxlength="120" required ' +
      'placeholder="' + esc(t(KB.ui.leadPlaceholder)) + '" autocomplete="email">' +
      '<textarea data-a-msg maxlength="2000" rows="3">' + esc(question || '') + '</textarea>' +
      '<button type="submit" class="asst-lead-btn">' + esc(t(KB.ui.leadSend)) + '</button>' +
      '<p class="asst-lead-note">' + esc(t(KB.ui.leadNote)) + '</p>' +
      '<p class="asst-lead-err" data-a-err hidden></p>';

    body.appendChild(form);
    scrollDown();

    var err = form.querySelector('[data-a-err]');
    var btn = form.querySelector('.asst-lead-btn');
    var contact = form.querySelector('[data-a-contact]');
    var msg = form.querySelector('[data-a-msg]');

    function showErr(text) {
      if (!err) return;
      err.textContent = text;
      err.hidden = !text;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showErr('');

      var c = String(contact.value || '').trim();
      var looksLikeContact =
        /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(c) ||
        ((c.match(/\d/g) || []).length >= 7 && /^[+()\-\s\d.]+$/.test(c));
      if (!looksLikeContact) {
        showErr('Please add a valid WhatsApp number or email.');
        try { contact.focus(); } catch (e2) {}
        return;
      }

      var question2 = String(msg.value || '').trim() || question || 'Wholesale inquiry from the website assistant.';
      btn.disabled = true;

      /* 接口要求：距渲染至少 1.5 秒才收（防机器人），不够就等一下 */
      var wait = Math.max(0, 1600 - (Date.now() - openedAt));
      setTimeout(function () {
        postLead(c, question2)
          .then(function (r) {
            if (r.ok) {
              pushBot(t(KB.ui.leadOk));
              form.remove();
              return;
            }
            if (r.status === 429) {
              showErr('Too many requests from your network. Please try again later, or message us on WhatsApp.');
              btn.disabled = false;
              return;
            }
            if (r.status === 422) {
              showErr('Please check the contact you entered and try again.');
              btn.disabled = false;
              return;
            }
            /* 503 / 404 / 405 / 网络错误：接口还没上线，退到 WhatsApp */
            showErr(t(KB.ui.leadErr));
            btn.disabled = false;
            var wa = el('a', 'asst-handoff', esc(t(KB.ui.handoff)));
            wa.href = waHref(question2);
            wa.target = '_blank';
            wa.rel = 'noreferrer';
            form.appendChild(wa);
          })
          .catch(function () {
            showErr(t(KB.ui.leadErr));
            btn.disabled = false;
            var wa = el('a', 'asst-handoff', esc(t(KB.ui.handoff)));
            wa.href = waHref(question2);
            wa.target = '_blank';
            wa.rel = 'noreferrer';
            form.appendChild(wa);
          });
      }, wait);
    });
  }

  /** POST 到站点已有的需求接口，字段名与 lead-form.js 保持一致 */
  function postLead(contact, question) {
    var payload = {
      product: question.slice(0, 1200),
      contact: contact,
      category: '',
      country: '',
      qty: '',
      target_price: '',
      message: question.slice(0, 2000),
      company: '', /* 蜜罐：真人看不见，留空 */
      files: [],
      ts: openedAt,
      lang: lang(),
      page: location.pathname + (location.hash || ''),
      referrer: document.referrer || '',
    };
    return fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r
          .json()
          .then(function (j) {
            return { status: r.status, ok: r.status === 200 && j && j.ok, body: j };
          })
          .catch(function () {
            return { status: r.status, ok: false, body: null };
          });
      });
  }

  /* ---------------- 多轮历史（喂给智能体做上下文） ---------------- */
  var history = [];

  /* ---------------- 规则应答（AI 不可用时的兜底） ---------------- */
  function rulesAnswer(text) {
    var m = KB.match(text);
    if (m) {
      pushBot(t(m.intent.answer));
      history.push({ role: 'assistant', content: t(m.intent.answer) });
      if (m.id === 'contact') return;
    } else {
      pushBot(t(KB.fallback));
      history.push({ role: 'assistant', content: t(KB.fallback) });
      pushLeadForm(text);
    }
  }

  /* ---------------- 智能体应答（自由输入主路径） ---------------- */
  function chatAnswer(text) {
    var typing = pushTyping();
    var payload = {
      message: text,
      history: history.slice(-8),
      lang: lang(),
    };
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, j: j }; });
      })
      .catch(function () { return { status: 0, j: null }; })
      .then(function (res) {
        typing.remove();
        var j = res.j;
        if (j && j.ok && typeof j.reply === 'string' && j.reply.trim()) {
          pushBot(j.reply);
          history.push({ role: 'assistant', content: j.reply });
        } else {
          /* 智能体不可用（未配置 / 出错 / 超时）→ 回退规则，绝不卡住客户 */
          rulesAnswer(text);
        }
      });
  }

  function sendFreeText(text) {
    pushUser(text);
    history.push({ role: 'user', content: text });
    chatAnswer(text);
  }

  /* ---------------- 快捷问题（即时规则，零成本，走 short 短答案） ---------------- */
  function answerTopic(text, intentId) {
    pushUser(text);
    history.push({ role: 'user', content: text });
    var intent = null;
    for (var i = 0; i < KB.intents.length; i++) {
      if (KB.intents[i].id === intentId) { intent = KB.intents[i]; break; }
    }
    if (!intent) { chatAnswer(text); return; }
    var typing = pushTyping();
    setTimeout(function () {
      typing.remove();
      var reply = t(intent.short) || t(intent.answer);
      pushBot(reply);
      history.push({ role: 'assistant', content: reply });
    }, 300);
  }

  function ask(text, intentId) {
    if (intentId) answerTopic(text, intentId);
    else sendFreeText(text);
  }

  /* ---------------- 快捷问题 ---------------- */

  function buildChips() {
    chipsBox.innerHTML = '';
    KB.quickReplies.forEach(function (q) {
      var b = el('button', 'asst-chip', esc(t(q.label)));
      b.type = 'button';
      b.addEventListener('click', function () {
        ask(t(q.label), q.id);
      });
      chipsBox.appendChild(b);
    });
  }

  /* ---------------- 开关面板 ---------------- */

  function open() {
    if (!root) return;
    openedAt = Date.now();
    root.classList.add('is-open');
    if (teaser) teaser.classList.remove('is-visible');
    try { sessionStorage.setItem('eddysupply.asst.seen', '1'); } catch (e) {}
    setTimeout(function () {
      try { input.focus({ preventScroll: true }); } catch (e) {}
    }, 280);
  }

  function close() {
    if (!root) return;
    root.classList.remove('is-open');
    try { input.blur(); } catch (e) {}
  }

  /* ---------------- 挂载 ---------------- */

  function mount() {
    if (document.querySelector('.asst-root')) return;

    root = el('div', 'asst-root');

    /* 面板 */
    panel = el('aside', 'asst-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', t(KB.ui.title));
    panel.innerHTML =
      '<div class="asst-head">' +
      '<span class="asst-avatar" aria-hidden="true">' + ICON_CHAT + '</span>' +
      '<div class="asst-head-txt">' +
      '<p class="asst-title">' + esc(t(KB.ui.title)) + '</p>' +
      '<p class="asst-status"><span class="asst-dot" aria-hidden="true"></span>' + esc(t(KB.ui.status)) + '</p>' +
      '</div>' +
      '<button type="button" class="asst-close" aria-label="Close">' + '&times;' + '</button>' +
      '</div>';

    body = el('div', 'asst-body');
    chipsBox = el('div', 'asst-chips');

    var foot = el('div', 'asst-foot');
    var inputRow = el('div', 'asst-inputrow');
    input = el('input', 'asst-input');
    input.type = 'text';
    input.setAttribute('aria-label', t(KB.ui.placeholder));
    input.placeholder = t(KB.ui.placeholder);
    input.maxLength = 500;
    var send = el('button', 'asst-send', ICON_SEND);
    send.type = 'button';
    send.setAttribute('aria-label', t(KB.ui.send));
    inputRow.appendChild(input);
    inputRow.appendChild(send);

    var handoff = el('a', 'asst-handoff', esc(t(KB.ui.handoff)));
    handoff.href = waHref();
    handoff.target = '_blank';
    handoff.rel = 'noreferrer';

    foot.appendChild(inputRow);
    foot.appendChild(handoff);

    panel.appendChild(body);
    panel.appendChild(foot);

    /* 气泡按钮 */
    var fab = el('button', 'asst-fab', ICON_CHAT);
    fab.type = 'button';
    fab.setAttribute('aria-label', t(KB.ui.title));

    /* 引导语 */
    teaser = el('p', 'asst-teaser', esc(t(KB.ui.teaser)));
    teaser.setAttribute('role', 'button');
    teaser.tabIndex = 0;

    root.appendChild(panel);
    root.appendChild(teaser);
    root.appendChild(fab);
    document.body.appendChild(root);

    /* 初始内容 */
    pushBot(t(KB.ui.welcome));
    buildChips();
    body.appendChild(chipsBox);

    /* 事件 */
    fab.addEventListener('click', function () {
      root.classList.contains('is-open') ? close() : open();
    });
    teaser.addEventListener('click', open);
    panel.querySelector('.asst-close').addEventListener('click', close);

    function submit() {
      var v = String(input.value || '').trim();
      if (!v) return;
      input.value = '';
      ask(v);
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) close();
    });

    /* 首次访问：延迟弹出引导语 */
    var seen = false;
    try { seen = sessionStorage.getItem('eddysupply.asst.seen') === '1'; } catch (e) {}
    if (!seen) {
      setTimeout(function () {
        if (!root.classList.contains('is-open')) teaser.classList.add('is-visible');
      }, 4200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.EddyAssistant = { open: open, close: close, ask: ask };
})();
