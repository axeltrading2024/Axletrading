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
          '<div class="lf-field lf-full lf-files-field">' +
            '<span class="lf-lbl" data-i18n="req_f_files">Reference photos or files (optional)</span>' +
            '<label class="lf-drop" data-lf-drop>' +
              '<input type="file" data-lf-file multiple ' +
                'accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip">' +
              '<span class="lf-drop-ico" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
                  '<path d="M7 10l5-5 5 5"/><path d="M12 5v12"/></svg>' +
              '</span>' +
              '<span class="lf-drop-txt" data-i18n="req_files_cta">Click to upload, or drag files here</span>' +
              '<span class="lf-drop-hint" data-i18n="req_files_hint">Photos, PDF, Word or Excel · up to 5 files, 6MB each</span>' +
            '</label>' +
            '<div class="lf-filelist" data-lf-filelist></div>' +
          '</div>' +
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

  function doneHtml(fileCount) {
    var wa = document.querySelector('[data-lf-wa-fallback]');
    var waHref = wa ? wa.getAttribute('href') : '#';
    var filesNote = fileCount
      ? '<p class="lf-done-files">' +
        esc(T('req_ok_files', 'Your {n} attachment(s) came through too.').replace('{n}', String(fileCount))) +
        '</p>'
      : '';
    return '' +
      '<div class="lf-done">' +
        '<span class="lf-done-ico" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M20 6 9 17l-5-5"/></svg>' +
        '</span>' +
        '<h3 data-i18n="req_ok_title">Request received</h3>' +
        '<p data-i18n="req_ok_body">Thanks — we&rsquo;ll come back to you within 24 hours with pricing and options.</p>' +
        filesNote +
        '<a class="btn btn-whatsapp lf-done-wa" data-wa-chat href="' + esc(waHref) + '" target="_blank" rel="noreferrer">' +
          '<span data-i18n="req_ok_wa">Chat on WhatsApp now</span></a>' +
      '</div>';
  }

  /* ---------------- 附件上传 ---------------- */

  var FILE = { max: 5, maxBytes: 6 * 1024 * 1024, files: [] };
  var fileSeq = 0;

  function fmtSize(n) {
    n = Number(n) || 0;
    if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
    if (n >= 1024) return Math.round(n / 1024) + ' KB';
    return n + ' B';
  }

  function fileIcon(kind) {
    if (kind === 'image') return 'IMG';
    if (kind === 'pdf') return 'PDF';
    if (kind === 'doc') return 'DOC';
    return 'FILE';
  }

  function renderFiles(form) {
    var list = form.querySelector('[data-lf-filelist]');
    if (!list) return;
    if (!FILE.files.length) {
      list.innerHTML = '';
      return;
    }
    list.innerHTML = FILE.files
      .map(function (f) {
        var state =
          f.status === 'uploading'
            ? '<span class="lf-chip-pct">' + (f.pct || 0) + '%</span>'
            : f.status === 'error'
            ? '<span class="lf-chip-bad">' + esc(T('req_file_failed', 'failed')) + '</span>'
            : '<span class="lf-chip-ok" aria-hidden="true">✓</span>';
        return (
          '<div class="lf-chip' + (f.status === 'error' ? ' is-bad' : '') + '" data-file="' + f.id + '">' +
            '<span class="lf-chip-kind">' + fileIcon(f.kind) + '</span>' +
            '<span class="lf-chip-name" title="' + esc(f.name) + '">' + esc(f.name) + '</span>' +
            '<span class="lf-chip-size">' + esc(fmtSize(f.size)) + '</span>' +
            state +
            '<button type="button" class="lf-chip-x" data-lf-remove="' + f.id + '" ' +
              'aria-label="' + esc(T('req_file_remove', 'Remove')) + '">&times;</button>' +
            (f.status === 'uploading'
              ? '<span class="lf-chip-bar" style="width:' + (f.pct || 0) + '%"></span>'
              : '') +
          '</div>'
        );
      })
      .join('');
  }

  /** 图片在前端缩到最长边 1600px 再传，手机直出 4MB 照片通常能压到 300KB 左右 */
  function compressImage(file) {
    return new Promise(function (resolve) {
      var isImg = /^image\//.test(file.type);
      if (!isImg || /gif|svg|heic|heif/.test(file.type)) return resolve(file);
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var maxSide = 1600;
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var scale = Math.min(1, maxSide / Math.max(w, h));
        if (scale === 1 && file.size <= 900 * 1024) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * scale);
        cv.height = Math.round(h * scale);
        var cx = cv.getContext('2d');
        cx.fillStyle = '#ffffff';
        cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(
          function (blob) {
            URL.revokeObjectURL(url);
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            var base = file.name.replace(/\.[^.]+$/, '');
            resolve(new File([blob], base + '.jpg', { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  /**
   * 生成后台用的缩略图（最长边 400px、JPEG 0.7，通常 15–35KB）。
   * 后台列表只拉这张小图，点开才拉原图 —— 国内网络打开后台也不会卡。
   * 非图片返回 null（PDF/表格不需要缩略图）。
   */
  function makeThumb(file) {
    return new Promise(function (resolve) {
      if (!/^image\//.test(file.type)) return resolve(null);
      if (/svg|heic|heif/.test(file.type)) return resolve(null);
      var url = null;
      try {
        url = URL.createObjectURL(file);
      } catch (e) {
        return resolve(null);
      }
      var img = new Image();
      var done = false;
      var finish = function (v) {
        if (done) return;
        done = true;
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
        resolve(v);
      };
      img.onload = function () {
        try {
          var maxSide = 400;
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var scale = Math.min(1, maxSide / Math.max(w || 1, h || 1));
          var cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(w * scale));
          cv.height = Math.max(1, Math.round(h * scale));
          var cx = cv.getContext('2d');
          cx.fillStyle = '#ffffff';
          cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          cv.toBlob(
            function (blob) {
              finish(blob && blob.size ? blob : null);
            },
            'image/jpeg',
            0.7
          );
        } catch (e) {
          finish(null);
        }
      };
      img.onerror = function () {
        finish(null);
      };
      img.src = url;
    });
  }

  function uploadOne(item, form) {
    return new Promise(function (resolve) {
      var fd = new FormData();
      fd.append('file', item.blob, item.name);
      if (item.thumb) fd.append('thumb', item.thumb, 'thumb.jpg');
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          item.pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
          renderFiles(form);
        }
      };
      xhr.onload = function () {
        var j = null;
        try {
          j = JSON.parse(xhr.responseText);
        } catch (e) {}
        if (xhr.status === 200 && j && j.ok && j.files && j.files[0]) {
          item.token = j.files[0].token;
          item.size = j.files[0].size;
          item.name = j.files[0].name;
          item.status = 'done';
          item.pct = 100;
        } else {
          item.status = 'error';
          item.err = (j && j.error) || 'http_' + xhr.status;
          // 接口还没上线（503/404/405）：附件功能暂时不可用，但别挡住客户提交
          if (xhr.status === 503 || xhr.status === 404 || xhr.status === 405) item.unsupported = true;
        }
        renderFiles(form);
        resolve(item);
      };
      xhr.onerror = function () {
        item.status = 'error';
        item.err = 'network';
        renderFiles(form);
        resolve(item);
      };
      xhr.send(fd);
    });
  }

  function addFiles(fileList, form) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;
    var errBox = form.querySelector('[data-lf-err]');

    incoming.forEach(function (f) {
      if (FILE.files.length >= FILE.max) return;
      if (f.size > FILE.maxBytes) {
        if (errBox) {
          errBox.textContent = T('req_err_file_size', 'Each file must be under 6MB.');
          errBox.hidden = false;
        }
        return;
      }
      var kind = /^image\//.test(f.type) ? 'image' : /pdf$/.test(f.type) ? 'pdf' : 'doc';
      var item = {
        id: 'f' + ++fileSeq,
        blob: f,
        name: f.name,
        size: f.size,
        kind: kind,
        status: 'uploading',
        pct: 0,
        token: '',
      };
      FILE.files.push(item);
      renderFiles(form);

      // 压缩主图 + 生成缩略图并行做，两个都好了再上传（一次请求带两个字段）
      var mainJob = compressImage(f).then(function (out) {
        item.blob = out;
        item.size = out.size;
        item.kind = /^image\//.test(out.type) ? 'image' : item.kind;
        return out;
      });
      var thumbJob = makeThumb(f).then(function (t) {
        item.thumb = t;
        return t;
      });

      Promise.all([mainJob, thumbJob])
        .then(function () {
          return uploadOne(item, form);
        })
        .then(function () {
          if (item.unsupported) {
            FILE.files = FILE.files.filter(function (x) {
              return x.id !== item.id;
            });
            renderFiles(form);
            if (errBox) {
              errBox.textContent = T('req_files_unavailable', 'File upload is not available right now — you can still send your request, and share photos on WhatsApp afterwards.');
              errBox.hidden = false;
            }
          }
        });
    });
  }

  function wireFiles(form) {
    var input = form.querySelector('[data-lf-file]');
    var drop = form.querySelector('[data-lf-drop]');
    if (input) {
      input.addEventListener('change', function () {
        addFiles(input.value ? input.files : [], form);
        input.value = '';
      });
    }
    if (drop) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          drop.classList.add('is-over');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          drop.classList.remove('is-over');
        });
      });
      drop.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files, form);
      });
    }
    form.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lf-remove]');
      if (!btn) return;
      e.preventDefault();
      var id = btn.getAttribute('data-lf-remove');
      FILE.files = FILE.files.filter(function (x) {
        return x.id !== id;
      });
      renderFiles(form);
    });
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
      files: FILE.files
        .filter(function (f) {
          return f.status === 'done' && f.token;
        })
        .map(function (f) {
          return f.token;
        }),
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

    // 还有文件在传：等它传完再提交，别把 token 丢了
    var busy = FILE.files.filter(function (f) {
      return f.status === 'uploading';
    });
    if (busy.length) {
      showErr(form, T('req_files_uploading', 'Uploading your files, please wait…'));
      setTimeout(function () {
        submit(form);
      }, 700);
      return;
    }
    var bad = FILE.files.filter(function (f) {
      return f.status === 'error';
    });
    if (bad.length) {
      showErr(form, T('req_files_retry', 'Some files could not be uploaded. Remove them and try again.'));
      return;
    }

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
          var sent = data.files ? data.files.length : 0;
          FILE.files = [];
          host.innerHTML = doneHtml(sent);
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
    wireFiles(form);

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
