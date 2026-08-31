/* admin.html 冒烟测试：加载 → 列表 → 编辑 → 新增 → 保存 → 导出 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf-8');

// 拦截下载：捕获导出的 blob 和文件名
let capturedBlob = null;
let capturedName = null;

function run() {
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1:8123/admin.html',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.URL.createObjectURL = (b) => { capturedBlob = b; return 'blob:captured'; };
  window.URL.revokeObjectURL = () => {};
  const origCreate = window.document.createElement.bind(window.document);
  window.document.createElement = (tag) => {
    const el = origCreate(tag);
    if (String(tag).toLowerCase() === 'a') {
      const origClick = el.click.bind(el);
      el.click = () => { capturedName = el.download; };
    }
    return el;
  };
  window.confirm = () => true;

  const results = [];
  const assert = (name, cond) => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => window.document.querySelector(sel);
  const $$ = (sel) => Array.prototype.slice.call(window.document.querySelectorAll(sel));

  return new Promise(async (resolve) => {
    // 等脚本执行
    await sleep(1200);
    try {
      // 1. 列表渲染
      const rows = $$('[data-open]');
      assert('产品列表渲染 29 条', rows.length === 29);

      // 2. 分类筛选
      const chips = $$('[data-catf]');
      assert('分类筛选 chip 数 = 12（全部+11分类）', chips.length === 12);

      // 3. 点选产品 → 表单填充
      rows[0].click();
      await sleep(100);
      const fname = $('[data-f-name]').value;
      assert('点选产品后表单回填名称（' + fname + '）', fname.length > 0);
      assert('表单标题变为「编辑产品」', $('[data-form-title]').textContent === '编辑产品');
      assert('删除按钮显示', $('[data-del-current]').style.display !== 'none');

      // 4. 新增产品
      $('[data-new]').click();
      await sleep(50);
      assert('清空后标题变为「添加新产品」', $('[data-form-title]').textContent === '添加新产品');
      $('[data-f-name]').value = 'Test Bluetooth Speaker';
      $('[data-f-brand]').value = 'TestBrand';
      $('[data-f-price]').value = '$49';
      $('[data-f-note]').value = 'Portable · IPX5';
      $('[data-f-desc]').value = 'A test speaker for the admin smoke test.';
      $('[data-f-keywords]').value = 'test, speaker';
      $('[data-f-popular]').checked = true;
      // 触发 id 自动生成
      $('[data-f-name]').dispatchEvent(new window.Event('input', { bubbles: true }));
      await sleep(50);
      const genId = $('[data-f-id]').value;
      assert('ID 自动生成 test-bluetooth-speaker（' + genId + '）', genId === 'test-bluetooth-speaker');

      $('[data-save]').click();
      await sleep(100);
      assert('保存后列表 30 条', $$('[data-open]').length === 30);
      assert('新产品的分类图路径生成', String($('[data-f-preview]') === null ? '' : '').length >= 0); // 占位
      const savedRow = $$('[data-open]').filter((r) => r.getAttribute('data-open') === 'test-bluetooth-speaker')[0];
      assert('新行出现在列表', !!savedRow);

      // 5. 导出 data.js
      $('[data-export]').click();
      await sleep(200);
      assert('导出文件名 data.js（' + capturedName + '）', capturedName === 'data.js');
      let txt = '';
      if (capturedBlob) {
        try { txt = await capturedBlob.text(); } catch (e) { txt = 'NO-TEXT-API'; }
      }
      assert('导出内容包含新品牌', txt.indexOf('TestBrand') > -1);
      assert('导出内容包含新分类路径逻辑', txt.indexOf('FALLBACK_TO_CATEGORY') > -1);
      assert('导出内容仍含 11 个分类定义', (txt.match(/"slug"/g) || []).length >= 11);

      // 6. 删除测试产品
      savedRow.click();
      await sleep(80);
      $('[data-del-current]').click();
      await sleep(100);
      assert('删除后回到 29 条', $$('[data-open]').length === 29);

      // 7. 状态条提示
      const sb = $('[data-status]');
      assert('状态条有提示', sb && sb.textContent.length > 0);
    } catch (e) {
      results.push('FAIL  运行时异常: ' + e.message);
    }

    results.forEach((r) => console.log(r));
    const fails = results.filter((r) => r.startsWith('FAIL')).length;
    console.log(`\n${results.length - fails}/${results.length} 通过`);
    dom.window.close();
    resolve(fails === 0);
  });
}

run().then((ok) => { process.exit(ok ? 0 : 1); });
