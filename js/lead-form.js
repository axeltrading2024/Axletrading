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
    /* 首项带 data-i18n：切语言时 applyLang 会把 option 文本一起换掉 */
    var html = '<option value="" data-i18n="req_cat_any">' + esc(T('req_cat_any', 'Not sure / other')) + '</option>';
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
          '<details class="lf-more lf-full">' +
            '<summary class="lf-more-sum">' +
              '<span class="lf-more-ico" aria-hidden="true"></span>' +
              '<span data-i18n="req_more_details">More details (optional)</span>' +
            '</summary>' +
            '<div class="lf-more-body lf-grid">' +
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
            '</div>' +
          '</details>' +
          '<label class="lf-field lf-full">' +
            '<span class="lf-lbl" data-i18n="req_f_msg">Tell us more (optional)</span>' +
            '<textarea data-lf-message rows="3" maxlength="' + MAX.message + '" ' +
              'data-i18n-ph="req_ph_msg" placeholder="Packaging, label, certification, deadline — the more detail, the better we can quote."></textarea>' +
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
          '<p class="lf-note" data-i18n="req_note">Eddy reads every request himself. No spam, ever.</p>' +
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
        '<h3 data-i18n="req_ok_title">Thank you &mdash; we&rsquo;re on it.</h3>' +
        '<p data-i18n="req_ok_body">Your request is in. Every detail you shared helps us grow: it tells us what buyers actually want, and that shapes what we source, how we pack it and how we price it.</p>' +
        filesNote +
        '<p class="lf-done-sign" data-i18n="req_ok_sign">&mdash; Eddy, EddyTrading</p>' +
        '<div class="lf-why">' +
          '<div class="lf-why-frame">' +
            '<video class="lf-why-video" src="img/proof/order-10s.mp4" poster="img/proof/order-10s.jpg" width="720" height="440" muted loop playsinline preload="none"></video>' +
            '<button type="button" class="lf-why-play" data-lf-why-play data-i18n-aria="req_ok_watch" aria-label="See what happens next (7 seconds)">' +
              '<span class="lf-why-ico" aria-hidden="true">&#9654;</span>' +
            '</button>' +
          '</div>' +
          '<p class="lf-why-cap">' +
            '<b data-i18n="req_ok_watch">See what happens next &middot; 7s</b>' +
            '<span data-i18n="req_ok_why">Quote, then a photo of your parcel and its tracking number.</span>' +
          '</p>' +
        '</div>' +
        '<div class="lf-done-actions">' +
          '<a class="btn btn-whatsapp lf-done-wa" data-wa-chat href="' + esc(waHref) + '" target="_blank" rel="noreferrer">' +
            '<span data-i18n="req_ok_wa">Chat on WhatsApp now</span></a>' +
          '<button type="button" class="btn btn-outline btn-sm lf-done-again" data-lf-again>' +
            '<span data-i18n="req_ok_again">Send another request</span></button>' +
        '</div>' +
        '<p class="lf-done-hint" data-i18n="req_ok_again_hint">Sourcing more than one item? Send them separately — we quote each one properly.</p>' +
      '</div>';
  }

  /* 成功页里的小视频：点了才播，避免一提交就自动播消耗流量 */
  function bindWhy(host) {
    var box = host.querySelector('.lf-why');
    if (!box) return;
    var v = box.querySelector('.lf-why-video');
    var btn = box.querySelector('[data-lf-why-play]');
    if (!v || !btn) return;
    btn.addEventListener('click', function () {
      box.classList.add('is-playing');
      v.setAttribute('controls', '');
      try {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    });
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
    var host =
      (form && (form.closest('[data-lead-form]') || form.parentNode)) ||
      document.querySelector('[data-lead-form]');
    if (!host) return;
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
          var again = host.querySelector('[data-lf-again]');
          if (again) {
            again.addEventListener('click', function () {
              restart(host);
            });
          }
          bindWhy(host);
          scrollInto(host, 'center');
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

  /* ---------------- 客服悬浮窗：右侧竖向胶囊 → 右侧抽屉 ---------------- */

  var ask = { lastFocus: null };

  function askLayer() {
    return document.querySelector('[data-ask-layer]');
  }

  function raf(fn) {
    if (window.requestAnimationFrame) window.requestAnimationFrame(fn);
    else setTimeout(fn, 16);
  }

  function askOpen(e) {
    if (e && e.preventDefault) e.preventDefault();
    var layer = askLayer();
    if (!layer) return;
    ask.lastFocus = document.activeElement;
    layer.hidden = false;
    // 先渲染出来再加类，否则没有滑入过渡
    raf(function () {
      layer.classList.add('open');
    });
    document.body.classList.add('ask-lock');
    var tab = document.querySelector('[data-ask-open]');
    if (tab) tab.setAttribute('aria-expanded', 'true');
    setTimeout(function () {
      var first = layer.querySelector('[data-lf-product]');
      if (first) {
        try { first.focus({ preventScroll: true }); } catch (err) { try { first.focus(); } catch (e2) {} }
      }
    }, 280);
  }

  function askClose() {
    var layer = askLayer();
    if (!layer) return;
    layer.classList.remove('open');
    document.body.classList.remove('ask-lock');
    var tab = document.querySelector('[data-ask-open]');
    if (tab) tab.setAttribute('aria-expanded', 'false');
    setTimeout(function () {
      if (!layer.classList.contains('open')) layer.hidden = true;
    }, 340);
    if (ask.lastFocus && ask.lastFocus.focus) {
      try { ask.lastFocus.focus({ preventScroll: true }); } catch (err) {}
    }
  }

  function initAsk() {
    var layer = askLayer();
    var tab = document.querySelector('[data-ask-open]');
    if (!layer || !tab) return;

    tab.addEventListener('click', askOpen);

    Array.prototype.forEach.call(layer.querySelectorAll('[data-ask-close]'), function (n) {
      n.addEventListener('click', function (e) {
        e.preventDefault();
        askClose();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && layer.classList.contains('open')) askClose();
    });

    /* 页脚「Send a product request」等所有 #request 链接都改成打开抽屉，
       不再跳到已经不存在的页面区块 */
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (/^#request$/.test(href) || /(^|\/)(index\.html)?#request$/.test(href)) {
        e.preventDefault();
        askOpen();
      }
    });

    /* 别人直接把 .../index.html#request 发过来时，落地就展开 */
    if (location.hash === '#request') setTimeout(askOpen, 150);

    window.EddyAsk = { open: askOpen, close: askClose };
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

  /* 轻量滚动工具：jsdom / 老浏览器没有 scrollIntoView 时不要打断流程 */
  function scrollInto(el, block) {
    if (!el) return;
    try {
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: block || 'center', behavior: 'smooth' });
      }
    } catch (e) {}
  }

  /* 成功页上「再提交一个」：把空表单放回来，并滚回顶部、聚焦第一个字段 */
  function restart(host) {
    if (!host) return;
    FILE.files = [];
    fileSeq = 0;
    host.removeAttribute('data-lf-ready');
    host.innerHTML = '';
    mount(host);
    resetScroll(host);
    var p = host.querySelector('[data-lf-product]');
    if (p && typeof p.focus === 'function') {
      try {
        p.focus({ preventScroll: true });
      } catch (e) {
        p.focus();
      }
    }
  }

  function resetScroll(el) {
    var p = el && el.parentNode;
    while (p && p !== document.body && p !== document.documentElement) {
      var oy = '';
      try {
        oy = window.getComputedStyle(p).overflowY;
      } catch (e) {}
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) {
        p.scrollTop = 0;
        return;
      }
      p = p.parentNode;
    }
    try {
      if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  }

  function init() {
    initAsk();
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
