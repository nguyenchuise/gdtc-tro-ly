// Khung đầu mục 2. Video, hai cột chạy CÙNG NHỊP để đối chiếu ngay:
//   Trái  ① Bạn mẫu tập cùng em: góc nhìn PHÍA SAU dựng nhân tạo, có điểm khớp AI chấm.
//          - Bài có "vectorFigure": hình người vector js/figures/<mã-bài>.back.js (từ tệp Gemini, ghép bằng
//            tools/import-gemini-figure.mjs).
//          - Bài khác có chấm điểm: hình nộm đi lần lượt theo TỪNG HÌNH SGK (data/sgk-poses.json: khớp nhận diện
//            bằng MediaPipe trên chính các khung ảnh sách), cùng nhịp với ảnh sách bên phải; hình đúng tư thế máy chấm
//            có dấu ★. Bài chưa có dữ liệu đó: hình nộm vẽ từ góc chấm (js/pose-figure.js).
//   Phải ② Động tác trong sách: ẢNH GỐC SGK chạy động (js/book-anim.js), giữ nguyên hình trong sách.
import { esc } from './util.js';
import { hasBookAnim, createBookAnim, preloadBookAnim } from './book-anim.js';
import { voiceButton, voiceNoticeHTML, createBeatVoice } from './video-voice.js';

const SPEEDS = [{ label: 'Chậm', k: 0.6 }, { label: 'Vừa', k: 1 }, { label: 'Nhanh', k: 1.5 }];
const BEAT = 1.05; // giây chuyển giữa hai nhịp ở tốc độ Vừa
const HOLD = 0.8; // giây dừng ở đúng tư thế mỗi nhịp
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Điện thoại: cắt bớt lề trống hai bên khung hình (360 → 250 đơn vị) để bạn mẫu to hơn ~1,4 lần.
const phoneMQ = window.matchMedia?.('(max-width: 759px)');
const VB_FULL = '0 0 360 390', VB_PHONE = '48 0 264 390';
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export const hasVectorFigure = (ex) => Boolean(ex?.vectorFigure);
/** Bài có "bạn mẫu" ở mục Video: hình vector (Gemini) hoặc tạm thời hình nộm vẽ từ góc chấm điểm. */
export const hasFigure = (ex) => Boolean(ex?.figure3d || ex?.vectorFigure || ex?.scoring?.rules?.length || ex?.scoring?.reps || ex?.scoring?.steps?.length);

const shortOf = (p, k) => (/^TTCB/i.test(p.code || '') ? 'TTCB' : (String(p.code || '').match(/\d+/)?.[0] || String(k)));

// Bài có bước chân sang một bên (nhịp 8 lớp 6: "chân trái bước sang ngang"): động cơ vector dang đều hai chân quanh
// tâm → trông như đứng rộng chân tại chỗ. Giữ CHÂN TRỤ đứng yên (dịch cả người theo chân bước) và vẽ trục giữa +
// dấu chân ở chỗ đứng ban đầu để thấy rõ chân nào bước. Góc nhìn phía sau: chân trái ở bên trái màn hình.
const STEP_SIDE = { 'g6-dang-tay': 'L' };
const FOOT0 = 11.5, FOOT_PER_STANCE = 19.5, CX = 180, FLOOR = 356; // theo khung xương của tệp vector lớp 6
function stepFrame(svg, stance, side) {
  if (!side) return svg;
  const d = FOOT_PER_STANCE * stance;                 // mỗi chân ra thêm d → chân bước ra 2d, chân trụ đứng yên
  const dx = side === 'L' ? -d : d;
  const guide = `<g aria-hidden="true">
    <line x1="${CX}" y1="${FLOOR + 6}" x2="${CX}" y2="70" stroke="#94A3B8" stroke-width="1.6" stroke-dasharray="5 5" opacity=".75"/>
    <text x="${CX + 4}" y="66" font-size="10" font-weight="700" fill="#64748B">trục giữa</text>
    <ellipse cx="${CX - FOOT0}" cy="${FLOOR + 3}" rx="8" ry="3.2" fill="#CBD5E1" opacity=".9"/>
    <ellipse cx="${CX + FOOT0}" cy="${FLOOR + 3}" rx="8" ry="3.2" fill="#CBD5E1" opacity=".9"/>
  </g>`;
  return `${guide}<g transform="translate(${dx.toFixed(2)} 0)">${svg}</g>`;
}

// ------------------------------------------------------------------ Nguồn 1: hình vector từ tệp Gemini
async function vectorSource(ex) {
  const B = await import(`./figures/${ex.id}.back.js`);
  const vb = (phone) => (phone ? VB_PHONE : VB_FULL);
  return {
    kind: 'vector',
    N: B.poses.length,
    poses: B.poses.map((p, k) => ({
      code: p.code || `Nhịp ${k}`, group: p.group || '', short: shortOf(p, k),
      caption: p.caption?.replace(/^(TTCB|Nhịp\s*\d+)\.\s*/i, '') || p.shortTitle || '',
      tip: p.rearTip ? `Nhìn từ sau: ${p.rearTip}` : '',
    })),
    arrows: true,
    views: [
      { id: 'back', sub: 'Phía sau · làm theo cùng chiều', vb,
        render(t, o, uid) {
          const pb = B.sample(t);
          // Khung phụ "góc nghiêng" của Gemini (sát mép phải) quá nhỏ trên điện thoại → tắt, giữ hình chính ở giữa.
          if (o.phone && 'inset4Alpha' in pb) pb.inset4Alpha = 0;
          const svg = B.render(pb, o, `b${uid}_`);
          return stepFrame(svg, pb.stanceWidth || 0, STEP_SIDE[ex.id]);
        } },
    ],
    note: 'Bên trái là bạn mẫu dựng nhân tạo nhìn <b>từ phía sau</b> (tay trái ở bên trái màn hình, em làm y hệt). Bên phải là <b>ảnh gốc trong SGK</b>, chạy cùng nhịp để đối chiếu. Chấm cam là <b>điểm khớp máy chấm</b>.',
  };
}

// ------------------------------------------------------------------ Nguồn 2: hình nộm cũ (tạm, khi chưa có tệp Gemini)
// Vẽ từ chính các góc chấm điểm (js/pose-figure.js). Bài quay trước: phía sau + phía trước; bài quay nghiêng: một hình.
const JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const SH_TRI = new Set(['23,11,13', '24,12,14']);
const triOf = (r) => (r.joints || r.oneOf?.[0] || []).join(',');

/** Bài chấm trọn bộ có cả rule vị trí (dx/dy): đổi các rule dễ hiểu sang góc để hình nộm vẽ gần đúng. */
function synthRules(rules) {
  const out = rules.filter((r) => !r.kind && (r.joints || r.oneOf));
  const hasSh = out.some((r) => SH_TRI.has(triOf(r)));
  const hasSpread = out.some((r) => /^2[78],2[34],2[78]$/.test(triOf(r)));
  const arr = (v) => [].concat(v ?? []);
  for (const r of rules) {
    if (!r.kind) continue;
    const a = arr(r.a), b = arr(r.b);
    if (r.kind === 'dx' && !hasSpread && [...a, ...b].every((j) => j === 27 || j === 28) && r.min > 0.6) {
      out.push({ label: r.label, joints: [27, 23, 28], target: r.min >= 1.4 ? 40 : 26 });
    } else if (r.kind === 'dx' && !hasSh && [...a, ...b].every((j) => j === 15 || j === 16) && r.min > 2) {
      out.push({ label: r.label, oneOf: [[23, 11, 13], [24, 12, 14]], target: 90 });
    } else if (r.kind === 'dy' && !hasSh && a.every((j) => j === 15 || j === 16) && r.min > 0) {
      out.push({ label: r.label, oneOf: [[23, 11, 13], [24, 12, 14]], target: b.includes('nose') ? 165 : 120 });
    }
  }
  return out;
}

function boundsOf(list) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, foot = Infinity;
  for (const pts of list) {
    for (const [x, y] of Object.values(pts)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    foot = Math.min(foot, pts[27][1], pts[28][1]);
  }
  // Khung đối xứng quanh tâm hông để hình không lệch khi lật trái ↔ phải.
  const half = Math.max(Math.abs(x0), Math.abs(x1)) + 16;
  return { x0: -half, x1: half, y0: y0 - 12, y1: y1 + 22, foot };
}

const lerpPts = (A, B, f) => {
  const o = {};
  for (const k of Object.keys(B)) o[k] = [A[k][0] + (B[k][0] - A[k][0]) * f, A[k][1] + (B[k][1] - A[k][1]) * f];
  return o;
};

/** SVG hình nộm. view: 'back' (trái người = trái màn hình) | 'front' (lật gương) | 'side'. */
function stickSvg(pts, box, view, ai) {
  const W = box.x1 - box.x0, H = box.y1 - box.y0;
  const X = view === 'front' ? (p) => (box.x1 - p[0]).toFixed(1) : (p) => (p[0] - box.x0).toFixed(1);
  const Y = (p) => (box.y1 - p[1]).toFixed(1);
  const line = (a, b, cls = 'fig-bone') => `<line class="${cls}" x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}"/>`;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const far = view === 'side' ? 'fig-bone fig-bone--far' : 'fig-bone';
  let g = `<line class="fig-ground" x1="0" x2="${W.toFixed(1)}" y1="${(box.y1 - box.foot + 4).toFixed(1)}" y2="${(box.y1 - box.foot + 4).toFixed(1)}"/>`;
  // Phía xa vẽ trước
  g += line(pts[24], pts[26], far) + line(pts[26], pts[28], far) + line(pts[12], pts[14], far) + line(pts[14], pts[16], far);
  g += line(mid(pts[11], pts[12]), mid(pts[23], pts[24]), 'fig-bone fig-torso');
  if (view !== 'side') g += line(pts[11], pts[12]) + line(pts[23], pts[24]);
  g += line(pts[23], pts[25]) + line(pts[25], pts[27]) + line(pts[11], pts[13]) + line(pts[13], pts[15]);
  const h = pts[0], hx = X(h), hy = Y(h);
  if (view === 'front') {
    g += `<circle cx="${hx}" cy="${hy}" r="9.5" fill="#FBD7B9" stroke="#1f3a2e" stroke-width="2.4"/>`
      + `<circle cx="${(+hx - 3.2).toFixed(1)}" cy="${(+hy - 0.5).toFixed(1)}" r="1.3" fill="#1f3a2e"/><circle cx="${(+hx + 3.2).toFixed(1)}" cy="${(+hy - 0.5).toFixed(1)}" r="1.3" fill="#1f3a2e"/>`
      + `<path d="M ${(+hx - 3).toFixed(1)} ${(+hy + 3.4).toFixed(1)} Q ${hx} ${(+hy + 5.6).toFixed(1)} ${(+hx + 3).toFixed(1)} ${(+hy + 3.4).toFixed(1)}" fill="none" stroke="#9A3412" stroke-width="1.3" stroke-linecap="round"/>`;
  } else if (view === 'back') {
    g += `<circle cx="${hx}" cy="${hy}" r="9.5" fill="#2B303A" stroke="#1f3a2e" stroke-width="2"/>`;
  } else g += `<circle class="fig-head" cx="${hx}" cy="${hy}" r="9"/>`;
  if (ai) g += JOINTS.map((j) => `<circle cx="${X(pts[j])}" cy="${Y(pts[j])}" r="3.8" fill="#F97316" stroke="#fff" stroke-width="1.6"/>`).join('');
  return { vb: `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`, svg: g };
}

async function stickSource(ex) {
  const { figureModel } = await import('./pose-figure.js');
  const sc = ex.scoring;
  let frames, poses, beat = BEAT, holds;
  if (sc.mode === 'sequence') {
    const fr = ex.bookAnim?.frames || [];
    frames = sc.steps.map((st) => figureModel({ camera: 'front', mode: 'hold', rules: synthRules(st.rules) }).frames[1]);
    poses = sc.steps.map((st, k) => {
      const f = fr[st.frame] || {};
      const code = f.label || `Nhịp ${k + 1}`;
      return { code, group: f.group || '', short: shortOf({ code }, k + 1), caption: st.say || '' };
    });
  } else {
    const m = figureModel(sc);
    frames = m.frames;
    const deg = (r) => `${r.label} ~${Math.round(r.target)}°`;
    if (m.mode === 'reps') {
      const r = sc.reps;
      const cap = `Lặp lại: ${r.label} (${r.down}° ↔ ${r.up}°)`;
      poses = [{ code: 'Vị trí 1', short: '1', caption: cap }, { code: 'Vị trí 2', short: '2', caption: cap }];
      beat = 0.75; holds = [0.25, 0.25];
    } else {
      poses = [{ code: 'Chuẩn bị', short: 'Chuẩn bị', caption: 'Đứng tự nhiên, sẵn sàng.' },
        { code: 'Tư thế mẫu', short: 'Tư thế', caption: (sc.rules || []).map(deg).join(' · ') }];
      beat = 1; holds = [0.5, 2.2];
    }
  }
  const side = (sc.mode === 'sequence' ? 'front' : sc.camera) !== 'front';
  const box = boundsOf(frames);
  const N = frames.length;
  const at = (t) => {
    const w = ((t % N) + N) % N, i = Math.floor(w), f = ease(w - i);
    return lerpPts(frames[i], frames[(i + 1) % N], f);
  };
  const view = (id, sub) => ({
    id, sub,
    vb: () => stickSvg(frames[0], box, id, false).vb,
    render: (t, o) => stickSvg(at(t), box, id, o.ai).svg,
  });
  return {
    kind: 'stick',
    N, poses, beat, holdOf: holds ? (k) => holds[k] : null,
    arrows: false,
    views: [side ? view('side', 'Hình nộm tạm · nhìn nghiêng') : view('back', 'Hình nộm tạm · phía sau')],
    note: `Bên trái là <b>hình nộm tạm</b> vẽ từ các góc máy chấm${side ? ' (nhìn nghiêng, như máy chấm nhìn)' : ', nhìn từ phía sau: tay trái ở bên trái màn hình, em làm y hệt'}.
      Hình người dựng nhân tạo sẽ thay vào khi thầy cô có tệp. Bên phải là <b>ảnh gốc trong SGK</b> (nếu có), chạy cùng nhịp.`,
  };
}

// ------------------------------------------------------------------ Nguồn 3: hình nộm theo từng hình SGK
// data/sgk-poses.json do tools/sgk-poses/ sinh ra: mỗi khung bookAnim một tư thế (hoặc null nếu khung là sơ đồ,
// cảnh quá nhỏ…). Hình nộm chạy lần lượt qua đủ các hình trong sách, ảnh sách bên phải đổi cùng lúc.
let sgkPosesP = null;
export function loadSgkPoses() {
  sgkPosesP ||= fetch(new URL('../data/sgk-poses.json', import.meta.url), { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return sgkPosesP;
}

/** Chữ ngắn trên nút: "Hình 3 · 2/4" → "3.2", "Hình 5" → "5". */
const frameShort = (label, k) => {
  const m = String(label || '').match(/Hình\s*(\d+)(?:\s*·\s*(\d+)\/\d+)?/);
  return m ? (m[2] ? `${m[1]}.${m[2]}` : m[1]) : String(k + 1);
};

const SIDE_L = [[11, 13], [13, 15], [23, 25], [25, 27], [27, 31]];
const SIDE_R = [[12, 14], [14, 16], [24, 26], [26, 28], [28, 32]];
/** Vẽ một tư thế SGK. view: 'back' | 'side'. mir: lật trái ↔ phải (hình sách nhìn từ trước → nhìn từ sau). */
function sgkSvg(pts, box, st, ai) {
  const X = st.mir ? (p) => (-p[0] - box.x0).toFixed(1) : (p) => (p[0] - box.x0).toFixed(1);
  const Y = (p) => (box.y1 - p[1]).toFixed(1);
  const line = (a, b, cls) => `<line class="${cls}" x1="${X(pts[a])}" y1="${Y(pts[a])}" x2="${X(pts[b])}" y2="${Y(pts[b])}"/>`;
  const side = st.view === 'side';
  const farL = side && st.far === 'L';
  const near = farL ? SIDE_R : SIDE_L, far = farL ? SIDE_L : SIDE_R;
  let g = '';
  g += far.map(([a, b]) => line(a, b, side ? 'fig-bone fig-bone--far' : 'fig-bone')).join('');
  const mid = (a, b) => [(pts[a][0] + pts[b][0]) / 2, (pts[a][1] + pts[b][1]) / 2];
  const ms = mid(11, 12), mh = mid(23, 24);
  g += `<line class="fig-bone fig-torso" x1="${X(ms)}" y1="${Y(ms)}" x2="${X(mh)}" y2="${Y(mh)}"/>`;
  if (!side) g += line(11, 12, 'fig-bone') + line(23, 24, 'fig-bone');
  g += near.map(([a, b]) => line(a, b, 'fig-bone')).join('');
  // cổ: nối giữa vai tới đầu
  const h = pts.h;
  g += `<line class="fig-bone" x1="${X(ms)}" y1="${Y(ms)}" x2="${X([(ms[0] * 0.55 + h[0] * 0.45), (ms[1] * 0.55 + h[1] * 0.45)])}" y2="${Y([(ms[0] * 0.55 + h[0] * 0.45), (ms[1] * 0.55 + h[1] * 0.45)])}"/>`;
  g += side ? `<circle class="fig-head" cx="${X(h)}" cy="${Y(h)}" r="10"/>`
    : `<circle cx="${X(h)}" cy="${Y(h)}" r="10" fill="#2B303A" stroke="#1f3a2e" stroke-width="2"/>`;
  if (ai) g += JOINTS.map((j) => `<circle cx="${X(pts[j])}" cy="${Y(pts[j])}" r="3.8" fill="#F97316" stroke="#fff" stroke-width="1.6"/>`).join('');
  return g;
}

/** Điểm khớp dạng MediaPipe (y hướng xuống) để chấm thử tư thế SGK bằng đúng bộ chấm của bài. */
function asLandmarks(pts) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  for (const [k, p] of Object.entries(pts)) if (k !== 'h') lm[Number(k)] = { x: p[0], y: -p[1], visibility: 1 };
  return lm;
}

async function sgkSource(ex, D, order) {
  const { evaluateRules, measure } = await import('./pose-scoring.js');
  const frames = ex.bookAnim.frames;
  const unpack = (flat) => {
    const o = {};
    order.forEach((k, i) => { o[k] = [flat[2 * i], flat[2 * i + 1]]; });
    return o;
  };
  const raw = D.s.map((f) => (f ? unpack(f) : null));
  const N = frames.length;
  // Khung không có tư thế (sơ đồ, cảnh quá nhỏ): bạn mẫu giữ tư thế của hình gần nhất trước đó.
  const near = (k) => { for (let d = 0; d < N; d++) { const j = (k - d + N) % N; if (raw[j]) return j; } return -1; };
  const sc = ex.scoring;
  const deg = (v) => `${Math.round(v)}°`;
  const st = raw.map((p, k) => {
    const j = p ? k : near(k);
    const v = D.v[j];
    return { pts: raw[j], own: Boolean(p), view: v === 's' ? 'side' : 'back', mir: v === 'f', far: D.far[j] };
  });
  // Tư thế máy chấm: chấm thử từng hình sách bằng đúng bộ góc của bài.
  const marks = raw.map((p) => {
    if (!p) return null;
    const lm = asLandmarks(p);
    if (sc.mode === 'reps' && sc.reps) {
      const m = measure(lm, { ...sc.reps, target: sc.reps.down });
      if (m.angle == null) return null;
      if (m.angle <= sc.reps.down + 8) return { tag: 'Vị trí 1 máy đếm', text: `${sc.reps.label}: hình này ~${deg(m.angle)} (máy đếm khi < ${sc.reps.down}°)` };
      if (m.angle >= sc.reps.up - 8) return { tag: 'Vị trí 2 máy đếm', text: `${sc.reps.label}: hình này ~${deg(m.angle)} (máy đếm khi > ${sc.reps.up}°)` };
      return null;
    }
    const ev = evaluateRules(lm, sc.rules || []);
    if (ev.score == null || ev.score < 80) return null; // 80% = mức đạt của máy chấm
    return { tag: 'Tư thế máy chấm', text: ev.results.filter((r) => !r.rule.kind).map((r) => `${r.rule.label} ~${deg(r.angle)} (mẫu ${deg(r.rule.target)})`).join(' · ') };
  });
  const poses = frames.map((f, k) => {
    const cap = D.cap?.[k] || '';
    const tip = !st[k].own ? 'Hình này trong sách là sơ đồ hoặc cảnh tập đông người: bạn mẫu giữ tư thế của hình trước.'
      : marks[k] ? `★ ${marks[k].tag}: ${marks[k].text}` : '';
    return { code: f.label || `Hình ${k + 1}`, group: '', short: frameShort(f.label, k), caption: cap, tip, star: Boolean(marks[k]) };
  });
  // Khung chung cho mọi tư thế (đối xứng quanh tâm hông để lật trái ↔ phải không lệch).
  let half = 40, top = 120;
  for (const p of raw) if (p) for (const [x, y] of Object.values(p)) { half = Math.max(half, Math.abs(x)); top = Math.max(top, y); }
  const box = { x0: -half - 16, x1: half + 16, y1: top + 16, y0: -14 };
  const W = box.x1 - box.x0, H = box.y1 - box.y0;
  const ground = `<line class="fig-ground" x1="0" x2="${W.toFixed(1)}" y1="${(box.y1 + 4).toFixed(1)}" y2="${(box.y1 + 4).toFixed(1)}"/>`;
  const vbStr = `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`;
  const render = (t, o) => {
    const w = ((t % N) + N) % N, i = Math.floor(w), f = ease(w - i);
    const A = st[i], B = st[(i + 1) % N];
    if (f < 0.001) return ground + sgkSvg(A.pts, box, A, o.ai);
    if (A.mir === B.mir && A.view === B.view) return ground + sgkSvg(lerpPts(A.pts, B.pts, f), box, A, o.ai);
    // đổi hướng nhìn (trước ↔ nghiêng): mờ dần hình cũ, hiện dần hình mới
    return `${ground}<g opacity="${(1 - f).toFixed(2)}">${sgkSvg(A.pts, box, A, o.ai)}</g><g opacity="${f.toFixed(2)}">${sgkSvg(B.pts, box, B, o.ai)}</g>`;
  };
  const sub = (k) => (st[k].view === 'side' ? 'Theo hình SGK · nhìn nghiêng' : 'Theo hình SGK · phía sau');
  return {
    kind: 'stick',
    N, poses, beat: 0.85, holdOf: () => 1.1,
    arrows: false, bookSync: (k) => k, subOf: sub,
    views: [{ id: 'back', sub: sub(0), vb: () => vbStr, render }],
    note: `Bên trái là <b>hình nộm</b> dựng từ chính từng hình trong SGK (máy nhận diện khớp trên ảnh sách), chạy lần lượt
      đủ các hình, cùng lúc với <b>ảnh gốc SGK</b> bên phải. Hình nhìn từ trước được lật thành nhìn từ phía sau: tay trái ở
      bên trái màn hình, em làm y hệt. Nút có dấu <b class="vfig__star">★</b> là hình đúng tư thế máy chấm ở mục 4. Tự tập.`,
  };
}

/** Bài không chấm bằng camera nhưng sách có hình: cột trái "sắp có", cột phải ảnh gốc SGK tự chạy. */
function bookOnly(ex, num) {
  const el = document.createElement('section');
  el.className = 'vsec vfig vfig--free';
  el.setAttribute('aria-label', 'Bạn mẫu tập cùng em và động tác trong sách');
  const n = (k) => (num ? `<span class="vsec__n" aria-hidden="true">${num + k}</span>` : '');
  el.innerHTML = `<div class="vfig__stages">
      <figure class="vfig__pane vfig__pane--wait"><figcaption><h3 class="vfig__phead">${n(0)}Bạn mẫu tập cùng em</h3><span>Phía sau</span></figcaption>
        <p class="muted small vfig__bookwait">Bài này chưa có bạn mẫu chuyển động. Thầy cô sẽ bổ sung sau.</p></figure>
      <figure class="vfig__pane vfig__pane--book"><figcaption><h3 class="vfig__phead">${n(1)}Động tác trong sách</h3><span>Ảnh gốc SGK · hình động</span></figcaption>
        <div class="vfig__book" data-book><p class="muted small">Đang tải hình trong sách…</p></div></figure>
    </div>`;
  let book = null, alive = true;
  const slot = el.querySelector('[data-book]');
  preloadBookAnim(ex).then(() => {
    if (!alive) return;
    book = createBookAnim(ex, { mode: 'full' });
    slot.replaceChildren(book.el);
  }).catch(() => {
    slot.innerHTML = `<p class="muted small vfig__bookwait">Chưa tải được ảnh sách từ máy chủ NXB. Xem ở <a href="#bai/${encodeURIComponent(ex.id)}/sach">mục 1. Sách</a>.</p>`;
  });
  return { el, stop() { alive = false; book?.stop(); } };
}

/** Tạo trình phát; trả về { el, stop }. Tải hình vẽ của bài theo nhu cầu (chỉ khi mở tab Video). */
export async function createFigurePlayer(ex, { num = 0 } = {}) {
  if (ex.figure3d) { const { create3DPlayer } = await import('./figure3d-player.js'); return create3DPlayer(ex, { num }); }
  if (!hasFigure(ex)) return bookOnly(ex, num);
  let src;
  if (ex.vectorFigure) src = await vectorSource(ex);
  else {
    const doc = hasBookAnim(ex) ? await loadSgkPoses() : null;
    const D = doc?.lessons?.[ex.id];
    src = D && D.s.length === ex.bookAnim.frames.length && D.s.filter(Boolean).length >= 2 ? await sgkSource(ex, D, doc.order) : await stickSource(ex);
  }
  const N = src.N;
  const beatSec = src.beat || BEAT;
  const holdOf = src.holdOf || (() => HOLD);
  const uid = Math.random().toString(36).slice(2, 7);
  let t = 0, playing = !reduceMotion(), speed = 1, hold = holdOf(0), alive = true, visible = true;
  let ai = true, arrows = src.arrows, tween = null, raf = 0, last = 0, lastIdx = -1, dirty = true;
  // Giọng đọc tên nhịp: đang đọc thì giữ nguyên nhịp, đọc xong mới chạy tiếp.
  const voice = createBeatVoice(() => schedule());

  const el = document.createElement('section');
  el.className = `vsec vfig vfig--${src.kind}`;
  el.setAttribute('aria-label', 'Bạn mẫu tập cùng em và động tác trong sách');
  const n = (k) => (num ? `<span class="vsec__n" aria-hidden="true">${num + k}</span>` : '');
  el.innerHTML = `
    <div class="vfig__stages">${src.views.map((v) => `
      <figure class="vfig__pane vfig__pane--${v.id}">
        <figcaption><h3 class="vfig__phead">${n(0)}Bạn mẫu tập cùng em</h3><span data-sub>${esc(v.sub)}</span></figcaption>
        <svg viewBox="${VB_FULL}" role="img" data-view="${v.id}" aria-label="Bạn mẫu tập cùng em: ${esc(v.sub.toLowerCase())}"></svg>
      </figure>`).join('')}
      <figure class="vfig__pane vfig__pane--book">
        <figcaption><h3 class="vfig__phead">${n(1)}Động tác trong sách</h3><span>Ảnh gốc SGK · ${ex.scoring?.mode === 'sequence' || src.bookSync ? 'cùng nhịp' : 'hình động'}</span></figcaption>
        <div class="vfig__book" data-book>${hasBookAnim(ex) ? '<p class="muted small">Đang tải hình trong sách…</p>'
          : `<p class="muted small vfig__bookwait">Chưa có hình động ghép từ sách. Xem ảnh ở <a href="#bai/${encodeURIComponent(ex.id)}/sach">mục 1. Sách</a>.</p>`}</div>
      </figure>
    </div>
    <div class="vfig__steps" role="group" aria-label="Chọn nhịp">${src.poses.map((p, k) => {
      // Bài chia nhiều động tác (lớp 8, 9): đầu mỗi động tác có khoảng cách và tên nhóm khi rê/đọc.
      const gStart = p.group && p.group !== src.poses[k - 1]?.group;
      const name = `${p.group ? `${p.group} · ` : ''}${p.code}`;
      return `<button type="button" class="chip chip--sm${gStart && k ? ' is-gstart' : ''}${p.star ? ' is-star' : ''}" data-k="${k}" aria-pressed="false" aria-label="${esc(name)}${p.star ? ' (tư thế máy chấm)' : ''}" title="${esc(name)}">${p.star ? '<span class="vfig__chipstar" aria-hidden="true">★</span>' : ''}${esc(p.short)}</button>`;
    }).join('')}</div>
    <p class="vfig__now" aria-live="polite"></p>
    <div class="vfig__ctrl">
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="prev" aria-label="Nhịp trước">‹</button>
      <button type="button" class="btn btn--primary btn--small vfig__play" data-a="play"></button>
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="next" aria-label="Nhịp sau">›</button>
      <button type="button" class="btn btn--ghost btn--small" data-a="speed" aria-label="Đổi tốc độ"></button>
      <button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="ai" aria-pressed="true"><span class="vfig__dot" aria-hidden="true"></span>Điểm khớp AI</button>
      ${src.arrows ? '<button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="arrows" aria-pressed="true">Mũi tên</button>' : ''}
      ${voiceButton()}
    </div>
    ${voiceNoticeHTML()}
    <p class="muted small vfig__note">${src.note}</p>`;
  const panes = src.views.map((v) => ({ v, svg: el.querySelector(`svg[data-view="${v.id}"]`) }));
  // Ảnh gốc SGK. Bài đếm nhịp: trình chiếu do bạn mẫu điều khiển, luôn hiện đúng nhịp đang tập.
  // Bài khác: các hình trong sách tự chạy lần lượt, có nút riêng (số hình trong sách khác số tư thế mẫu).
  let book = null;
  const seqSteps = ex.scoring?.mode === 'sequence' && ex.scoring.steps.length === N ? ex.scoring.steps : null;
  const steps = seqSteps || (src.bookSync ? true : null);
  const frameOf = (k) => (seqSteps ? seqSteps[k].frame : src.bookSync(k));
  if (hasBookAnim(ex)) {
    const slot = el.querySelector('[data-book]');
    preloadBookAnim(ex).then(() => {
      if (!alive) return;
      book = createBookAnim(ex, { mode: 'full', controlled: Boolean(steps) });
      slot.replaceChildren(book.el);
      if (steps) book.go(frameOf(((Math.round(t) % N) + N) % N));
      else el.classList.add('vfig--free');
    }).catch(() => {
      slot.innerHTML = `<p class="muted small vfig__bookwait">Chưa tải được ảnh sách từ máy chủ NXB. Xem ở <a href="#bai/${encodeURIComponent(ex.id)}/sach">mục 1. Sách</a>.</p>`;
    });
  }
  const now = el.querySelector('.vfig__now');
  voice.bind(el.querySelector('[data-a="voice"]'), el.querySelector('.vfig__voicewarn'));

  let phone = Boolean(phoneMQ?.matches);
  function fit() {
    phone = Boolean(phoneMQ?.matches);
    for (const { v, svg } of panes) svg.setAttribute('viewBox', v.vb(phone));
    dirty = true; lastIdx = -1;
  }
  const onMQ = () => { fit(); schedule(); };
  phoneMQ?.addEventListener?.('change', onMQ);

  function draw() {
    const opts = { ai, arrows, phone };
    for (const { v, svg } of panes) svg.innerHTML = v.render(t, opts, uid);
    const k = ((Math.round(t) % N) + N) % N;
    if (k !== lastIdx) {
      lastIdx = k;
      if (steps) book?.go(frameOf(k));
      const p = src.poses[k] || {};
      if (src.subOf) el.querySelector('[data-sub]').textContent = src.subOf(k);
      now.innerHTML = `${p.group ? `<span class="vfig__group">${esc(p.group)}</span>` : ''}<b>${esc(p.code || '')}</b> ${esc(p.caption || '')}
        ${p.tip ? `<span class="vfig__tip">${esc(p.tip)}</span>` : ''}`;
      el.querySelectorAll('[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === k)));
      const chip = el.querySelector(`[data-k="${k}"]`);
      const row = chip?.parentElement;
      if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2;
    }
    dirty = false;
  }

  /** Đọc nhịp khi hình đã tới ĐÚNG tư thế (không đọc giữa đường, để động tác chạy liền mạch). */
  function sayAt(x) {
    voice.speak(src.poses[((Math.round(x) % N) + N) % N] || {});
  }

  function ui() {
    const play = el.querySelector('[data-a="play"]');
    play.textContent = playing ? '❚❚ Dừng' : '▶ Chạy';
    play.setAttribute('aria-pressed', String(playing));
    el.querySelector('[data-a="speed"]').textContent = SPEEDS[speed].label;
    el.querySelector('[data-a="ai"]').setAttribute('aria-pressed', String(ai));
    el.querySelector('[data-a="arrows"]')?.setAttribute('aria-pressed', String(arrows));
  }

  function frame(ms) {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min(0.05, (ms - last) / 1000) : 0;
    last = ms;
    if (tween) {
      tween.p += dt / 0.55;
      if (tween.p >= 1) { t = tween.to; tween = null; sayAt(t); } else t = tween.from + (tween.to - tween.from) * ease(tween.p);
      dirty = true;
    } else if (playing) {
      const k = SPEEDS[speed].k;
      if (hold > 0) hold -= dt;
      // Đang đọc thì đứng yên — nhưng chỉ sau khi đã đi TRỌN nhịp, tức lúc này hình đang đúng tư thế.
      else if (!voice.holding) {
        const before = Math.floor(t + 1e-6);
        t += (dt * k) / beatSec;
        const after = Math.floor(t + 1e-6);
        if (after > before) { t = after % N; hold = holdOf(t) / Math.sqrt(k); sayAt(t); }
        dirty = true;
      }
    }
    if (dirty) draw();
    if (active()) raf = requestAnimationFrame(frame);
  }
  const active = () => alive && visible && !document.hidden && (playing || tween || dirty);
  /** Bắt đầu vòng vẽ nếu đang nghỉ. */
  function schedule() {
    if (active() && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  function goTo(k) {
    const target = ((k % N) + N) % N;
    let from = t;
    // Đi đường ngắn: từ nhịp cuối sang TTCB thì chạy tiếp về N rồi quấn lại.
    if (target === 0 && t > N / 2) from = t - N;
    tween = { from, to: target, p: 0 };
    playing = false; hold = 0;
    ui(); schedule();
  }

  el.addEventListener('click', (ev) => {
    const chip = ev.target.closest('[data-k]');
    if (chip) { goTo(Number(chip.dataset.k)); return; }
    const a = ev.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    const cur = Math.round(t) % N;
    if (a === 'prev') goTo(cur - 1);
    else if (a === 'next') goTo(cur + 1);
    else if (a === 'play') { playing = !playing; hold = playing ? 0.15 : hold; }
    else if (a === 'speed') speed = (speed + 1) % SPEEDS.length;
    else if (a === 'voice') {
      // Đọc ngay nhịp đang hiện (trong cú chạm — iPhone bắt buộc). Chạm lúc hình đang di chuyển thì
      // vẫn đọc nhưng không bắt đứng chờ, để động tác không khựng giữa đường.
      const atPose = !tween && Math.abs(t - Math.round(t)) < 0.02;
      voice.toggle(src.poses[((Math.round(t) % N) + N) % N], { hold: atPose });
      schedule(); return;
    }
    else if (a === 'ai') { ai = !ai; dirty = true; }
    else if (a === 'arrows') { arrows = !arrows; dirty = true; }
    ui(); schedule();
  });

  // Chỉ vẽ khi khung đang hiện trên màn hình (đỡ tốn pin điện thoại).
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting); schedule();
  }) : null;
  io?.observe(el);
  const onVis = () => schedule();
  document.addEventListener('visibilitychange', onVis);

  fit(); ui(); draw(); sayAt(t); schedule();
  return {
    el,
    stop() {
      alive = false; voice.stop(); if (raf) cancelAnimationFrame(raf); book?.stop();
      io?.disconnect(); document.removeEventListener('visibilitychange', onVis);
      phoneMQ?.removeEventListener?.('change', onMQ);
    },
  };
}
