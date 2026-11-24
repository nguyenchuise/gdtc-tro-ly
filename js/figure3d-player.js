// Cột ① "Bạn mẫu tập cùng em" bằng MÔ HÌNH 3D (tệp Three.js thầy cô dựng bằng Gemini, nhúng iframe
// figures3d/<mã-bài>.html) + cột ② ảnh gốc SGK chạy CÙNG NHỊP. Mô hình 3D là "đồng hồ": cầu nối
// (js/fig3d-bridge.js) báo nhịp đang hiện, trang này đổi ảnh sách, chữ chú thích và dãy chọn nhịp theo.
// Nhịp được ghép với ảnh sách theo TÊN (động tác + "Nhịp n"); nhịp nào SGK không in hình thì ghi rõ.
import { esc } from './util.js';
import { hasBookAnim, createBookAnim, preloadBookAnim } from './book-anim.js';

const SPEEDS = [{ label: 'Chậm', v: 0.5 }, { label: 'Vừa', v: 1 }, { label: 'Nhanh', v: 1.5 }];
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/^[a-z]\d?\)\s*/, '').replace(/[^a-z0-9() ]+/g, ' ').replace(/\s+/g, ' ').trim();
const lanOf = (s) => Number(norm(s).match(/\(lan (\d)\)/)?.[1] || 0);
const baseOf = (s) => norm(s).replace(/\(lan \d\)/, '').replace(/\b(tai cho)\b/, '').replace(/\s+/g, ' ').trim();
const beatNo = (code) => String(code || '').match(/\d+/)?.[0] || (/ttcb/i.test(code) ? 'TTCB' : '');
const shortCode = (code) => (/^ttcb/i.test(code) ? 'TTCB' : beatNo(code) || code);

/** Ghép từng tư thế 3D với khung ảnh sách: cùng động tác (tên gần giống, cùng "lần") và cùng số nhịp. */
function mapFrames(poses, frames) {
  const groups = [...new Set(frames.map((f) => f.group || ''))];
  const groupFor = (g3) => {
    if (!g3) return groups.length === 1 ? groups[0] : null;
    const b3 = baseOf(g3), l3 = lanOf(g3);
    const cands = groups.filter((g) => { const b = baseOf(g); return b && (b.startsWith(b3) || b3.startsWith(b) || b.split(' ').slice(0, 2).join(' ') === b3.split(' ').slice(0, 2).join(' ')); });
    return cands.find((g) => lanOf(g) === l3) ?? cands.find((g) => !lanOf(g) && l3 <= 1) ?? cands.find((g) => !lanOf(g)) ?? null;
  };
  return poses.map((p) => {
    const g = groupFor(p.group);
    if (g == null) return null;
    const k = frames.findIndex((f) => (f.group || '') === g && beatNo(f.label) === beatNo(p.code));
    return k >= 0 ? k : null;
  });
}

export async function create3DPlayer(ex, { num = 0 } = {}) {
  const uid = Math.random().toString(36).slice(2, 7);
  const n = (k) => (num ? `<span class="vsec__n" aria-hidden="true">${num + k}</span>` : '');
  const el = document.createElement('section');
  el.className = 'vsec vfig vfig--3d';
  el.setAttribute('aria-label', 'Bạn mẫu tập cùng em (mô hình 3D) và động tác trong sách');
  el.innerHTML = `
    <div class="vfig__stages">
      <figure class="vfig__pane vfig__pane--back">
        <figcaption><h3 class="vfig__phead">${n(0)}Bạn mẫu tập cùng em</h3><span>Mô hình 3D · phía sau</span></figcaption>
        <div class="vfig__3d"><iframe title="Mô hình 3D bạn mẫu nhìn từ phía sau" src="figures3d/${encodeURIComponent(ex.id)}.html" loading="lazy" allow="fullscreen"></iframe></div>
      </figure>
      <figure class="vfig__pane vfig__pane--book">
        <figcaption><h3 class="vfig__phead">${n(1)}Động tác trong sách</h3><span>Ảnh gốc SGK · cùng nhịp</span></figcaption>
        <div class="vfig__book" data-book>${hasBookAnim(ex) ? '<p class="muted small">Đang tải hình trong sách…</p>'
          : `<p class="muted small vfig__bookwait">Chưa có hình động ghép từ sách. Xem ảnh ở <a href="#bai/${encodeURIComponent(ex.id)}/sach">mục 1. Sách</a>.</p>`}</div>
        <p class="vfig__nobook" hidden>SGK không in hình nhịp này</p>
      </figure>
    </div>
    <div class="vfig__steps" role="group" aria-label="Chọn nhịp"><span class="muted small">Đang tải mô hình 3D…</span></div>
    <p class="vfig__now" aria-live="polite"></p>
    <div class="vfig__ctrl">
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="prev" aria-label="Nhịp trước">‹</button>
      <button type="button" class="btn btn--primary btn--small vfig__play" data-a="play"></button>
      <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="next" aria-label="Nhịp sau">›</button>
      <button type="button" class="btn btn--ghost btn--small" data-a="speed" aria-label="Đổi tốc độ"></button>
      <button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="ai" aria-pressed="true"><span class="vfig__dot" aria-hidden="true"></span>Điểm khớp AI</button>
    </div>
    <p class="muted small vfig__note">Bên trái là <b>mô hình 3D</b> nhìn từ phía sau (tay trái ở bên trái màn hình, em làm y hệt); kéo ngang trên hình để xoay xem các phía.
      Bên phải là <b>ảnh gốc trong SGK</b>, chạy cùng nhịp để đối chiếu.</p>`;
  const frame = el.querySelector('iframe');
  const now = el.querySelector('.vfig__now');
  const stepsEl = el.querySelector('.vfig__steps');
  const nobook = el.querySelector('.vfig__nobook');
  let poses = [], map = [], k = -1, playing = !reduceMotion(), speed = 1, ai = true, alive = true, visible = true, ready = false, book = null;
  const post = (m) => frame.contentWindow?.postMessage({ type: 'fig3d', ...m }, '*');

  function ui() {
    const play = el.querySelector('[data-a="play"]');
    play.textContent = playing ? '❚❚ Dừng' : '▶ Chạy';
    play.setAttribute('aria-pressed', String(playing));
    el.querySelector('[data-a="speed"]').textContent = SPEEDS[speed].label;
    el.querySelector('[data-a="ai"]').setAttribute('aria-pressed', String(ai));
  }
  function showBook() {
    if (!book || k < 0) return;
    const fi = map[k];
    if (fi != null) book.go(fi);
    nobook.hidden = fi != null;
    el.querySelector('.vfig__pane--book').classList.toggle('is-nobook', fi == null);
  }
  function onBeat(i) {
    k = i;
    const p = poses[k] || {};
    now.innerHTML = `${p.group ? `<span class="vfig__group">${esc(p.group.replace(/^[a-z]\d?\)\s*/i, ''))}</span>` : ''}<b>${esc(p.code || '')}</b> ${esc(p.caption?.replace(/^(TTCB|Nhịp\s*\d+)\.\s*/i, '') || p.title || '')}
      ${p.tip ? `<span class="vfig__tip">Nhìn từ sau: ${esc(p.tip)}</span>` : ''}`;
    stepsEl.querySelectorAll('[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === k)));
    const chip = stepsEl.querySelector(`[data-k="${k}"]`);
    if (chip && stepsEl.scrollWidth > stepsEl.clientWidth) stepsEl.scrollLeft = chip.offsetLeft - stepsEl.clientWidth / 2 + chip.offsetWidth / 2;
    showBook();
  }
  function apply() {
    if (!ready) return;
    post({ cmd: 'ai', on: ai });
    post({ cmd: 'speed', v: SPEEDS[speed].v });
    post({ cmd: playing && visible && !document.hidden ? 'play' : 'pause' });
  }

  function onMsg(e) {
    if (e.source !== frame.contentWindow || e.data?.type !== 'fig3d') return;
    const m = e.data;
    if (m.ev === 'ready') {
      ready = true;
      poses = m.poses || [];
      map = mapFrames(poses, ex.bookAnim?.frames || []);
      stepsEl.innerHTML = poses.map((p, i) => {
        const gStart = p.group && p.group !== poses[i - 1]?.group;
        const name = `${p.group ? `${p.group} · ` : ''}${p.code}`;
        return `<button type="button" class="chip chip--sm${gStart && i ? ' is-gstart' : ''}" data-k="${i}" aria-pressed="false" aria-label="${esc(name)}" title="${esc(name)}">${esc(shortCode(p.code))}</button>`;
      }).join('');
      apply();
    } else if (m.ev === 'beat') onBeat(m.k);
  }
  window.addEventListener('message', onMsg);

  el.addEventListener('click', (ev) => {
    const chip = ev.target.closest('[data-k]');
    if (chip) { playing = false; post({ cmd: 'goto', k: Number(chip.dataset.k) }); ui(); apply(); return; }
    const a = ev.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    if (a === 'prev' || a === 'next') { playing = false; post({ cmd: 'goto', k: Math.max(0, k) + (a === 'next' ? 1 : -1) }); }
    else if (a === 'play') playing = !playing;
    else if (a === 'speed') speed = (speed + 1) % SPEEDS.length;
    else if (a === 'ai') ai = !ai;
    ui(); apply();
  });

  // Mô hình 3D chỉ chạy khi khung đang hiện trên màn hình (đỡ tốn pin điện thoại).
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visible = es.some((x) => x.isIntersecting); apply(); }) : null;
  io?.observe(el);
  const onVis = () => apply();
  document.addEventListener('visibilitychange', onVis);
  const onResize = () => post({ cmd: 'resize' });
  window.addEventListener('resize', onResize);

  if (hasBookAnim(ex)) {
    const slot = el.querySelector('[data-book]');
    preloadBookAnim(ex).then(() => {
      if (!alive) return;
      book = createBookAnim(ex, { mode: 'full', controlled: true });
      slot.replaceChildren(book.el);
      showBook();
    }).catch(() => {
      slot.innerHTML = `<p class="muted small vfig__bookwait">Chưa tải được ảnh sách từ máy chủ NXB. Xem ở <a href="#bai/${encodeURIComponent(ex.id)}/sach">mục 1. Sách</a>.</p>`;
    });
  }
  ui();
  return {
    el,
    stop() {
      alive = false; post({ cmd: 'pause' }); book?.stop(); io?.disconnect();
      window.removeEventListener('message', onMsg); document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    },
  };
}

export const _test = { mapFrames };
