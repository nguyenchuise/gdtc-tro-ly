// Kiểm tra data/exercises.json trước khi deploy. Sai → workflow dừng, trang cũ vẫn chạy bình thường.
import { readFileSync, existsSync } from 'node:fs';

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
  const s = e.scoring;
  if (s) {
    if (!['hold', 'reps'].includes(s.mode)) errors.push(`${at}: scoring.mode phải là "hold" hoặc "reps".`);
    for (const [k, r] of (s.rules || []).entries()) {
      const w = `${at} rule ${k + 1}`;
      if (r.oneOf) r.oneOf.forEach((j) => checkTriplet(w, j)); else checkTriplet(w, r.joints);
      if (typeof r.target !== 'number') errors.push(`${w}: thiếu "target" (góc mục tiêu, độ).`);
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
for (const id of Object.keys(media)) if (!ids.has(id)) warns.push(`Thư mục media/sach/${id}/ không khớp mã bài nào.`);
for (const id of (data.exercises || []).flatMap((e) => e.related || [])) if (!ids.has(id)) warns.push(`related: không có bài "${id}".`);
warns.forEach((w) => console.warn(`⚠️  ${w}`));
if (errors.length) { errors.forEach((e) => console.error(`❌ ${e}`)); process.exit(1); }
console.log(`✅ exercises.json hợp lệ: ${ids.size} bài.`);
