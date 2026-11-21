// Chấm điểm tư thế — hàm thuần (test được bằng Node) + bộ nạp MediaPipe chạy trên máy học sinh.
// Không gửi hình ảnh đi đâu: mọi xử lý diễn ra trong trình duyệt.

export const MIN_VISIBILITY = 0.5;
export const PASS_SCORE = 80;

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

/** Chấm một khung hình theo danh sách rule. score = null nếu còn khớp chưa thấy rõ (không chấm bừa). */
export function evaluateRules(lm, rules, w, h) {
  const results = rules.map((r) => {
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
