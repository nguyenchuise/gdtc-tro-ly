// Kiểm tra nhanh logic chấm điểm và tìm kiếm: node tools/test-scoring.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { angleAt, ruleScore, evaluateRules, HoldTimer, RepCounter, measure, adviceFor, easeRule, easeReps } from '../js/pose-scoring.js';
import { normalize, parseQuery, search, buildIndex, leadingNumber } from '../js/search.js';

const P = (x, y, visibility = 0.99) => ({ x, y, visibility });
assert.equal(Math.round(angleAt(P(0, 1), P(0, 0), P(1, 0))), 90);
assert.equal(Math.round(angleAt(P(-1, 0), P(0, 0), P(1, 0))), 180);
// Tỉ lệ khung hình: 0.1 ngang × 640 = 0.1333 dọc × 480 → 45°
assert.equal(Math.round(angleAt(P(0.6, 0.5), P(0.5, 0.5), P(0.6, 0.5 - 0.1333), 640, 480)), 45);
assert.equal(ruleScore(95, 90, 10, 40), 100);
assert.equal(ruleScore(120, 90, 10, 40), 50);
assert.equal(ruleScore(200, 90, 10, 40), 0);

// Người dang tay: vai (11,12), khuỷu, cổ tay ngang; hông dưới vai.
const lm = Array.from({ length: 33 }, () => P(0.5, 0.5, 0.1));
Object.assign(lm, { 11: P(0.6, 0.3), 12: P(0.4, 0.3), 13: P(0.75, 0.3), 14: P(0.25, 0.3), 15: P(0.9, 0.3), 16: P(0.1, 0.3), 23: P(0.58, 0.6), 24: P(0.42, 0.6) });
const rules = [
  { label: 'Tay trái', joints: [23, 11, 13], target: 90, tolerance: 12, range: 40 },
  { label: 'Tay phải', joints: [24, 12, 14], target: 90, tolerance: 12, range: 40 },
  { label: 'Khuỷu trái', joints: [11, 13, 15], target: 180, tolerance: 15, range: 40 },
];
const ev = evaluateRules(lm, rules, 640, 480);
assert.ok(ev.score > 90, `score ${ev.score}`);
// Landmark mờ → không chấm
const blurry = lm.slice(); blurry[13] = P(0.75, 0.3, 0.2);
const ev2 = evaluateRules(blurry, rules, 640, 480);
assert.equal(ev2.score, null);
assert.match(adviceFor(ev2), /khuỷu tay trái/);
// oneOf chọn bên gần mục tiêu
const knees = Array.from({ length: 33 }, () => P(0.5, 0.5));
Object.assign(knees, { 23: P(0.4, 0.5), 25: P(0.4, 0.7), 27: P(0.4, 0.9), 24: P(0.6, 0.5), 26: P(0.7, 0.5), 28: P(0.7, 0.7) });
assert.equal(Math.round(measure(knees, { oneOf: [[23, 25, 27], [24, 26, 28]], target: 90 }, 1, 1).angle), 90);
assert.equal(Math.round(measure(knees, { oneOf: [[23, 25, 27], [24, 26, 28]], target: 180 }, 1, 1).angle), 180);

const t = new HoldTimer(2);
const run = (from, to, score) => { for (let x = from; x <= to + 1e-9; x += 0.1) t.update(score, Math.round(x * 10) / 10); };
run(0, 1, 85); assert.equal(t.done, false); run(1.1, 2.1, 85); assert.equal(t.done, true);
t.reset(); run(0, 1, 85); t.update(50, 1.1); assert.equal(t.current, 0);
// Video lặp lại (thời gian lùi về 0) → bắt đầu tính lại, không bị kẹt
t.reset(); run(4, 4.8, 85); run(0, 2.1, 85); assert.equal(t.done, true);
// Ngắt quãng > 0.5 s → không cộng dồn
t.reset(); run(0, 1, 85); t.update(85, 3); assert.equal(t.current, 0);

const rc = new RepCounter({ down: 100, up: 160, target: 2, depthTarget: 90, tolerance: 15, range: 40 });
[170, 120, 95, 85, 120, 165, 170, 98, 150, 165].forEach((a) => rc.update(a));
assert.equal(rc.count, 2); assert.equal(rc.done, true); assert.equal(rc.qualities[0], 100);

// Chấm dễ: lệch 25° so với góc mẫu (dung sai gốc 15) vẫn đạt ≥ 80%
{
  const r = easeRule({ target: 90, tolerance: 15, range: 40 });
  assert.equal(ruleScore(115, r.target, r.tolerance, r.range), 100);
  assert.ok(ruleScore(125, r.target, r.tolerance, r.range) >= 80);
  const e = easeReps({ down: 140, up: 165, tolerance: 15, range: 40 });
  assert.deepEqual([e.down, e.up], [146, 161]);
  const tight = easeReps({ down: 12, up: 22 });
  assert.deepEqual([tight.down, tight.up], [12, 22]); // quá sát → giữ nguyên ngưỡng
}

// Tìm kiếm
assert.equal(normalize('Đứng thẳng, Lớp 6!'), 'dung thang lop 6');
const q = parseQuery('Em muốn xem hướng dẫn bài tập squat lớp 8');
assert.deepEqual([q.grade, q.terms], [8, ['squat']]);
assert.equal(parseQuery('chủ đề 2 lop 6').chapterNo, 2);
const data = JSON.parse(readFileSync(new URL('../data/exercises.json', import.meta.url)));
const chapterNo = new Map(data.curriculum.flatMap((g) => g.parts.flatMap((p) => p.chapters.map((c) => [c.id, leadingNumber(c.title)]))));
const ex = data.exercises.map((e) => ({ ...e, _chapterNo: chapterNo.get(e.chapter), _chapterTitle: '', _partTitle: '' }));
buildIndex(ex);
assert.ok(search(ex, 'nhảy cao lớp 8').results.every((e) => e.grade === 8));
assert.ok(search(ex, 'nhảy cao').results.slice(0, 3).every((e) => ['g8-c2', 'g9-c2'].includes(e.chapter)));
assert.equal(search(ex, 'đập cầu').results[0].grade, 8);
assert.deepEqual(search(ex, 'hướng dẫn dang tay').results[0].id, 'g6-dang-tay');
// Lớp 6 theo SGK: Chủ đề 2 Ném bóng (3 bài) + Chủ đề 2 Bóng đá ở phần tự chọn (4 bài)
assert.equal(search(ex, 'chủ đề 2 lớp 6').results.length, 7);
assert.equal(search(ex, 'ném rổ').results[0].id, 'g6-nem-ro');
assert.ok(search(ex, 'dinh dưỡng').results.some((e) => e.id === 'g6-dinh-duong'));
assert.ok(search(ex, 'bong ro lop 8').results.every((e) => e.grade === 8));
console.log('✅ Tất cả kiểm tra chấm điểm và tìm kiếm đều đạt.');
