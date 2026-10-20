/**
 * tools/check-functions.js —— Functions 引用路径自检
 *
 * 为什么要有它：
 *   tools/dev-server.js 和 tools/test-lead-api.js 是「把文件源码拼起来」跑的，
 *   会把 import 语句整行删掉，所以相对路径写错（比如少一级 ../）在本地完全看不出来——
 *   而 Cloudflare Pages 构建用的是真打包器，路径一错就直接 build failed，站点整站不更新。
 *   2026-10-20 就因为这个坑，Pages 从 f7a1632 起连续 2 次部署失败。
 *
 * 做什么：
 *   扫描 functions/ 下所有 .js，把每个相对 import 解析成真实路径，检查文件是否存在。
 *   比跑 wrangler 快得多（毫秒级），可以每次发布前跑。
 *
 * 用法：node tools/check-functions.js
 * 退出码：0 = 全部通过，1 = 有坏引用
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FN = path.join(ROOT, 'functions');

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|ts)$/.test(name)) out.push(p);
  }
  return out;
}

if (!fs.existsSync(FN)) {
  console.log('functions/ 不存在，跳过');
  process.exit(0);
}

const files = walk(FN, []);
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g;
const BARE_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;

let bad = 0;
let checked = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const specs = new Set();
  let m;
  while ((m = IMPORT_RE.exec(src))) specs.add(m[1]);
  while ((m = BARE_RE.exec(src))) specs.add(m[1]);

  for (const spec of specs) {
    if (!spec.startsWith('.')) continue; // 裸模块名交给运行时
    checked++;
    const target = path.resolve(path.dirname(file), spec);
    const candidates = [target, target + '.js', target + '.mjs', path.join(target, 'index.js')];
    const hit = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (!hit) {
      bad++;
      console.log('✗ ' + rel + '  →  ' + spec + '  (解析为 ' + path.relative(ROOT, target).replace(/\\/g, '/') + '，不存在)');
    }
  }
}

console.log('\n检查 ' + files.length + ' 个函数文件，' + checked + ' 条相对引用，' + (bad ? bad + ' 条错误' : '全部通过'));
process.exit(bad ? 1 : 0);
