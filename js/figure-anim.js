// Trình phát "bạn mẫu" vector 2.5D: hai góc nhìn chạy cùng nhịp — PHÍA SAU (trái) và PHÍA TRƯỚC (phải),
// tự chạy, hiện sẵn điểm khớp AI chấm (vai, khuỷu, cổ tay, hông, gối, cổ chân).
// Hình vẽ của từng bài nằm ở js/figures/<mã-bài>.front.js / .back.js (sinh từ tệp Gemini bằng
// tools/import-gemini-figure.mjs).
import { esc } from './util.js';

const SPEEDS = [{ label: 'Chậm', k: 0.6 }, { label: 'Vừa', k: 1 }, { label: 'Nhanh', k: 1.5 }];
const BEAT = 1.05; // giây chuyển giữa hai nhịp ở tốc độ Vừa
const HOLD = 0.8; // giây dừng ở đúng tư thế mỗi nhịp
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Điện thoại: cắt bớt lề trống hai bên khung hình (360 → 250 đơn vị) để bạn mẫu to hơn ~1,4 lần.
const phoneMQ = window.matchMedia?.('(max-width: 759px)');
const VB_FULL = '0 0 360 390', VB_PHONE = '48 0 264 390';
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export const hasVectorFigure = (ex) => Boolean(ex?.vectorFigure);

const shortOf = (p, k) => (/^TTCB/i.test(p.code || '') ? 'TTCB' : (String(p.code || '').match(/\d+/)?.[0] || String(k)));

/** Tạo trình phát; trả về { el, stop }. Tải hình vẽ của bài theo nhu cầu (chỉ khi mở tab Video). */
export async function createFigurePlayer(ex) {
  const [F, B] = await Promise.all([
    import(`./figures/${ex.id}.front.js`),
    import(`./figures/${ex.id}.back.js`),
  ]);
  const N = F.poses.length;
  const uid = Math.random().toString(36).slice(2, 7);
  let t = 0, playing = !reduceMotion(), speed = 1, hold = HOLD, alive = true, visible = true;
  let ai = true, arrows = true, tween = null, raf = 0, last = 0, lastIdx = -1, dirty = true;

  const el = document.createElement('section');
  el.className = 'vfig';
  el.setAttribute('aria-labelledby', `vfig-${uid}`);
  el.innerHTML = `
    <h3 id="vfig-${uid}">Bạn mẫu tập cùng em <span class="anim-card__tag">phía sau · phía trước</span></h3>
    <div class="vfig__stages">
      <figure class="vfig__pane vfig__pane--back">
        <figcaption><b>Phía sau</b><span>Làm theo cùng chiều</span></figcaption>
        <svg viewBox="${VB_FULL}" role="img" data-view="back" aria-label="Bạn mẫu nhìn từ phía sau"></svg>
      </figure>
      <figure class="vfig__pane vfig__pane--front">
        <figcaption><b>Phía trước</b><span>Như trong sách</span></figcaption>
        <svg viewBox="${VB_FULL}" role="img" data-view="front" aria-label="Bạn mẫu nhìn từ phía trước"></svg>
      </figure>
    </div>
    <div class="vfig__steps" role="group" aria-label="Chọn nhịp">${F.poses.map((p, k) => {
      // Bài chia nhiều động tác (lớp 8, 9): đầu mỗi động tác có khoảng cách và tên nhóm khi rê/đọc.
      const gStart = p.group && p.group !== F.poses[k - 1]?.group;
      const name = `${p.group ? `${p.group} · ` : ''}${p.code || `Nhịp ${k}`}`;
      return `<button type="button" class="chip chip--sm${gStart && k ? ' is-gstart' : ''}" data-k="${k}" aria-pressed="false" aria-label="${esc(name)}" title="${esc(name)}">${esc(shortOf(p, k))}</button>`;
    }).join('')}</div>
    <p class="vfig__now" aria-live="polite"></p>
    <div class="vfig__ctrl">
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="prev" aria-label="Nhịp trước">‹</button>
      <button type="button" class="btn btn--primary btn--small vfig__play" data-a="play"></button>
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="next" aria-label="Nhịp sau">›</button>
      <button type="button" class="btn btn--ghost btn--small" data-a="speed" aria-label="Đổi tốc độ"></button>
      <button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="ai" aria-pressed="true"><span class="vfig__dot" aria-hidden="true"></span>Điểm khớp AI</button>
      <button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="arrows" aria-pressed="true">Mũi tên</button>
    </div>
    <p class="muted small vfig__note"><b>Phía sau</b>: tay trái bạn mẫu ở bên trái màn hình, em làm y hệt, không bị ngược chiều.
      Chấm cam là <b>điểm khớp máy chấm</b> khi em tự tập.</p>`;
  const svgB = el.querySelector('[data-view="back"]');
  const svgF = el.querySelector('[data-view="front"]');
  const now = el.querySelector('.vfig__now');

  let phone = Boolean(phoneMQ?.matches);
  function fit() {
    phone = Boolean(phoneMQ?.matches);
    svgB.setAttribute('viewBox', phone ? VB_PHONE : VB_FULL);
    svgF.setAttribute('viewBox', phone ? VB_PHONE : VB_FULL);
    dirty = true; lastIdx = -1;
  }
  const onMQ = () => { fit(); schedule(); };
  phoneMQ?.addEventListener?.('change', onMQ);

  function draw() {
    const pf = F.sample(t), pb = B.sample(t);
    // Khung phụ "góc nghiêng" của Gemini (nằm sát mép phải) quá nhỏ trên điện thoại → tắt, giữ hình chính ở giữa.
    if (phone && 'inset4Alpha' in pb) pb.inset4Alpha = 0;
    const opts = { ai, arrows };
    svgF.innerHTML = F.render(pf, opts, `f${uid}_`);
    svgB.innerHTML = B.render(pb, opts, `b${uid}_`);
    const k = pf.nearestIdx;
    if (k !== lastIdx) {
      lastIdx = k;
      const p = F.poses[k] || {}, q = B.poses[k] || {};
      now.innerHTML = `${p.group ? `<span class="vfig__group">${esc(p.group)}</span>` : ''}<b>${esc(p.code || '')}</b> ${esc(p.caption?.replace(/^(TTCB|Nhịp\s*\d+)\.\s*/i, '') || p.shortTitle || '')}
        ${q.rearTip ? `<span class="vfig__tip">Nhìn từ sau: ${esc(q.rearTip)}</span>` : ''}`;
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
    el.querySelector('[data-a="arrows"]').setAttribute('aria-pressed', String(arrows));
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
        t += (dt * k) / BEAT;
        const after = Math.floor(t + 1e-6);
        if (after > before) { t = after % N; hold = HOLD / Math.sqrt(k); }
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
      alive = false; if (raf) cancelAnimationFrame(raf);
      io?.disconnect(); document.removeEventListener('visibilitychange', onVis);
      phoneMQ?.removeEventListener?.('change', onMQ);
    },
  };
}
