// Hình mẫu chuyển động ghép từ chính các hình "Nhịp 1, 2, 3…" trong SGK.
// Ảnh trang sách vẫn lấy trực tiếp từ máy chủ NXB Giáo dục (không sao chép về kho mã):
// mỗi khung chỉ là một "ô cửa sổ" CSS nhìn vào đúng vùng hình trên trang.
import { esc } from './util.js';

const SPEEDS = [{ id: 'cham', label: 'Chậm', ms: 1700 }, { id: 'vua', label: 'Vừa', ms: 1100 }, { id: 'nhanh', label: 'Nhanh', ms: 650 }];
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Bài có hình động từ sách không. */
export const hasBookAnim = (ex) => Boolean(ex?.bookAnim?.frames?.length && ex.book?.pages?.length);

/** Kiểm tra trước các trang ảnh cần dùng; reject nếu có trang không tải được (mạng trường chặn…). */
const pageCheck = new Map();
export function preloadBookAnim(ex) {
  const urls = [...new Set(ex.bookAnim.frames.map((f) => imageOf(ex, f.page)))];
  return Promise.all(urls.map((u) => {
    if (!pageCheck.has(u)) {
      pageCheck.set(u, new Promise((ok, fail) => {
        const im = new Image();
        im.referrerPolicy = 'no-referrer';
        im.onload = () => ok(u); im.onerror = () => { pageCheck.delete(u); fail(new Error(u)); };
        im.src = u;
      }));
    }
    return pageCheck.get(u);
  }));
}

function imageOf(ex, page) {
  return ex.book.pages.find((p) => p.page === page)?.image;
}

/** Ô nền hiển thị đúng vùng box [x, y, w, h] (tỉ lệ 0–1 của trang). */
function cropStyle(url, [x, y, w, h]) {
  const px = w >= 1 ? 0 : (x / (1 - w)) * 100;
  const py = h >= 1 ? 0 : (y / (1 - h)) * 100;
  return `background-image:url('${String(url).replace(/['"()\\]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)}');background-size:${(100 / w).toFixed(3)}% ${(100 / h).toFixed(3)}%;background-position:${px.toFixed(3)}% ${py.toFixed(3)}%`;
}

/**
 * Tạo trình chiếu.
 * opts.mode: 'full' (có nút, chú thích sách) | 'inset' (nhỏ gọn, trong khung camera)
 * opts.practice: true → mặc định chạy nhóm động tác máy chấm, đánh dấu nhịp được chấm.
 */
export function createBookAnim(ex, { mode = 'full', practice = false, controlled = false } = {}) {
  const A = ex.bookAnim;
  const [PW, PH] = A.pageSize || [1094, 1536];
  const focus = A.focus || {};
  const groups = [...new Set(A.frames.map((f) => f.group).filter(Boolean))];
  const isFocus = (f) => Boolean(focus.label) && f.label === focus.label && (f.group || '') === (focus.group || '');
  let group = practice && focus.group ? focus.group : null;
  // controlled: không tự chạy, không nút; trang Tự tập gọi go(k) để hiện đúng nhịp đang chấm.
  let speed = 1, i = 0, timer = 0, playing = !controlled && !reduceMotion(), alive = true;
  const list = () => A.frames.filter((f) => !group || f.group === group);

  const el = document.createElement('div');
  el.className = `bookanim bookanim--${mode}`;
  const full = mode === 'full' && !controlled;
  const withCap = mode === 'full';
  el.innerHTML = `
    ${full && groups.length > 1 ? `<div class="bookanim__groups" role="group" aria-label="Chọn động tác">
      <button type="button" class="chip chip--sm" data-g="" aria-pressed="false">Tất cả</button>
      ${groups.map((g) => `<button type="button" class="chip chip--sm" data-g="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join('')}</div>` : ''}
    <div class="bookanim__stage" role="img" aria-roledescription="hình động"></div>
    <div class="bookanim__bar">
      <p class="bookanim__label" aria-live="polite"></p>
      ${full ? `<div class="bookanim__ctrl">
        <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="prev" aria-label="Nhịp trước">‹</button>
        <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="play" aria-label="Dừng"></button>
        <button type="button" class="btn btn--ghost btn--small btn--icon" data-a="next" aria-label="Nhịp sau">›</button>
        <button type="button" class="btn btn--ghost btn--small" data-a="speed" aria-label="Đổi tốc độ"></button>
      </div>` : ''}
    </div>
    ${withCap ? '<div class="bookanim__cap"></div>' : ''}`;
  const stage = el.querySelector('.bookanim__stage');

  function build() {
    const L = list();
    const maxW = Math.max(...L.map((f) => f.box[2] * PW));
    const maxH = Math.max(...L.map((f) => f.box[3] * PH));
    const ar = Math.min(1.7, Math.max(0.55, maxW / maxH));
    stage.style.setProperty('--ar', ar.toFixed(3));
    // Cùng tỉ lệ thu phóng cho mọi khung, chân đặt cùng một mặt sàn → nhìn như một người đang chuyển động.
    // kích thước sân khấu theo điểm ảnh trang (chừa 6% lề trên để hình cao nhất không chạm viền)
    const unitW = Math.max(maxW, maxH * ar) / 0.94, unitH = unitW / ar;
    stage.replaceChildren(...L.map((f) => {
      const d = document.createElement('div');
      d.className = 'bookanim__frame';
      d.style.cssText = `${cropStyle(imageOf(ex, f.page), f.box)};width:${((f.box[2] * PW) / unitW) * 100}%;height:${((f.box[3] * PH) / unitH) * 100}%`;
      if (practice && isFocus(f)) d.insertAdjacentHTML('beforeend', '<span class="bookanim__badge">Máy chấm nhịp này</span>');
      return d;
    }));
    if (i >= L.length) i = 0;
    el.querySelectorAll('[data-g]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.g || null) === group)));
    show();
  }

  function show() {
    const L = list();
    const f = L[i];
    [...stage.children].forEach((c, k) => c.classList.toggle('is-on', k === i));
    const name = `${f.group ? `${f.group} · ` : ''}${f.label}`;
    el.querySelector('.bookanim__label').innerHTML = `<strong>${esc(f.label)}</strong>${f.group && (withCap || !group) ? `<span>${esc(f.group)}</span>` : ''}${full ? `<em>${i + 1}/${L.length}</em>` : ''}`;
    stage.setAttribute('aria-label', `Hình trong sách: ${name}`);
    el.classList.toggle('is-focus', practice && isFocus(f));
    if (withCap) {
      const cap = el.querySelector('.bookanim__cap');
      if (f.cap) {
        const w = f.cap[2] * PW, h = f.cap[3] * PH;
        cap.innerHTML = `<div class="bookanim__capimg" role="img" aria-label="Chú thích trong sách: ${esc(f.label)}" style="${cropStyle(imageOf(ex, f.page), f.cap)};width:min(100%, ${Math.round(w * 1.05)}px);aspect-ratio:${(w / h).toFixed(3)}"></div>`;
      } else cap.innerHTML = '';
    }
    if (full) {
      const play = el.querySelector('[data-a="play"]');
      play.textContent = playing ? '❚❚' : '▶';
      play.setAttribute('aria-label', playing ? 'Dừng' : 'Chạy');
      el.querySelector('[data-a="speed"]').textContent = SPEEDS[speed].label;
    }
  }

  function tick() {
    clearTimeout(timer);
    if (!alive || !playing) return;
    const f = list()[i];
    const ms = SPEEDS[speed].ms * (practice && isFocus(f) ? 2.2 : 1);
    timer = setTimeout(() => { i = (i + 1) % list().length; show(); tick(); }, ms);
  }

  el.addEventListener('click', (ev) => {
    const g = ev.target.closest('[data-g]');
    if (g) { group = g.dataset.g || null; i = 0; build(); tick(); return; }
    const a = ev.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    const n = list().length;
    if (a === 'prev') { i = (i - 1 + n) % n; playing = false; }
    else if (a === 'next') { i = (i + 1) % n; playing = false; }
    else if (a === 'play') playing = !playing;
    else if (a === 'speed') speed = (speed + 1) % SPEEDS.length;
    show(); tick();
  });

  build();
  tick();
  return { el, stop: () => { alive = false; clearTimeout(timer); }, go: (k) => { i = Math.max(0, Math.min(A.frames.length - 1, k)); show(); } };
}
