// Kiểm tra data/exercises.json trước khi deploy. Sai → workflow dừng, trang cũ vẫn chạy bình thường.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url).pathname;
const errors = [];
const warns = [];
let data;
try {
  data = JSON.parse(readFileSync(`${root}data/exercises.json`, 'utf8'));
} catch (e) {
  console.error(`❌ data/exercises.json sai cú pháp JSON: ${e.message}`);
  console.error('   Gợi ý: kiểm tra dấu phẩy thừa/thiếu, dấu ngoặc kép " ", ngoặc { } [ ].');
  process.exit(1);
}
const media = existsSync(`${root}data/media.json`) ? JSON.parse(readFileSync(`${root}data/media.json`, 'utf8')) : {};
const chapters = new Set((data.curriculum || []).flatMap((g) => g.parts.flatMap((p) => p.chapters.map((c) => c.id))));
const ids = new Set();
const JOINTS = new Set([0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);
const checkTriplet = (where, j) => {
  if (!Array.isArray(j) || j.length !== 3 || !j.every((x) => JOINTS.has(x))) errors.push(`${where}: "joints" phải là 3 số khớp MediaPipe hợp lệ, đang là ${JSON.stringify(j)}`);
};
for (const [i, e] of (data.exercises || []).entries()) {
  const at = `Bài #${i + 1} (${e.id || 'chưa có id'})`;
  if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) errors.push(`${at}: "id" chỉ gồm chữ thường không dấu, số và dấu gạch ngang.`);
  if (ids.has(e.id)) errors.push(`${at}: "id" bị trùng.`);
  ids.add(e.id);
  if (![6, 7, 8, 9].includes(e.grade)) errors.push(`${at}: "grade" phải là 6, 7, 8 hoặc 9.`);
  if (!e.title) errors.push(`${at}: thiếu "title".`);
  if (!Array.isArray(e.steps) || !e.steps.length) errors.push(`${at}: "steps" phải là danh sách các bước.`);
  if (e.chapter && !chapters.has(e.chapter)) warns.push(`${at}: chapter "${e.chapter}" không có trong curriculum.`);
  for (const v of e.youtube || []) {
    if (!v || !/^[A-Za-z0-9_-]{11}$/.test(v.id || '')) errors.push(`${at}: mã video YouTube "${v?.id}" phải đúng 11 ký tự (phần sau youtu.be/ hoặc watch?v=).`);
  }
  for (const p of e.book?.pages || []) {
    if (p.image && !/^https?:/.test(p.image) && !existsSync(`${root}${decodeURIComponent(p.image)}`)) errors.push(`${at}: không thấy ảnh "${p.image}".`);
  }
  if (e.book?.image && !/^https?:/.test(e.book.image) && !existsSync(`${root}${e.book.image}`)) errors.push(`${at}: không thấy ảnh "${e.book.image}".`);
  if (e.bookAnim) {
    const pages = new Set((e.book?.pages || []).map((p) => p.page));
    const fr = e.bookAnim.frames || [];
    if (!fr.length) errors.push(`${at}: bookAnim cần ít nhất một khung.`);
    const okBox = (b) => Array.isArray(b) && b.length === 4 && b.every((v) => v >= 0 && v <= 1) && b[0] + b[2] <= 1.0001 && b[1] + b[3] <= 1.0001;
    fr.forEach((f, k) => {
      if (!pages.has(f.page)) errors.push(`${at} bookAnim khung ${k + 1}: trang ${f.page} không có trong book.pages.`);
      if (!okBox(f.box) || (f.cap && !okBox(f.cap))) errors.push(`${at} bookAnim khung ${k + 1}: box/cap phải là [x, y, rộng, cao] trong khoảng 0–1.`);
      if (!f.label) errors.push(`${at} bookAnim khung ${k + 1}: thiếu "label".`);
    });
  }
  const s = e.scoring;
  if (s) {
    if (!['hold', 'reps', 'sequence'].includes(s.mode)) errors.push(`${at}: scoring.mode phải là "hold", "reps" hoặc "sequence".`);
    const checkRule = (w, r) => {
      if (r.kind) {
        if (!['dy', 'dx', 'torso', 'tilt'].includes(r.kind)) errors.push(`${w}: kind "${r.kind}" không hợp lệ.`);
        if (r.min == null && r.max == null) errors.push(`${w}: cần "min" hoặc "max".`);
        if (['dy', 'dx'].includes(r.kind) && (r.a == null || r.b == null)) errors.push(`${w}: cần điểm "a" và "b".`);
        return;
      }
      if (r.oneOf) r.oneOf.forEach((j) => checkTriplet(w, j)); else checkTriplet(w, r.joints);
      if (typeof r.target !== 'number') errors.push(`${w}: thiếu "target" (góc mục tiêu, độ).`);
    };
    for (const [k, r] of (s.rules || []).entries()) checkRule(`${at} rule ${k + 1}`, r);
    if (s.mode === 'sequence') {
      const nf = e.bookAnim?.frames?.length || 0;
      if (!s.steps?.length) errors.push(`${at}: mode "sequence" cần danh sách "steps".`);
      for (const [k, st] of (s.steps || []).entries()) {
        if (!(st.frame >= 0 && st.frame < nf)) errors.push(`${at} nhịp ${k + 1}: "frame" phải trỏ tới một khung trong bookAnim.`);
        if (!st.rules?.length) errors.push(`${at} nhịp ${k + 1}: cần ít nhất một rule.`);
        (st.rules || []).forEach((r, i) => checkRule(`${at} nhịp ${k + 1} rule ${i + 1}`, r));
      }
    }
    if (s.mode === 'reps') {
      const r = s.reps;
      if (!r) errors.push(`${at}: mode "reps" cần khối "reps".`);
      else {
        if (r.oneOf) r.oneOf.forEach((j) => checkTriplet(`${at} reps`, j)); else checkTriplet(`${at} reps`, r.joints);
        if (!(r.down < r.up)) errors.push(`${at}: reps.down phải nhỏ hơn reps.up.`);
      }
    }
  }
}
// Bạn mẫu vector (mục 2. Video): hai tệp hình phải có, cùng số tư thế, vẽ được mà không ra NaN.
for (const e of (data.exercises || []).filter((x) => x.vectorFigure)) {
  const at = `Bài ${e.id} (vectorFigure)`;
  // Trang chỉ dùng góc nhìn phía sau (bên phải là ảnh gốc SGK); tệp phía trước nếu có thì kiểm tra thêm.
  const files = ['back', 'front'].map((v) => `${root}js/figures/${e.id}.${v}.js`).filter((f, i) => i === 0 || existsSync(f));
  if (!existsSync(files[0])) { errors.push(`${at}: thiếu js/figures/${e.id}.back.js — chạy tools/import-gemini-figure.mjs.`); continue; }
  try {
    const mods = await Promise.all(files.map((f) => import(pathToFileURL(f).href)));
    const B = mods[0];
    const steps = e.scoring?.mode === 'sequence' ? e.scoring.steps.length : 0;
    if (steps && B.poses.length !== steps) errors.push(`${at}: hình phía sau có ${B.poses.length} tư thế, bài có ${steps} nhịp chấm — phải bằng nhau để chạy cùng nhịp với ảnh SGK.`);
    for (const M of mods) {
      for (let t = 0; t < M.poses.length; t += 0.25) {
        const svg = M.render(M.sample(t), { ai: true, arrows: true });
        if (/NaN|undefined/.test(svg)) { errors.push(`${at}: hình ${M.view} có NaN/undefined tại t=${t}.`); break; }
      }
    }
  } catch (err) { errors.push(`${at}: lỗi khi vẽ thử — ${err.message}`); }
}
for (const id of Object.keys(media)) if (!ids.has(id)) warns.push(`Thư mục media/sach/${id}/ không khớp mã bài nào.`);
for (const id of (data.exercises || []).flatMap((e) => e.related || [])) if (!ids.has(id)) warns.push(`related: không có bài "${id}".`);
warns.forEach((w) => console.warn(`⚠️  ${w}`));
if (errors.length) { errors.forEach((e) => console.error(`❌ ${e}`)); process.exit(1); }
console.log(`✅ exercises.json hợp lệ: ${ids.size} bài.`);
