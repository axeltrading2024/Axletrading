/**
 * pub-batch.js —— 一次提交发布多个文件（推荐用它代替 tools/pub.js）
 *
 * 为什么需要：
 *   pub.js 是「一个文件一次 PUT」，推 9 个文件 = 9 个 commit = Cloudflare Pages
 *   触发 9 次构建，构建串行排队，往往要等十几分钟才全部生效，而且中途看到
 *   「CSS 更新了、HTML 还没更新」的诡异状态。
 *   pub-batch.js 走 Git Data API（blob → tree → commit → 更新 ref），
 *   无论多少个文件都只产生 1 个 commit、1 次构建。
 *
 * 用法：
 *   node tools/pub-batch.js <文件> [文件2 ...]
 *   MSG="提交信息" node tools/pub-batch.js <文件...>
 *
 * token：从 .gh_hdr.txt 第一行 "Authorization: Bearer <token>" 读取（不落字面量）
 */
const fs = require('fs');
const path = require('path');

const REPO = 'axeltrading2024/Axletrading';
const BR = 'main';
const ROOT = path.join(__dirname, '..');

const token = fs
  .readFileSync(path.join(ROOT, '.gh_hdr.txt'), 'utf8')
  .split(/\r?\n/)[0]
  .replace(/^Authorization:\s*Bearer\s*/i, '')
  .trim();
if (!token) {
  console.error('拿不到 token（检查 .gh_hdr.txt 第一行）');
  process.exit(1);
}

const headers = {
  Authorization: 'Bearer ' + token,
  'User-Agent': 'pub-batch',
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 带重试的 GitHub 调用（Pages/规则校验偶发 409 "Timed out validating rule"） */
async function gh(url, init) {
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(40000) });
      if (r.ok) return await r.json();
      const t = await r.text();
      console.log('  尝试 ' + i + ' 失败 HTTP ' + r.status + ' ' + t.slice(0, 160));
      if (r.status === 401 || r.status === 403) process.exit(1);
    } catch (e) {
      console.log('  尝试 ' + i + ' 异常 ' + e.message);
    }
    await sleep(2000 * i);
  }
  return null;
}

(async () => {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('用法: node tools/pub-batch.js <文件...>');
    process.exit(1);
  }

  // 1) 取当前 main 最新 commit 与其 tree
  const ref = await gh(`https://api.github.com/repos/${REPO}/git/ref/heads/${BR}`, { method: 'GET' });
  if (!ref) { console.error('读不到分支 ref'); process.exit(1); }
  const parentSha = ref.object.sha;
  const parent = await gh(`https://api.github.com/repos/${REPO}/git/commits/${parentSha}`, { method: 'GET' });
  if (!parent) { console.error('读不到父提交'); process.exit(1); }
  console.log('父提交: ' + parentSha.slice(0, 7) + '  tree: ' + parent.tree.sha.slice(0, 7));

  // 2) 每个文件建 blbo
  const tree = [];
  for (const f of files) {
    const rel = String(f).replace(/\\/g, '/').replace(/^\.\//, '');
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) { console.log(rel + ' -> 跳过（本地不存在）'); continue; }
    const buf = fs.readFileSync(abs);
    const blob = await gh(`https://api.github.com/repos/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }),
    });
    if (!blob) { console.error(rel + ' -> blob 创建失败'); process.exit(1); }
    tree.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha });
    console.log(rel + ' -> blob ' + blob.sha.slice(0, 7) + ' (' + buf.length + ' B)');
  }
  if (!tree.length) { console.error('没有可发布的文件'); process.exit(1); }

  // 3) 组合新 tree（base_tree 保证未改动的文件保留）
  const newTree = await gh(`https://api.github.com/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
  });
  if (!newTree) { console.error('tree 创建失败'); process.exit(1); }
  console.log('新 tree: ' + newTree.sha.slice(0, 7));

  // 4) 建 commit
  const msg = process.env.MSG || process.env.GH_MSG || 'update: ' + tree.length + ' files';
  const commit = await gh(`https://api.github.com/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: msg, tree: newTree.sha, parents: [parentSha] }),
  });
  if (!commit) { console.error('commit 创建失败'); process.exit(1); }
  console.log('新 commit: ' + commit.sha.slice(0, 7));

  // 5) 更新分支指针（不加 force：如已被别的提交推进则失败并重试）
  const moved = await gh(`https://api.github.com/repos/${REPO}/git/refs/heads/${BR}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  if (!moved) { console.error('更新分支失败'); process.exit(1); }

  console.log('\n完成：' + tree.length + ' 个文件 → 1 个 commit（' + commit.sha.slice(0, 7) + '）');
  console.log('Cloudflare Pages 只需构建 1 次。');
})().catch((e) => { console.error('发布异常:', e); process.exit(1); });
