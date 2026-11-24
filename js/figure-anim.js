// Khung đầu mục 2. Video, hai cột chạy CÙNG NHỊP để đối chiếu ngay:
//   Trái  ① Bạn mẫu tập cùng em: góc nhìn PHÍA SAU dựng nhân tạo, có điểm khớp AI chấm.
//          - Bài có "vectorFigure": hình người vector js/figures/<mã-bài>.back.js (từ tệp Gemini, ghép bằng
//            tools/import-gemini-figure.mjs).
//          - Bài khác có chấm điểm: tạm dùng hình nộm vẽ từ góc chấm (js/pose-figure.js); bài quay nghiêng: nhìn nghiêng.
//   Phải ② Động tác trong sách: ẢNH GỐC SGK chạy động (js/book-anim.js), giữ nguyên hình trong sách.
import { esc } from './util.js';
import { hasBookAnim, createBookAnim, preloadBookAnim } from './book-anim.js';

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
export const hasFigure = (ex) => Boolean(ex?.vectorFigure || ex?.scoring?.rules?.length || ex?.scoring?.reps || ex?.scoring?.steps?.length);

const shortOf = (p, k) => (/^TTCB/i.test(p.code || '') ? 'TTCB' : (String(p.code || '').match(/\d+/)?.[0] || String(k)));

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
          return B.render(pb, o, `b${uid}_`);
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
  if (!hasFigure(ex)) return bookOnly(ex, num);
  const src = ex.vectorFigure ? await vectorSource(ex) : await stickSource(ex);
  const N = src.N;
  const beatSec = src.beat || BEAT;
  const holdOf = src.holdOf || (() => HOLD);
  const uid = Math.random().toString(36).slice(2, 7);
  let t = 0, playing = !reduceMotion(), speed = 1, hold = holdOf(0), alive = true, visible = true;
  let ai = true, arrows = src.arrows, tween = null, raf = 0, last = 0, lastIdx = -1, dirty = true;

  const el = document.createElement('section');
  el.className = `vsec vfig vfig--${src.kind}`;
  el.setAttribute('aria-label', 'Bạn mẫu tập cùng em và động tác trong sách');
  const n = (k) => (num ? `<span class="vsec__n" aria-hidden="true">${num + k}</span>` : '');
  el.innerHTML = `
    <div class="vfig__stages">${src.views.map((v) => `
      <figure class="vfig__pane vfig__pane--${v.id}">
        <figcaption><h3 class="vfig__phead">${n(0)}Bạn mẫu tập cùng em</h3><span>${esc(v.sub)}</span></figcaption>
        <svg viewBox="${VB_FULL}" role="img" data-view="${v.id}" aria-label="Bạn mẫu tập cùng em: ${esc(v.sub.toLowerCase())}"></svg>
      </figure>`).join('')}
      <figure class="vfig__pane vfig__pane--book">
        <figcaption><h3 class="vfig__phead">${n(1)}Động tác trong sách</h3><span>Ảnh gốc SGK · ${ex.scoring?.mode === 'sequence' ? 'cùng nhịp' : 'hình động'}</span></figcaption>
        <div class="vfig__book" data-book>${hasBookAnim(ex) ? '<p class="muted small">Đang tải hình trong sách…</p>'
          : `<p class="muted small vfig__bookwait">Chưa có hình động ghép từ sách. Xem ảnh ở <a href="#bai/${encodeURIComponent(ex.id)}/sach">mục 1. Sách</a>.</p>`}</div>
      </figure>
    </div>
    <div class="vfig__steps" role="group" aria-label="Chọn nhịp">${src.poses.map((p, k) => {
      // Bài chia nhiều động tác (lớp 8, 9): đầu mỗi động tác có khoảng cách và tên nhóm khi rê/đọc.
      const gStart = p.group && p.group !== src.poses[k - 1]?.group;
      const name = `${p.group ? `${p.group} · ` : ''}${p.code}`;
      return `<button type="button" class="chip chip--sm${gStart && k ? ' is-gstart' : ''}" data-k="${k}" aria-pressed="false" aria-label="${esc(name)}" title="${esc(name)}">${esc(p.short)}</button>`;
    }).join('')}</div>
    <p class="vfig__now" aria-live="polite"></p>
    <div class="vfig__ctrl">
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="prev" aria-label="Nhịp trước">‹</button>
      <button type="button" class="btn btn--primary btn--small vfig__play" data-a="play"></button>
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="next" aria-label="Nhịp sau">›</button>
      <button type="button" class="btn btn--ghost btn--small" data-a="speed" aria-label="Đổi tốc độ"></button>
      <button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="ai" aria-pressed="true"><span class="vfig__dot" aria-hidden="true"></span>Điểm khớp AI</button>
      ${src.arrows ? '<button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="arrows" aria-pressed="true">Mũi tên</button>' : ''}
    </div>
    <p class="muted small vfig__note">${src.note}</p>`;
  const panes = src.views.map((v) => ({ v, svg: el.querySelector(`svg[data-view="${v.id}"]`) }));
  // Ảnh gốc SGK. Bài đếm nhịp: trình chiếu do bạn mẫu điều khiển, luôn hiện đúng nhịp đang tập.
  // Bài khác: các hình trong sách tự chạy lần lượt, có nút riêng (số hình trong sách khác số tư thế mẫu).
  let book = null;
  const steps = ex.scoring?.mode === 'sequence' && ex.scoring.steps.length === N ? ex.scoring.steps : null;
  const frameOf = (k) => steps[k].frame;
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
      now.innerHTML = `${p.group ? `<span class="vfig__group">${esc(p.group)}</span>` : ''}<b>${esc(p.code || '')}</b> ${esc(p.caption || '')}
        ${p.tip ? `<span class="vfig__tip">${esc(p.tip)}</span>` : ''}`;
      el.querySelectorAll('[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === k)));
      const chip = el.querySelector(`[data-k="${k}"]`);
      const row = chip?.parentElement;
      if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2;
    }
    dirty = false;
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
      if (tween.p >= 1) { t = tween.to; tween = null; } else t = tween.from + (tween.to - tween.from) * ease(tween.p);
      dirty = true;
    } else if (playing) {
      const k = SPEEDS[speed].k;
      if (hold > 0) hold -= dt;
      else {
        const before = Math.floor(t + 1e-6);
        t += (dt * k) / beatSec;
        const after = Math.floor(t + 1e-6);
        if (after > before) { t = after % N; hold = holdOf(t) / Math.sqrt(k); }
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

  fit(); ui(); draw(); schedule();
  return {
    el,
    stop() {
      alive = false; if (raf) cancelAnimationFrame(raf); book?.stop();
      io?.disconnect(); document.removeEventListener('visibilitychange', onVis);
      phoneMQ?.removeEventListener?.('change', onMQ);
    },
  };
}
