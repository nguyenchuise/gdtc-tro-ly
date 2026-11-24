// Ghép hình người vector (tệp HTML thầy cô tạo bằng Gemini) vào trang, cho mục "2. Video" của một bài.
//
//   node tools/import-gemini-figure.mjs <mã-bài> <tệp-phía-sau.html>
//   node tools/import-gemini-figure.mjs <mã-bài> <tệp-phía-trước.html> <tệp-phía-sau.html>   (cách cũ, vẫn nhận)
//
// Trang chỉ hiện góc nhìn PHÍA SAU dựng nhân tạo; góc phía trước dùng ảnh gốc SGK chạy động (tránh sai lệch
// so với sách). Tệp phía trước không bắt buộc, nếu có thì chỉ lưu để tham khảo.
//
// Công cụ lấy phần "động cơ vẽ" (màu đồng phục, khung xương, danh sách tư thế POSES, hàm nội suy
// samplePoseAtTime, các hàm vẽ SVG) trong thẻ <script> của mỗi tệp, bỏ phần giao diện riêng của Gemini,
// rồi ghi thành js/figures/<mã-bài>.front.js và js/figures/<mã-bài>.back.js. Sau đó tự chạy thử
// (vẽ mọi tư thế, không được có NaN) và bật "vectorFigure": true cho bài trong data/exercises.json.
//
// Tệp Gemini cần có (xem câu lệnh mẫu trong README, mục "Hình người vector"):
//   const POSES = [...]               mỗi tư thế có code, shortTitle, caption (mặt sau thêm rearTip, angleRef)
//   function samplePoseAtTime(t)      t chạy 0 → POSES.length, trả về tư thế có nearestIdx
//   function build...SvgInner(pose, prefix)   trả về nội dung bên trong <svg viewBox="0 0 360 390">
//   appState.showAI / showArrows / showXray    (chỉ các cờ này được dùng trong phần vẽ)
// Nếu tệp có dấu // @@ENGINE-START và // @@ENGINE-END thì lấy đúng đoạn giữa hai dấu đó.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const id = args[0];
const [frontFile, backFile] = args.length >= 3 ? [args[1], args[2]] : [null, args[1]];
if (!id || !backFile) {
  console.error('Cách dùng: node tools/import-gemini-figure.mjs <mã-bài> <tệp-phía-sau.html>');
  process.exit(1);
}
const data = JSON.parse(readFileSync(`${root}data/exercises.json`, 'utf8'));
const ex = data.exercises.find((e) => e.id === id);
if (!ex) { console.error(`❌ Không có bài "${id}" trong data/exercises.json`); process.exit(1); }

const fail = (m) => { console.error(`❌ ${m}`); process.exit(1); };

/** Lấy thẻ <script> nội tuyến chứa POSES. */
function mainScript(html, file) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const s = scripts.find((x) => /const\s+POSES\s*=/.test(x));
  if (!s) fail(`${file}: không thấy "const POSES = [...]" trong thẻ <script>.`);
  return s;
}

/** Vị trí kết thúc khối { ... } bắt đầu từ dấu { tại vị trí i (bỏ qua chuỗi và chú thích). */
function matchBrace(src, i) {
  let depth = 0;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); if (k < 0) break; continue; }
    if (c === '/' && src[k + 1] === '*') { k = src.indexOf('*/', k) + 1; continue; }
    if (c === '"' || c === "'" || c === '`') {
      for (k++; k < src.length && src[k] !== c; k++) if (src[k] === '\\') k++;
      continue;
    }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') { depth--; if (depth === 0) return k; }
  }
  return -1;
}

/** Lùi về đầu khối chú thích /** ... *\/ (hoặc dòng // liền trên) ngay trước vị trí i. */
function withLeadingComment(src, i) {
  let j = src.lastIndexOf('\n', i - 1);
  const before = src.slice(0, j + 1).replace(/\s+$/, '');
  if (before.endsWith('*/')) {
    const start = before.lastIndexOf('/*');
    return src.lastIndexOf('\n', start) + 1;
  }
  return j + 1;
}

function extractEngine(script, file) {
  let eng;
  const a = script.indexOf('@@ENGINE-START'), b = script.indexOf('@@ENGINE-END');
  if (a >= 0 && b > a) {
    eng = script.slice(script.indexOf('\n', a) + 1, script.lastIndexOf('\n', b));
  } else {
    const c0 = script.search(/const\s+COLORS\s*=/);
    if (c0 < 0) fail(`${file}: không thấy "const COLORS = {...}".`);
    const start = withLeadingComment(script, c0);
    // Phần giao diện của Gemini bắt đầu từ chỗ đọc phần tử trang (document.getElementById...) đầu tiên.
    const dom = script.search(/\n[ \t]*(const|let|var)\s+\w+\s*=\s*document\./);
    if (dom < 0) fail(`${file}: không tìm được chỗ kết thúc phần vẽ (trước các dòng document.getElementById).`);
    let end = script.lastIndexOf('/* ===', dom);
    if (end < start) end = dom;
    eng = script.slice(start, end);
  }
  // Bỏ trạng thái giao diện (appState) của Gemini, thay bằng cờ hiển thị do trang điều khiển.
  const m = eng.match(/(?:const|let|var)\s+appState\s*=\s*\{/);
  if (m) {
    const s = eng.indexOf(m[0]);
    const e = matchBrace(eng, s + m[0].length - 1);
    const from = withLeadingComment(eng, s);
    eng = eng.slice(0, from) + eng.slice(eng.indexOf('\n', e) + 1);
  }
  const used = new Set([...eng.matchAll(/appState\.(\w+)/g)].map((x) => x[1]));
  const allowed = new Set(['showAI', 'showArrows', 'showXray']);
  const bad = [...used].filter((k) => !allowed.has(k));
  if (bad.length) fail(`${file}: phần vẽ dùng appState.${bad.join(', appState.')} — chỉ được dùng showAI, showArrows, showXray.`);
  if (/\bdocument\.|\bwindow\./.test(eng)) fail(`${file}: phần vẽ còn đụng tới document/window.`);
  for (const need of [/const\s+POSES\s*=/, /function\s+samplePoseAtTime\s*\(/]) {
    if (!need.test(eng)) fail(`${file}: thiếu ${need.source.replace(/\\s[+*]/g, ' ').replace(/\\/g, '')}.`);
  }
  // Sửa phối cảnh: Gemini lấy mặt sàn làm tâm chiếu nên tay đưa về phía người xem (vd. nhịp xoay người)
  // bị vẽ như đang giơ lên cao. Lấy tâm chiếu ngang ngực (đường chân trời ~ 175 đơn vị): chân vẫn chạm sàn,
  // tay dang ngang về phía người xem vẫn nằm ngang vai.
  const proj = /(\b\w+)\.floorY\s*-\s*p\.y\s*\*\s*s\b/g;
  const nProj = (eng.match(proj) || []).length;
  if (nProj === 1) eng = eng.replace(proj, '$1.floorY - (HORIZON_Y + (p.y - HORIZON_Y) * s)');
  else console.warn(`⚠️  ${file}: không tìm thấy đúng một chỗ "floorY - p.y * s" để sửa phối cảnh (thấy ${nProj}) — giữ nguyên.`);
  const build = eng.match(/function\s+(build\w*SvgInner)\s*\(/)?.[1];
  if (!build) fail(`${file}: thiếu hàm build...SvgInner(pose, prefix).`);
  // Bỏ thụt lề chung
  const lines = eng.split('\n');
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  eng = lines.map((l) => l.slice(Math.min(ind, l.match(/^ */)[0].length))).join('\n').trim();
  return { eng, build };
}

// Tệp chỉnh tay cho khớp SGK (không bắt buộc): tools/gemini-src/<mã-bài>.fix.json
//   { "both": { "4": { "kneeBend": 0.8, "uL": [...] } }, "front": {...}, "back": {...} }
const fixPath = `${root}tools/gemini-src/${id}.fix.json`;
const fix = existsSync(fixPath) ? JSON.parse(readFileSync(fixPath, 'utf8')) : null;
function fixesFor(view) {
  if (!fix) return '';
  const merged = {};
  for (const part of [fix.both || {}, fix[view] || {}]) {
    for (const [k, v] of Object.entries(part)) merged[k] = { ...(merged[k] || {}), ...v };
  }
  if (!Object.keys(merged).length) return '';
  return `\n// Chỉnh cho khớp hình SGK (tools/gemini-src/${id}.fix.json)\n${Object.entries(merged)
    .map(([k, v]) => `if (POSES[${Number(k)}]) Object.assign(POSES[${Number(k)}], ${JSON.stringify(v)});`).join('\n')}\n`;
}

function moduleFor(view, file) {
  const html = readFileSync(file, 'utf8');
  const { eng, build } = extractEngine(mainScript(html, file), file);
  const needEsc = /\bescapeXml\(/.test(eng) && !/function\s+escapeXml\s*\(/.test(eng);
  return `// TỰ SINH bởi tools/import-gemini-figure.mjs — đừng sửa tay, sửa tệp Gemini rồi chạy lại công cụ.
// Bài: ${id} — ${ex.title}
// Góc nhìn: ${view === 'front' ? 'PHÍA TRƯỚC (như hình trong sách)' : 'PHÍA SAU (em đứng sau bạn mẫu, tập cùng chiều)'}
// Nguồn: hình người vector 2.5D thầy cô dựng bằng Gemini (${file.split('/').pop().replace(/^[0-9a-f]{8}-/, '')}).
/* eslint-disable */
const appState = { showAI: true, showArrows: true, showXray: true };
const HORIZON_Y = 175; // tâm phối cảnh ngang ngực (đơn vị hình, tính từ mặt sàn)
${needEsc ? "const escapeXml = (s) => String(s).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]));\n" : ''}
${eng}
${fixesFor(view)}
export const view = '${view}';
export const poses = POSES;
export const sample = (t) => samplePoseAtTime(t);
/** Nội dung bên trong <svg viewBox="0 0 360 390"> của tư thế đã nội suy. */
export function render(pose, opts = {}, prefix = '${view[0]}_') {
  if ('ai' in opts) appState.showAI = !!opts.ai;
  if ('arrows' in opts) { appState.showArrows = !!opts.arrows; appState.showXray = !!opts.arrows; }
  return ${build}(pose, prefix);
}
`;
}

mkdirSync(`${root}js/figures`, { recursive: true });
const out = {};
for (const [view, file] of [['front', frontFile], ['back', backFile]].filter(([, f]) => f)) {
  const path = `${root}js/figures/${id}.${view}.js`;
  writeFileSync(path, moduleFor(view, file));
  out[view] = path;
}

// Chạy thử: vẽ dày đặc theo thời gian, không được lỗi hay NaN; hai góc nhìn phải cùng số tư thế.
const B = await import(pathToFileURL(out.back).href);
const F = out.front ? await import(pathToFileURL(out.front).href) : null;
if (F && F.poses.length !== B.poses.length) fail(`Mặt trước có ${F.poses.length} tư thế, mặt sau có ${B.poses.length} — phải bằng nhau.`);
const N = B.poses.length;
for (const M of [B, F].filter(Boolean)) {
  for (let t = 0; t < N; t += 0.05) {
    const p = M.sample(t);
    if (!p || typeof p.nearestIdx !== 'number') fail(`${M.view}: samplePoseAtTime(${t.toFixed(2)}) phải trả về tư thế có nearestIdx.`);
    const svg = M.render(p, { ai: true, arrows: true });
    if (typeof svg !== 'string' || svg.length < 500) fail(`${M.view}: hình vẽ rỗng tại t=${t.toFixed(2)}.`);
    if (/NaN|undefined/.test(svg)) fail(`${M.view}: hình vẽ có NaN/undefined tại t=${t.toFixed(2)}.`);
  }
}
const steps = ex.scoring?.steps?.length;
if (ex.scoring?.mode === 'sequence' && steps !== N) fail(`Bài có ${steps} nhịp (trùng với ảnh SGK) nhưng hình phía sau có ${N} tư thế — phải bằng nhau để chạy cùng nhịp.`);

if (!ex.vectorFigure) {
  // Chèn đúng một dòng ngay sau "id" của bài, giữ nguyên cách trình bày phần còn lại của tệp.
  const raw = readFileSync(`${root}data/exercises.json`, 'utf8');
  const re = new RegExp(`(\\n([ \\t]*)"id": "${id}",\\n)`);
  if (!re.test(raw)) fail(`Không chèn được "vectorFigure" vào data/exercises.json — thêm tay dòng "vectorFigure": true, cho bài ${id}.`);
  writeFileSync(`${root}data/exercises.json`, raw.replace(re, (m, all, ind) => `${all}${ind}"vectorFigure": true,\n`));
}
console.log(`✅ ${id}: ${N} tư thế → js/figures/${id}.back.js${F ? ` (và ${id}.front.js để tham khảo)` : ''}`);
if (!existsSync(`${root}js/figure-anim.js`)) console.warn('⚠️  Chưa có js/figure-anim.js (trình phát).');
