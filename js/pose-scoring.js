// Chấm điểm tư thế — hàm thuần (test được bằng Node) + bộ nạp MediaPipe chạy trên máy học sinh.
// Không gửi hình ảnh đi đâu: mọi xử lý diễn ra trong trình duyệt.

export const MIN_VISIBILITY = 0.5;
export const PASS_SCORE = 80;

/**
 * Nới chấm điểm cho học sinh tự tập (dễ đạt, tạo hứng thú): mỗi góc được lệch thêm `tolerance` độ mà vẫn 100%,
 * và điểm giảm chậm hơn (`range`). Làm gần đúng tư thế → khoảng 80–100%.
 */
export const EASE = { tolerance: 10, range: 20, repDown: 6, repUp: 4 };

export function easeRule(r) {
  return { ...r, tolerance: (r.tolerance ?? 10) + EASE.tolerance, range: (r.range ?? 40) + EASE.range };
}

/** Đếm số lần: nới ngưỡng xuống/lên một chút (giữ khoảng cách ≥ 10° để không đếm nhầm do rung). */
export function easeReps(rep) {
  const e = easeRule(rep);
  const down = rep.down + EASE.repDown, up = rep.up - EASE.repUp;
  if (up - down >= 10) { e.down = down; e.up = up; }
  return e;
}

export const JOINT_NAMES = {
  0: 'mũi', 11: 'vai trái', 12: 'vai phải', 13: 'khuỷu tay trái', 14: 'khuỷu tay phải',
  15: 'cổ tay trái', 16: 'cổ tay phải', 23: 'hông trái', 24: 'hông phải',
  25: 'gối trái', 26: 'gối phải', 27: 'cổ chân trái', 28: 'cổ chân phải',
};

// Các đoạn nối để vẽ khung xương.
export const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30],
];

/** Góc (độ, 0–180) tại điểm b, tính trên toạ độ điểm ảnh để không méo theo tỉ lệ khung hình. */
export function angleAt(a, b, c, w = 1, h = 1) {
  const v1x = (a.x - b.x) * w, v1y = (a.y - b.y) * h;
  const v2x = (c.x - b.x) * w, v2y = (c.y - b.y) * h;
  const n = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (!n) return NaN;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / n));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Lệch trong `tolerance` = 100%, giảm tuyến tính về 0% khi lệch thêm `range` độ. */
export function ruleScore(measured, target, tolerance = 10, range = 40) {
  const dev = Math.abs(measured - target);
  if (dev <= tolerance) return 100;
  return Math.max(0, 100 * (1 - (dev - tolerance) / Math.max(1, range)));
}

const visible = (lm, idx) => lm[idx] && (lm[idx].visibility ?? 1) >= MIN_VISIBILITY;

/**
 * Đo một bộ khớp (joints) hoặc nhiều lựa chọn (oneOf).
 * pick: 'closest' (gần target nhất, mặc định) | 'min' | 'max'.
 * Trả về { angle, joints } hoặc { angle: null, missing: [chỉ số khớp không thấy] }.
 */
export function measure(lm, spec, w, h) {
  const options = spec.oneOf || [spec.joints];
  const pick = spec.pick || 'closest';
  let best = null;
  const missing = new Set();
  for (const j of options) {
    const miss = j.filter((i) => !visible(lm, i));
    if (miss.length) { miss.forEach((i) => missing.add(i)); continue; }
    const angle = angleAt(lm[j[0]], lm[j[1]], lm[j[2]], w, h);
    if (Number.isNaN(angle)) continue;
    const better = !best
      || (pick === 'min' && angle < best.angle)
      || (pick === 'max' && angle > best.angle)
      || (pick === 'closest' && Math.abs(angle - spec.target) < Math.abs(best.angle - spec.target));
    if (better) best = { angle, joints: j };
  }
  return best || { angle: null, missing: [...missing] };
}

// ---------------------------------------------------------------------------
// Rule theo vị trí (không phải góc) — dùng cho bài chấm trọn bộ nhiều nhịp.
// Đơn vị độ dài: S = bề rộng vai trên hình (ổn định khi đứng quay mặt vào máy).
//   kind 'dy'   : độ cao của điểm a so với điểm b = (b.y − a.y) / S  (dương: a cao hơn b). a có thể là danh sách,
//                 pick 'all' (mọi điểm phải đạt, mặc định) | 'any' (một điểm đạt là được).
//   kind 'dx'   : khoảng cách ngang |a.x − b.x| / S (vd hai cổ chân → chân rộng/hẹp, hai cổ tay → tay chéo/dang).
//   kind 'torso': chiều cao thân (vai → hông) / S; thân gập về phía máy thì số này nhỏ đi.
//   kind 'tilt' : độ nghiêng thân sang bên (độ).
// Mỗi rule có min và/hoặc max; nằm trong khoảng = 100%, ra ngoài giảm dần về 0% sau `range`.
// Điểm b có thể là 'sh' | 'hip' | 'knee' | 'nose' (trung điểm hai vai / hông / gối, hoặc mũi).
const MID = { sh: [11, 12], hip: [23, 24], knee: [25, 26], nose: [0] };
const refIdx = (r) => (typeof r === 'string' ? MID[r] : [r]);
function pt(lm, r, w, h) {
  const ids = refIdx(r);
  return { x: (ids.reduce((s, i) => s + lm[i].x, 0) / ids.length) * w, y: (ids.reduce((s, i) => s + lm[i].y, 0) / ids.length) * h };
}
export function rangeScore(v, min, max, range = 0.5) {
  const d = min != null && v < min ? min - v : max != null && v > max ? v - max : 0;
  return d <= 0 ? 100 : Math.max(0, 100 * (1 - d / range));
}
const RANGE = { dy: 0.5, dx: 0.5, torso: 0.4, tilt: 12 };

/** Đo một rule vị trí. Trả về { value, score, joints } hoặc { value: null, missing }. */
export function measureKind(lm, r, w, h) {
  const as = Array.isArray(r.a) ? r.a : r.a != null ? [r.a] : [];
  const seen = (ref) => refIdx(ref).every((k) => visible(lm, k));
  const need = [11, 12, 23, 24, ...(r.b != null ? refIdx(r.b) : []), ...(r.pick === 'any' ? [] : as.flatMap(refIdx))];
  const miss = new Set(need.filter((i) => !visible(lm, i)));
  if (r.pick === 'any' && as.length && !as.some(seen)) as.flatMap(refIdx).forEach((i) => miss.add(i));
  if (miss.size) return { value: null, missing: [...miss] };
  const P = (i) => pt(lm, i, w, h);
  const sh = P('sh'), hip = P('hip');
  const torsoLen = Math.hypot(sh.x - hip.x, sh.y - hip.y);
  const S = Math.max(Math.hypot(P(11).x - P(12).x, P(11).y - P(12).y), 0.45 * torsoLen, 1e-6);
  const range = r.range ?? RANGE[r.kind] ?? 0.5;
  const score = (v) => rangeScore(v, r.min, r.max, range);
  if (r.kind === 'torso') { const v = (hip.y - sh.y) / S; return { value: v, score: score(v), joints: [11] }; }
  if (r.kind === 'tilt') {
    const v = (Math.atan2(Math.abs(sh.x - hip.x), Math.max(1e-6, hip.y - sh.y)) * 180) / Math.PI;
    return { value: v, score: score(v), joints: [11] };
  }
  if (r.kind === 'dx') { const A = P(as[0]), B = P(r.b); const v = Math.abs(A.x - B.x) / S; return { value: v, score: score(v), joints: [as[0]] }; }
  if (r.kind === 'dy') {
    const B = P(r.b);
    const items = as.filter(seen).map((a) => { const v = (B.y - P(a).y) / S; return { a, v, s: score(v) }; });
    const pick = items.sort((x, y) => x.s - y.s)[r.pick === 'any' ? items.length - 1 : 0];
    return { value: pick.v, score: pick.s, joints: [pick.a] };
  }
  return { value: null, missing: [] };
}

/** Chấm một khung hình theo danh sách rule. score = null nếu còn khớp chưa thấy rõ (không chấm bừa). */
export function evaluateRules(lm, rules, w, h) {
  const results = rules.map((r) => {
    if (r.kind) {
      const m = measureKind(lm, r, w, h);
      if (m.value == null) return { rule: r, angle: null, score: null, missing: m.missing };
      return { rule: r, angle: m.value, joints: [null, m.joints[0]], score: m.score };
    }
    const m = measure(lm, r, w, h);
    if (m.angle == null) return { rule: r, angle: null, score: null, missing: m.missing };
    return { rule: r, angle: m.angle, joints: m.joints, score: ruleScore(m.angle, r.target, r.tolerance, r.range) };
  });
  const unseen = results.filter((x) => x.score == null);
  const score = !results.length || unseen.length ? null : results.reduce((s, x) => s + x.score, 0) / results.length;
  return { score, results, unseen };
}

/** Câu gợi ý cho rule tệ nhất. */
export function adviceFor(evaluation) {
  if (evaluation.unseen.length) {
    const names = [...new Set(evaluation.unseen.flatMap((u) => u.missing || []))]
      .map((i) => JOINT_NAMES[i]).filter(Boolean).slice(0, 3);
    return `Chưa thấy rõ ${names.join(', ') || 'cơ thể'}. Lùi ra xa hoặc chỉnh máy để thấy cả người, đủ ánh sáng.`;
  }
  const worst = [...evaluation.results].sort((a, b) => a.score - b.score)[0];
  if (!worst) return '';
  if (worst.score >= PASS_SCORE) return 'Tốt lắm! Giữ nguyên tư thế.';
  if (worst.rule.hint) return worst.rule.hint;
  if (worst.rule.kind) return `${worst.rule.label}: chưa đúng, em xem lại hình mẫu.`;
  const diff = Math.round(worst.angle - worst.rule.target);
  const verb = diff > 0 ? 'gập/khép lại thêm' : 'mở/duỗi ra thêm';
  return `${worst.rule.label}: đang ${Math.round(worst.angle)}°, cần khoảng ${worst.rule.target}° — ${verb} ${Math.abs(diff)}°.`;
}

/** Đếm thời gian giữ tư thế (điểm ≥ PASS_SCORE liên tục). */
export class HoldTimer {
  constructor(holdSeconds = 2) { this.holdSeconds = holdSeconds; this.reset(); }
  reset() { this.start = null; this.last = null; this.current = 0; this.best = 0; this.done = false; }
  update(score, tSec) {
    // Thời gian lùi lại (video tua/lặp lại) hoặc ngắt quãng > 0.5 s → tính lại từ đầu.
    if (this.last != null && (tSec < this.last || tSec - this.last > 0.5)) this.start = null;
    this.last = tSec;
    if (score != null && score >= PASS_SCORE) {
      if (this.start == null) this.start = tSec;
      this.current = tSec - this.start;
    } else {
      this.start = null; this.current = 0;
    }
    this.best = Math.max(this.best, this.current);
    if (this.current >= this.holdSeconds) this.done = true;
    return this;
  }
}

/** Đếm số lần: góc xuống dưới `down` rồi lên trên `up` = 1 lần. Chất lượng mỗi lần = độ sâu so với depthTarget. */
export class RepCounter {
  constructor(spec) { this.spec = spec; this.reset(); }
  reset() { this.state = 'up'; this.count = 0; this.minAngle = Infinity; this.lastQuality = null; this.qualities = []; this.done = false; }
  update(angle) {
    const s = this.spec;
    if (angle == null) return this;
    if (this.state === 'up' && angle < s.down) { this.state = 'down'; this.minAngle = angle; }
    if (this.state === 'down') {
      this.minAngle = Math.min(this.minAngle, angle);
      if (angle > s.up) {
        this.state = 'up';
        this.count += 1;
        this.lastQuality = s.depthTarget != null
          ? (this.minAngle <= s.depthTarget ? 100 : ruleScore(this.minAngle, s.depthTarget, s.tolerance, s.range))
          : 100;
        this.qualities.push(this.lastQuality);
        if (s.target && this.count >= s.target) this.done = true;
      }
    }
    return this;
  }
  get bestQuality() { return this.qualities.length ? Math.max(...this.qualities) : null; }
}

// ---------------------------------------------------------------------------
// Bộ nạp MediaPipe PoseLandmarker (tự host trong thư mục mp/). Chỉ nạp khi học sinh mở tab "Tự tập".
let landmarkerPromise = null;

export function loadPoseLandmarker(onStatus = () => {}) {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    onStatus('Đang tải bộ chấm điểm (khoảng 15 MB, chỉ lần đầu)…');
    const { FilesetResolver, PoseLandmarker } = await import('../mp/vision_bundle.mjs');
    const base = new URL('../mp/', import.meta.url).href;
    const fileset = await FilesetResolver.forVisionTasks(base + 'wasm');
    const make = (delegate) => PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: base + 'pose_landmarker_lite.task', delegate },
      runningMode: 'VIDEO', numPoses: 1,
      minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    let lm;
    try { lm = await make('GPU'); } catch { lm = await make('CPU'); }
    onStatus('');
    return lm;
  })();
  landmarkerPromise.catch(() => { landmarkerPromise = null; });
  return landmarkerPromise;
}
