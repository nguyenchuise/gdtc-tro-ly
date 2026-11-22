// Hình nộm "tư thế mẫu" vẽ tự động từ chính các góc dùng để chấm điểm (scoring.rules / scoring.reps).
// Nhờ vậy hình mẫu luôn khớp với cách máy chấm, không cần vẽ tay từng bài.
// - Bài giữ tư thế: hình đi từ tư thế đứng sang tư thế mẫu rồi giữ yên (như ảnh GIF).
// - Bài đếm lần: hình lặp lại động tác lên – xuống.
// Góc vẽ là góc mục tiêu nên hình có thể hơi "cứng", mục đích là cho em thấy bộ phận nào cần đúng góc bao nhiêu.

const NS = 'http://www.w3.org/2000/svg';
const L = { torso: 50, neck: 7, head: 9, upper: 27, fore: 25, thigh: 38, shin: 37, shoulderW: 15, hipW: 9 };
const rad = (d) => (d * Math.PI) / 180;

/** Loại khớp theo bộ 3 điểm MediaPipe → { kind, side } (side 0 = trái / chân trước, 1 = phải / chân sau). */
function classify(t) {
  const k = t.join(',');
  const map = {
    '23,11,13': ['sh', 0], '24,12,14': ['sh', 1], '11,13,15': ['el', 0], '12,14,16': ['el', 1],
    '23,25,27': ['kn', 0], '24,26,28': ['kn', 1], '11,23,25': ['hp', 0], '12,24,26': ['hp', 1],
    '27,23,28': ['spread', 0], '28,24,27': ['spread', 0],
  };
  const m = map[k];
  return m ? { kind: m[0], side: m[1] } : null;
}

const neutral = (view) => ({
  t: 0,
  arms: [{ s: 8, e: 172, back: false }, { s: 8, e: 172, back: false }],
  legs: [{ a: view === 'front' ? 5 : 0, k: 178, set: false }, { a: view === 'front' ? 5 : 0, k: 178, set: false }],
  spread: null,
});
const clone = (p) => JSON.parse(JSON.stringify(p));

/**
 * Dựng tham số tư thế từ danh sách rule.
 * values: Map rule → góc muốn vẽ (để bài đếm lần thay góc theo khung hình).
 * Trả về { pose, marks: [{rule, joint}] } — joint là chỉ số điểm để đánh dấu số thứ tự.
 */
function buildPose(view, items, hint) {
  const p = neutral(view);
  if (hint) p.hint = hint;
  const marks = [];
  // Gom theo loại để biết rule nào là "cặp" (một bên co, một bên duỗi).
  const kinds = {};
  for (const it of items) {
    const tri = it.rule.joints || it.rule.oneOf?.[0];
    const c = tri && classify(tri);
    if (!c) continue;
    it.c = c;
    if (it.rule.oneOf) (kinds[c.kind] ||= []).push(it);
  }
  const sidesFor = (it) => {
    if (it.rule.joints) return [it.c.side];
    const same = kinds[it.c.kind] || [];
    if (same.length > 1) return [it.rule.pick === 'max' ? 1 : 0];
    if (it.c.kind === 'hp') return [0];
    return [0, 1];
  };
  const torsoLabel = (r) => /thân|lưng|gập|ngả|đổ/i.test(r.label) && !/đùi|chân/i.test(r.label);
  // 1) Thân trước, 2) chân, 3) tay — vì góc hông phụ thuộc độ ngả thân.
  const order = { hp: 0, kn: 1, spread: 1, sh: 2, el: 3 };
  items.filter((it) => it.c).sort((a, b) => order[a.c.kind] - order[b.c.kind]).forEach((it) => {
    const { kind } = it.c;
    const v = it.value;
    const sides = sidesFor(it);
    sides.forEach((s) => {
      if (kind === 'hp') {
        if (torsoLabel(it.rule)) p.torsoHip = { v, side: s };
        else { p.legs[s].hip = v; p.legs[s].set = true; }
      } else if (kind === 'kn') { p.legs[s].k = Math.min(180, v); p.legs[s].set = true; }
      else if (kind === 'spread') p.spread = v;
      else if (kind === 'sh') { p.arms[s].s = v; p.arms[s].back = /sau/i.test(it.rule.label); p.arms[s].set = true; }
      else if (kind === 'el') p.arms[s].e = Math.min(180, v);
    });
    const tri = it.rule.joints || it.rule.oneOf[sides[0]] || it.rule.oneOf[0];
    marks.push({ rule: it.rule, joint: kind === 'spread' ? 23 : tri[1], side: sides[0], kind });
  });
  // Tay chưa có rule vai nhưng có khuỷu co → đưa cánh tay ra trước một chút cho dễ nhìn.
  p.arms.forEach((a) => { if (!a.set && a.e < 140) a.s = view === 'side' ? 35 : 20; });
  return { pose: p, marks };
}

/** Tính toạ độ các điểm (đơn vị tuỳ ý, y hướng lên) cho tư thế. */
function solve(view, p) {
  const pts = {};
  const dir = (phi) => [Math.sin(rad(phi)), -Math.cos(rad(phi))]; // phi: lệch so với hướng thẳng xuống, + là ra trước / ra ngoài
  const add = (a, d, len) => [a[0] + d[0] * len, a[1] + d[1] * len];
  const legLen = L.thigh + L.shin;

  if (view === 'side') {
    const [F, B] = p.legs;
    // Ngả thân
    let t = 0;
    const bothBent = F.k < 165 && B.k < 165 && Math.abs(F.k - B.k) < 15 && F.hip == null && B.hip == null;
    if (bothBent) { // ngồi xổm / khuỵu gối: đùi ra trước, cẳng chân ra sau, thân hơi ngả
      F.a = B.a = (180 - F.k) * 0.5;
      t = (180 - F.k) * 0.35;
    } else {
      if (F.hip == null && F.k < 165 && B.k >= F.k) F.a = 180 - F.k; // bước khuỵu: cẳng chân trước thẳng đứng
      if (B.hip == null && B.k < 165 && F.k > B.k) B.a = (180 - B.k) * 0.5;
    }
    if (p.torsoHip) {
      const leg = p.legs[p.torsoHip.side];
      if (leg.hip == null && !leg.set && !bothBent) { F.a = 8; B.a = -12; }
      t = 180 - p.torsoHip.v - (p.legs[p.torsoHip.side].a || 0);
    }
    for (const leg of [F, B]) if (leg.hip != null) leg.a = 180 - leg.hip - t;
    // Gợi ý vẽ riêng cho tư thế khó suy ra từ góc (vd. xuất phát thấp): sc.figure = { t, legA: [trước, sau], armPhi }
    if (p.hint) {
      if (p.hint.t != null) t = p.hint.t;
      if (p.hint.legA) { F.a = p.hint.legA[0]; B.a = p.hint.legA[1]; }
    }
    // Chân sau đứng đất: cân chiều cao với chân trước nếu chân trước cũng chạm đất.
    const height = (leg) => L.thigh * Math.cos(rad(leg.a)) + L.shin * Math.cos(rad(leg.a - (180 - leg.k)));
    if (F.hip == null && F.a > 4 && F.a < 70 && !bothBent && B.hip == null && B.k > 160) B.a = -Math.acos(Math.min(1, height(F) / legLen)) * 180 / Math.PI;
    if (F.a >= 70 && B.hip == null && B.k > 160) B.a = 0; // chân trước nâng cao → chân sau là chân trụ
    p.t = t;
    const hip = [0, 0];
    pts[23] = hip; pts[24] = hip;
    const legPts = (leg, ki, ai) => {
      pts[ki] = add(hip, dir(leg.a), L.thigh);
      pts[ai] = add(pts[ki], dir(leg.a - (180 - leg.k)), L.shin);
    };
    legPts(F, 25, 27); legPts(B, 26, 28);
    const up = [Math.sin(rad(t)), Math.cos(rad(t))];
    const sh = add(hip, up, L.torso);
    pts[11] = sh; pts[12] = sh;
    pts[0] = add(sh, up, L.neck + L.head);
    const armPts = (arm, ei, wi) => {
      const phi = p.hint?.armPhi != null ? p.hint.armPhi : -t + (arm.back ? -arm.s : arm.s);
      pts[ei] = add(sh, dir(phi), L.upper);
      pts[wi] = add(pts[ei], dir(phi + (arm.back ? -1 : 1) * (180 - arm.e)), L.fore);
    };
    armPts(p.arms[0], 13, 15); armPts(p.arms[1], 14, 16);
  } else {
    // Nhìn thẳng: trái của người (chỉ số lẻ) vẽ bên trái màn hình như khi soi gương.
    const lean = p.torsoHip ? Math.max(0, 180 - p.torsoHip.v) : 0;
    const torsoLen = L.torso * Math.cos(rad(Math.min(lean, 75)));
    const hipC = [0, 0];
    pts[23] = [-L.hipW, 0]; pts[24] = [L.hipW, 0];
    p.legs.forEach((leg, i) => {
      const sgn = i === 0 ? -1 : 1;
      const o = p.spread != null ? p.spread / 2 : leg.a;
      const bend = (180 - leg.k) * 0.45;
      const hp = pts[i === 0 ? 23 : 24];
      const knee = add(hp, [sgn * Math.sin(rad(o + bend)), -Math.cos(rad(o + bend))], L.thigh * (0.65 + 0.35 * leg.k / 180));
      pts[i === 0 ? 25 : 26] = knee;
      pts[i === 0 ? 27 : 28] = add(knee, [sgn * Math.sin(rad(o - bend)), -Math.cos(rad(o - bend))], L.shin);
    });
    const shC = [0, torsoLen];
    pts[11] = [-L.shoulderW, torsoLen]; pts[12] = [L.shoulderW, torsoLen];
    pts[0] = [0, torsoLen + L.neck + L.head];
    p.arms.forEach((arm, i) => {
      const sgn = i === 0 ? -1 : 1;
      const s = pts[i === 0 ? 11 : 12];
      const d1 = [sgn * Math.sin(rad(arm.s)), -Math.cos(rad(arm.s))];
      const el = add(s, d1, L.upper);
      const f = arm.s >= 60 ? arm.s + (180 - arm.e) : arm.s - (180 - arm.e); // tay cao: gập lên; tay thấp: gập vào trong
      pts[i === 0 ? 13 : 14] = el;
      pts[i === 0 ? 15 : 16] = add(el, [sgn * Math.sin(rad(f)), -Math.cos(rad(f))], L.fore);
    });
    void hipC; void shC;
  }
  return pts;
}

const lerp = (a, b, f) => a + (b - a) * f;
function lerpPts(A, B, f) {
  const o = {};
  for (const k of Object.keys(B)) o[k] = [lerp(A[k][0], B[k][0], f), lerp(A[k][1], B[k][1], f)];
  return o;
}

/** Khung chung đủ chứa mọi tư thế (để hình không bị nhảy khi chuyển động). */
function frameOf(list) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const pts of list) for (const [x, y] of Object.values(pts)) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const pad = 14;
  return { x0: x0 - pad, x1: x1 + pad, y0: y0 - pad, y1: y1 + pad + L.head };
}

/** Chuẩn bị dữ liệu hình nộm cho một bài. */
export function figureModel(sc) {
  const view = sc.camera === 'front' ? 'front' : 'side';
  const rules = sc.rules || [];
  const base = rules.map((rule) => ({ rule, value: rule.target }));
  if (sc.mode === 'reps' && sc.reps) {
    const r = sc.reps;
    const isSpread = classify(r.joints || r.oneOf[0])?.kind === 'spread';
    const lo = isSpread ? 6 : Math.max(20, Math.min(r.depthTarget ?? r.down - 15, r.down - 10));
    const hi = isSpread ? Math.max(r.up + 10, 30) : Math.min(178, r.up + 8);
    const repRule = { ...r, target: r.depthTarget ?? r.down };
    const a = buildPose(view, [...base, { rule: repRule, value: isSpread ? hi : lo }]);
    const b = buildPose(view, [...base, { rule: repRule, value: isSpread ? lo : hi }]);
    // Bài đếm lần chân trước nâng đùi: gối tự gập cho tự nhiên.
    [a, b].forEach((x) => x.pose.legs.forEach((leg) => { if (leg.hip != null && leg.hip < 150 && leg.k > 170) leg.k = 95; }));
    const A = solve(view, a.pose), B = solve(view, b.pose);
    return { view, mode: 'reps', frames: [B, A], frame: frameOf([A, B]), marks: a.marks, repLabel: r.label };
  }
  const n = buildPose(view, []);
  const t = buildPose(view, base, sc.figure);
  const N = solve(view, n.pose), T = solve(view, t.pose);
  return { view, mode: 'hold', frames: [N, T], frame: frameOf([N, T]), marks: t.marks };
}

const BONES = [[11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]];

/** Tạo một SVG hình nộm; trả về { el, draw(pts) }. */
export function createFigure(model, { numbers = true } = {}) {
  const { frame } = model;
  const W = frame.x1 - frame.x0, H = frame.y1 - frame.y0;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
  svg.setAttribute('class', 'figure-svg');
  svg.setAttribute('aria-hidden', 'true');
  const X = (p) => (p[0] - frame.x0).toFixed(1);
  const Y = (p) => (frame.y1 - p[1]).toFixed(1);
  const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.append(e); return e; };
  mk('line', { x1: 0, x2: W, y1: H - 6, y2: H - 6, class: 'fig-ground' });
  // Phía xa (chân sau / tay xa) vẽ nhạt hơn khi nhìn nghiêng.
  const far = model.view === 'side' ? new Set(['12,14', '14,16', '24,26', '26,28']) : new Set();
  const bones = BONES.map(([a, b]) => ({ a, b, el: mk('line', { class: far.has(`${a},${b}`) ? 'fig-bone fig-bone--far' : 'fig-bone' }) }));
  const torso = mk('line', { class: 'fig-bone fig-torso' });
  const shoulders = model.view === 'front' ? mk('line', { class: 'fig-bone' }) : null;
  const hips = model.view === 'front' ? mk('line', { class: 'fig-bone' }) : null;
  const head = mk('circle', { r: L.head, class: 'fig-head' });
  const marks = model.marks.map((m, i) => ({
    ...m,
    dot: mk('circle', { r: 4.2, class: 'fig-mark' }),
    num: numbers ? mk('text', { class: 'fig-num' }) : null,
    i,
  }));
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  function draw(pts) {
    for (const b of bones) {
      b.el.setAttribute('x1', X(pts[b.a])); b.el.setAttribute('y1', Y(pts[b.a]));
      b.el.setAttribute('x2', X(pts[b.b])); b.el.setAttribute('y2', Y(pts[b.b]));
    }
    const sh = mid(pts[11], pts[12]), hp = mid(pts[23], pts[24]);
    torso.setAttribute('x1', X(sh)); torso.setAttribute('y1', Y(sh)); torso.setAttribute('x2', X(hp)); torso.setAttribute('y2', Y(hp));
    if (shoulders) { shoulders.setAttribute('x1', X(pts[11])); shoulders.setAttribute('y1', Y(pts[11])); shoulders.setAttribute('x2', X(pts[12])); shoulders.setAttribute('y2', Y(pts[12])); }
    if (hips) { hips.setAttribute('x1', X(pts[23])); hips.setAttribute('y1', Y(pts[23])); hips.setAttribute('x2', X(pts[24])); hips.setAttribute('y2', Y(pts[24])); }
    head.setAttribute('cx', X(pts[0])); head.setAttribute('cy', Y(pts[0]));
    for (const m of marks) {
      const p = pts[m.joint];
      m.dot.setAttribute('cx', X(p)); m.dot.setAttribute('cy', Y(p));
      if (m.num) {
        m.num.setAttribute('x', (Number(X(p)) + 6).toFixed(1));
        m.num.setAttribute('y', (Number(Y(p)) - 5).toFixed(1));
        m.num.textContent = String(m.i + 1);
      }
    }
  }
  draw(model.frames[model.frames.length - 1]);
  return { el: svg, draw };
}

/** Chạy hoạt hình cho nhiều hình nộm cùng lúc. Trả về hàm dừng. */
export function animateFigures(model, figs) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [A, B] = model.frames;
  if (reduce) { figs.forEach((f) => f.draw(B)); return () => {}; }
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
  // hold: đứng 0.5s → chuyển 1s → giữ 2.2s → về 0.6s.  reps: xuống 0.7s, lên 0.7s.
  const seq = model.mode === 'reps'
    ? [[0.25, 0, 0], [0.7, 0, 1], [0.25, 1, 1], [0.7, 1, 0]]
    : [[0.5, 0, 0], [1, 0, 1], [2.2, 1, 1], [0.6, 1, 0]];
  const total = seq.reduce((s, x) => s + x[0], 0);
  let raf = 0;
  const t0 = performance.now();
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    let t = ((now - t0) / 1000) % total;
    let f = 0;
    for (const [d, from, to] of seq) { if (t <= d) { f = lerp(from, to, ease(t / d)); break; } t -= d; }
    const pts = lerpPts(A, B, f);
    for (const fig of figs) if (fig.el.isConnected && fig.el.getClientRects().length) fig.draw(pts);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Danh sách chú thích "① Gối khuỵu ~140°" cho hình nộm. */
export function figureLegend(model, sc) {
  const items = model.marks.map((m, i) => {
    const r = m.rule;
    const val = model.mode === 'reps' && sc.reps && r.label === sc.reps.label
      ? `&lt;${sc.reps.down}° → &gt;${sc.reps.up}°`
      : `~${Math.round(r.target)}°`;
    return `<li><span class="fig-legend__n">${i + 1}</span><span>${r.label.replace(/[<>&]/g, '')}</span><b>${val}</b></li>`;
  });
  return `<ol class="fig-legend">${items.join('')}</ol>`;
}
