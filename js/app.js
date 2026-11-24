// Ứng dụng chính: trang chủ, tìm kiếm, cây Lớp → Phần → Chủ đề → Bài (thu gọn được), hộp chi tiết bài tập.
import { loadData, store, contentStatus, relatedOf } from './data.js';
import { search } from './search.js';
import { listen, voiceSupported } from './voice.js';
import { videoFacade, watchUrl, searchUrl } from './youtube.js';
import { isTeacherUnlocked, renderTeacherGate } from './teacher-gate.js';
import { esc, $, $$, debounce } from './util.js';
import { hasBookAnim, createBookAnim, preloadBookAnim } from './book-anim.js';
import { hasVectorFigure } from './figure-anim.js';

const state = { grade: null, chapter: null, q: '' };
const closed = new Set(); // các nhóm Lớp/Phần đang thu gọn (nhớ trong lúc dùng trang)
const GRADES = [6, 7, 8, 9];
// Thứ tự tab: Sách → Video → Hướng dẫn → Tự tập. Mở bài mặc định vào tab đầu (Sách).
const TABS = [
  { id: 'sach', label: 'Sách', icon: 'book' },
  { id: 'video', label: 'Video', icon: 'video' },
  { id: 'huong-dan', label: 'Hướng dẫn', icon: 'list' },
  { id: 'tu-tap', label: 'Tự tập', icon: 'target', needs: (e) => e.scoring },
];
const ICONS = {
  video: '<path d="M4 6h11a1 1 0 0 1 1 1v3l5-3v10l-5-3v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a2 2 0 0 0-2 2 2 2 0 0 0-2-2H4V4zm2 2v11h4a4 4 0 0 1 1 .2V7a1 1 0 0 0-1-1H6zm12 0h-4a1 1 0 0 0-1 1v10.2a4 4 0 0 1 1-.2h4V6z"/>',
  target: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
  wait: '<path d="M6 2h12v2h-1v3.6a3 3 0 0 1-.9 2.1L13.8 12l2.3 2.3a3 3 0 0 1 .9 2.1V20h1v2H6v-2h1v-3.6a3 3 0 0 1 .9-2.1l2.3-2.3-2.3-2.3A3 3 0 0 1 7 7.6V4H6V2zm3 2v3.6l3 3 3-3V4H9zm3 9.4-3 3V20h6v-3.6l-3-3z"/>',
  check: '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
  close: '<path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/>',
  list: '<path d="M4 5h2v2H4V5zm4 0h12v2H8V5zm-4 6h2v2H4v-2zm4 0h12v2H8v-2zm-4 6h2v2H4v-2zm4 0h12v2H8v-2z"/>',
  chevron: '<path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"/>',
  arrow: '<path d="M10 6 8.6 7.4l4.6 4.6-4.6 4.6L10 18l6-6z"/>',
};
const svg = (name, size = 18) => `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><g fill="currentColor">${ICONS[name]}</g></svg>`;

// ---------------------------------------------------------------- Trang chủ
/** Ô chọn lớp kiểu bento: số lớp lớn, số bài và số bài chấm được bằng camera. */
function renderGradeChips() {
  $('#grade-tiles').innerHTML = GRADES.map((g) => {
    const list = store.exercises.filter((e) => e.grade === g);
    const cam = list.filter((e) => e.scoring).length;
    return `<button type="button" class="grade-tile" data-grade="${g}" aria-pressed="${state.grade === g}">
      <span class="grade-tile__label">Lớp</span><span class="grade-tile__num">${g}</span>
      <span class="grade-tile__meta">${list.length} bài · ${cam} chấm điểm</span>
      <span class="grade-tile__check" aria-hidden="true">${svg('check', 18)}</span>
    </button>`;
  }).join('');
  const title = $('#list-title');
  if (title) title.innerHTML = state.grade ? `Lớp ${state.grade} <button type="button" class="link-btn" data-grade="">${svg('close', 18)}<span>Xem tất cả lớp</span></button>` : 'Tất cả bài tập';
}

/** Biểu tượng minh hoạ theo môn (nét, 24×24). */
const TOPIC_ICONS = {
  run: '<circle cx="15" cy="4" r="2"/><path d="M14 7l-3 6 4 3-1 5M11 13l-3 3-3-1M13.5 8.5 18 10M13 9 9 8"/>',
  ball: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l3.5 2.5-1.3 4h-4.4L8.5 10z"/><path d="M12 3.5v4M15.5 10l4-1M14.2 14l2.3 3.5M9.8 14l-2.3 3.5M8.5 10l-4-1"/>',
  hoop: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5v17M6 5.8c2.5 3.4 2.5 9 0 12.4M18 5.8c-2.5 3.4-2.5 9 0 12.4"/>',
  racket: '<ellipse cx="9" cy="8" rx="5" ry="5.5" transform="rotate(-35 9 8)"/><path d="M12.5 11.5 20 19M6 6l6 4M5 9.5l4.5-4.5"/><circle cx="19" cy="5" r="1.6"/>',
  throw: '<circle cx="9" cy="4" r="2"/><path d="M9 7v7l-3 7M9 14l3 3v4M9 9 5 11M9 8l4-3 3-1"/><circle cx="19" cy="3.5" r="1.6"/>',
  jump: '<circle cx="12" cy="4" r="2"/><path d="M12 7v5M12 9l-4-2M12 9l4-2M12 12l-3 3 2 2M12 12l3 3-2 2M4 21h16"/>',
  strength: '<path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M4 9h16M12 7.5V15M12 15l-4 6M12 15l4 6"/>',
};
function topicIcon(topic) {
  const t = topic.toLowerCase();
  const key = /chạy/.test(t) ? 'run' : /bóng đá/.test(t) ? 'ball' : /bóng rổ/.test(t) ? 'hoop' : /cầu lông/.test(t) ? 'racket'
    : /ném/.test(t) ? 'throw' : /nhảy/.test(t) ? 'jump' : /sức mạnh|thể lực/.test(t) ? 'strength' : 'body';
  return `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TOPIC_ICONS[key]}</svg>`;
}

/** Bộ lọc chủ đề: “Tất cả chủ đề” đứng riêng một dòng; mỗi Phần là một nhóm thu gọn được. */
function renderChapterNav() {
  const nav = $('#chapter-nav');
  const cur = store.curriculum.find((c) => c.grade === state.grade);
  if (!cur) { nav.innerHTML = ''; nav.hidden = true; return; }
  nav.hidden = false;
  const countIn = (chapterId) => store.exercises.filter((e) => e.chapter === chapterId).length;
  nav.innerHTML = `
    <div class="chapter-nav__all">
      <button type="button" class="chip" data-chapter="" aria-pressed="${!state.chapter}">Tất cả chủ đề</button>
    </div>
    ${cur.parts.map((p) => {
      const key = `nav-${p.id}`;
      return `<details class="nav-part" data-key="${key}" ${closed.has(key) ? '' : 'open'}>
        <summary><span>${esc(p.title)}</span>${svg('chevron', 20)}</summary>
        <div class="nav-part__chips">${p.chapters.map((c) => `<button type="button" class="chip chip--sm" data-chapter="${c.id}" aria-pressed="${state.chapter === c.id}">
          ${esc(c.title)} <span class="chip__count">${countIn(c.id)}</span></button>`).join('')}</div>
      </details>`;
    }).join('')}`;
}

function card(e, { crumbs = false } = {}) {
  const st = contentStatus(e);
  const badges = [
    st.scoring && `<span class="badge badge--score">${svg('target', 14)} Chấm điểm</span>`,
    st.video ? `<span class="badge">${svg('video', 14)} Video</span>` : '',
    st.book ? `<span class="badge">${svg('book', 14)} Sách</span>` : '',
    e._draft && '<span class="badge badge--draft">Bản nháp</span>',
  ].filter(Boolean).join('');
  return `<li><a class="card" data-grade="${e.grade}" href="#bai/${encodeURIComponent(e.id)}">
    <span class="card__art">${topicIcon(e.topic)}</span>
    <span class="card__body">
      ${crumbs ? `<span class="card__crumbs">Lớp ${e.grade} · ${esc(e._chapterTitle)}</span>` : ''}
      <span class="card__title">${esc(e.title)}</span>
      <span class="card__badges">${badges}${e.demo ? '<span class="badge badge--demo">Mẫu</span>' : ''}</span>
    </span>
    <span class="card__go">${svg('arrow', 22)}</span>
  </a></li>`;
}

function renderResults({ openSingle = false } = {}) {
  const { results, query } = search(store.exercises, state.q, { grade: state.grade, chapter: state.chapter });
  const box = $('#results');
  const summary = $('#result-summary');
  const hasTerms = query.terms.length > 0;
  $('#toggle-all').hidden = hasTerms || !results.length;
  if (!results.length) {
    summary.textContent = 'Không tìm thấy bài nào.';
    box.innerHTML = `<div class="empty"><p><strong>Chưa thấy bài “${esc(state.q)}”.</strong></p>
      <p>Thử từ ngắn hơn, ví dụ “nhảy cao”, “chạy”, “bóng rổ”.</p>
      <button type="button" class="btn btn--ghost" data-clear>Xoá tìm kiếm</button></div>`;
    return;
  }
  const filters = [query.grade && `lớp ${query.grade}`, query.partNo && `phần ${query.partNo}`, query.chapterNo && `chủ đề ${query.chapterNo}`].filter(Boolean);
  summary.textContent = hasTerms || filters.length
    ? `Tìm thấy ${results.length} bài${filters.length ? ` · ${filters.join(', ')}` : ''}`
    : `${results.length} bài tập`;
  box.classList.toggle('reveal', !renderResults.done);
  renderResults.done = true;
  box.innerHTML = hasTerms ? `<ul class="grid">${results.map((e) => card(e, { crumbs: true })).join('')}</ul>` : renderTree(results);
  updateToggleAll();
  if (openSingle && results.length === 1) location.hash = `bai/${results[0].id}`;
}

/** Nhóm bài theo Lớp → Phần → Chủ đề. Lớp và Phần là các khối thu gọn được. */
function renderTree(list) {
  const ids = new Set(list.map((e) => e.id));
  let html = '';
  for (const g of store.curriculum) {
    const inGrade = list.filter((e) => e.grade === g.grade);
    if (!inGrade.length) continue;
    const gKey = `g${g.grade}`;
    html += `<details class="grade-block" data-grade="${g.grade}" data-key="${gKey}" ${closed.has(gKey) ? '' : 'open'}>
      <summary class="grade-title"><span class="grade-title__badge">${g.grade}</span><span>Lớp ${g.grade}</span>
        <span class="count">${inGrade.length} bài</span>${svg('chevron', 24)}</summary>`;
    for (const p of g.parts) {
      const chs = p.chapters.map((c) => ({ c, items: store.exercises.filter((e) => e.chapter === c.id && ids.has(e.id)) })).filter((x) => x.items.length);
      if (!chs.length) continue;
      const pKey = p.id;
      html += `<details class="part-block" data-key="${pKey}" ${closed.has(pKey) ? '' : 'open'}>
        <summary class="part-title"><span>${esc(p.title)}</span>${svg('chevron', 20)}</summary>`;
      for (const { c, items } of chs) {
        html += `<div class="chapter-block"><h2 class="chapter-title">${esc(c.title)} <span class="count">${items.length} bài</span></h2>
          <ul class="grid">${items.map((e) => card(e)).join('')}</ul></div>`;
      }
      html += '</details>';
    }
    const loose = inGrade.filter((e) => !store.chapters.has(e.chapter));
    if (loose.length) html += `<div class="chapter-block"><h2 class="chapter-title">Chưa xếp chủ đề</h2><ul class="grid">${loose.map((e) => card(e)).join('')}</ul></div>`;
    html += '</details>';
  }
  return html;
}

function updateToggleAll() {
  const all = $$('#results details');
  const anyOpen = all.some((d) => d.open);
  const btn = $('#toggle-all');
  btn.innerHTML = `${svg('chevron', 20)}<span>${anyOpen ? 'Thu gọn tất cả' : 'Mở tất cả'}</span>`;
  btn.classList.toggle('is-closed', !anyOpen);
  btn.dataset.open = String(anyOpen);
}

function setGrade(g) {
  state.grade = g;
  state.chapter = null;
  renderGradeChips(); renderChapterNav(); renderResults();
}

function initHome() {
  renderGradeChips(); renderChapterNav(); renderResults();
  const input = $('#q');
  const live = debounce(() => { state.q = input.value; renderResults(); }, 180);
  input.addEventListener('input', live);
  $('#search-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    state.q = input.value;
    renderResults({ openSingle: true });
    input.blur();
  });
  $('#suggest').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-q]');
    if (!b) return;
    input.value = b.dataset.q; state.q = b.dataset.q;
    renderResults({ openSingle: true });
  });
  const pickGrade = (ev) => {
    const b = ev.target.closest('button[data-grade]');
    if (!b) return;
    const g = b.dataset.grade ? Number(b.dataset.grade) : null;
    setGrade(state.grade === g ? null : g);
    if (g && state.grade === g) $('#chapter-nav').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('#grade-tiles').addEventListener('click', pickGrade);
  $('#list-title').addEventListener('click', pickGrade);
  $('#nav-search').addEventListener('click', () => {
    if (location.hash && location.hash !== '#') location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => input.focus(), 250);
  });
  $('#chapter-nav').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-chapter]');
    if (!b) return;
    state.chapter = b.dataset.chapter || null;
    renderChapterNav(); renderResults();
  });
  // Ghi nhớ khối nào đang thu gọn (sự kiện toggle không nổi bọt → bắt ở pha capture).
  const remember = (ev) => {
    const d = ev.target;
    if (!(d instanceof HTMLDetailsElement) || !d.dataset.key) return;
    if (d.open) closed.delete(d.dataset.key); else closed.add(d.dataset.key);
    updateToggleAll();
  };
  $('#results').addEventListener('toggle', remember, true);
  $('#chapter-nav').addEventListener('toggle', remember, true);
  $('#toggle-all').addEventListener('click', () => {
    const open = $('#toggle-all').dataset.open !== 'true';
    $$('#results details').forEach((d) => { d.open = open; });
  });
  $('#results').addEventListener('click', (ev) => {
    if (ev.target.closest('[data-clear]')) { input.value = ''; state.q = ''; setGrade(null); }
  });

  // Giọng nói
  const mic = $('#mic'), msg = $('#voice-msg');
  let stopListening = null;
  if (!voiceSupported()) mic.classList.add('mic--unsupported');
  mic.addEventListener('click', () => {
    if (stopListening) { stopListening(); return; }
    msg.textContent = '';
    stopListening = listen({
      onText: (text, final) => {
        input.value = text;
        if (final) { state.q = text; renderResults({ openSingle: true }); }
      },
      onState: (s) => {
        const on = s === 'listening';
        mic.setAttribute('aria-pressed', String(on));
        mic.classList.toggle('mic--on', on);
        mic.querySelector('span').textContent = on ? 'Dừng' : 'Nói';
        msg.textContent = on ? 'Đang nghe… Em nói tên bài nhé.' : msg.textContent.startsWith('Đang nghe') ? '' : msg.textContent;
        if (!on) stopListening = null;
      },
      onError: (m) => { msg.textContent = m; stopListening = null; },
    });
  });
}

// ---------------------------------------------------------------- Hộp chi tiết bài tập
const dlg = $('#lesson');
let current = null; // { ex, tab, cleanup }

function waitingPanel(kind, e, extra = '') {
  const text = {
    video: ['Video sắp có', 'Thầy cô đang chuẩn bị video. Em xem tạm video tham khảo nhé.'],
    book: ['Trang sách sắp có', 'Thầy cô đang chụp trang sách. Em mở sách giấy để xem nhé.'],
    summary: ['Tóm tắt sắp có', 'Thầy cô đang viết các ý chính.'],
  }[kind];
  return `<div class="waiting" role="note">
    <div class="waiting__icon">${svg('wait', 30)}</div>
    <h3>${text[0]}</h3>
    <p>${text[1]}</p>
    ${extra}
    <p class="waiting__teacher"><a href="#giao-vien/${encodeURIComponent(e.id)}">Thầy cô cập nhật →</a></p>
  </div>`;
}

function panelGuide(e) {
  return `
    ${e.demo ? '<p class="notice notice--demo">Bài mẫu, chưa đối chiếu SGK.</p>' : ''}
    <h3>Cách làm</h3>
    <ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${e.commonErrors?.length ? `<h3>Lỗi hay gặp</h3><ul class="errors">${e.commonErrors.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    ${e.scoring ? `<h3>Đặt máy thế nào?</h3><p class="tip" data-camera-tip></p>
      <p><a class="btn btn--primary btn--lg" href="#bai/${encodeURIComponent(e.id)}/tu-tap">${svg('target')} Bắt đầu tự tập</a></p>`
      : '<p class="notice">Bài này không chấm bằng camera. Em xem video rồi tập cùng thầy cô nhé.</p>'}`;
}

/** Mục 2. Video: bạn mẫu vector hai góc nhìn + hình động ghép từ sách (nếu có), rồi tới video. */
function panelVideo(e, root) {
  const motion = `${hasVectorFigure(e) ? '<div data-vfig><p class="muted small">Đang tải bạn mẫu…</p></div>' : ''}
    ${hasBookAnim(e) ? `<section class="anim-card" aria-labelledby="anim-title">
      <h3 id="anim-title">Động tác trong sách <span class="anim-card__tag">hình động</span></h3>
      <div data-bookanim><p class="muted small">Đang tải hình trong sách…</p></div>
      <p class="muted small anim-card__note">Ghép từ các hình “Nhịp” trong SGK, chạy lần lượt như một đoạn phim. Bấm ‹ › để xem từng nhịp.</p>
    </section>` : ''}`;
  const cleanup = mountMotion(e, root);
  if (!e.youtube.length) {
    root.innerHTML = motion + waitingPanel('video', e, e.youtubeSearch
      ? `<p><a class="btn btn--ghost" href="${searchUrl(e.youtubeSearch)}" target="_blank" rel="noopener">Tìm trên YouTube ↗</a></p>` : '');
    cleanup.start();
    return cleanup.stop;
  }
  const list = e.youtube;
  root.innerHTML = `${motion}<div class="player"></div>
    <div class="player__meta"><p class="player__title"></p>
      <a class="btn btn--ghost btn--small player__open" target="_blank" rel="noopener">Mở trên YouTube ↗</a></div>
    ${list.length > 1 ? `<h3 class="visually-hidden">Danh sách video</h3><ol class="playlist">${list.map((v, i) =>
      `<li><button type="button" class="playlist__item" data-i="${i}" aria-current="${i === 0}">${i + 1}. ${esc(v.title || `Video ${i + 1}`)}</button></li>`).join('')}</ol>` : ''}`;
  const show = (i) => {
    const v = list[i];
    root.querySelector('.player').replaceChildren(videoFacade(v, { autoplay: true }));
    root.querySelector('.player__title').textContent = v.title || 'Video hướng dẫn';
    root.querySelector('.player__open').href = watchUrl(v);
    $$('.playlist__item', root).forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.i) === i)));
  };
  root.addEventListener('click', (ev) => { const b = ev.target.closest('.playlist__item'); if (b) show(Number(b.dataset.i)); });
  show(0);
  cleanup.start();
  return cleanup.stop;
}

/** Gắn bạn mẫu vector và hình động trong sách vào các ô [data-vfig] / [data-bookanim] của root. */
function mountMotion(e, root) {
  const players = [];
  let gone = false;
  return {
    start() {
      const vslot = root.querySelector('[data-vfig]');
      if (vslot) {
        import('./figure-anim.js').then(({ createFigurePlayer }) => createFigurePlayer(e)).then((p) => {
          if (gone || !vslot.isConnected) { p.stop(); return; }
          players.push(p); vslot.replaceWith(p.el);
        }).catch((err) => { console.warn(err); vslot.remove(); });
      }
      // Hình động trong sách: chỉ hiện khi tải được ảnh trang sách; không tải được thì bỏ hẳn khung này.
      const slot = root.querySelector('[data-bookanim]');
      if (slot) {
        preloadBookAnim(e).then(() => {
          if (gone || !slot.isConnected) return;
          const p = createBookAnim(e, { mode: 'full' });
          players.push(p); slot.replaceChildren(p.el);
        }).catch(() => { root.querySelector('.anim-card')?.remove(); });
      }
    },
    stop() { gone = true; players.forEach((p) => p.stop()); },
  };
}

function panelBook(e, root) {
  const b = e.book;
  const pages = b.pages;
  const series = b.series || store.raw.bookSeries;
  const summary = e.summary.length
    ? `<ul class="summary-list">${e.summary.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
       ${e.demo && !e.summaryReviewed && !e._draft ? '<p class="muted small">Tóm tắt mẫu, chưa đối chiếu SGK.</p>' : ''}`
    : waitingPanel('summary', e);
  const imageSide = pages.length
    ? `<figure class="book-viewer">
        <div class="book-viewer__frame"><img src="${esc(pages[0].image)}" alt="Trang sách${pages[0].page ? ` ${pages[0].page}` : ''}: ${esc(e.title)}" decoding="async" loading="lazy" referrerpolicy="no-referrer"></div>
        <figcaption><span class="book-viewer__cap">${pageCap(pages[0])}</span>
          <a class="btn btn--ghost btn--small book-viewer__full" href="${esc(pages[0].image)}" target="_blank" rel="noopener">Phóng to ↗</a></figcaption>
        ${pages.length > 1 ? `<div class="book-pages" role="group" aria-label="Chọn trang">${pages.map((p, i) =>
          `<button type="button" class="chip chip--sm" data-page="${i}" aria-pressed="${i === 0}">${p.page ? `Trang ${p.page}` : `Ảnh ${i + 1}`}</button>`).join('')}</div>` : ''}
        ${b.remote ? '<p class="muted small book-viewer__src">Ảnh hiển thị trực tiếp từ sách điện tử của NXB Giáo dục Việt Nam.</p>' : ''}
       </figure>`
    : b.url && b.range
      ? bookLinkPanel(b)
      : waitingPanel('book', e, b.url ? `<p><a class="btn btn--ghost" href="${esc(b.url)}" target="_blank" rel="noopener">Mở sách điện tử ↗</a></p>` : '');
  root.innerHTML = `
    ${hasBookAnim(e) || hasVectorFigure(e) ? `<p class="notice notice--motion">Hình chuyển động của bài này ở mục <a href="#bai/${encodeURIComponent(e.id)}/video">2. Video</a>.</p>` : ''}
    ${series ? `<p class="muted small book-series">Bộ sách: ${esc(series)}</p>` : ''}
    <div class="book-split">
      <section class="book-split__text" aria-labelledby="sum-title"><h3 id="sum-title">Ý chính</h3>${summary}
        ${b.url && pages.length ? `<p class="small book-open"><a href="${esc(b.url)}" target="_blank" rel="noopener">Mở sách gốc để xem thêm trang ↗</a></p>` : ''}</section>
      <section class="book-split__image" aria-label="Trang sách giáo khoa">${imageSide}</section>
    </div>`;
  // Ảnh trang sách lấy từ máy chủ NXB: nếu không tải được (mạng trường chặn, máy chủ lỗi) → hiện nút mở sách.
  const viewerImg = root.querySelector('.book-viewer img');
  if (viewerImg && b.remote && b.url && b.range) {
    viewerImg.addEventListener('error', () => {
      const fig = root.querySelector('.book-viewer');
      if (fig) fig.outerHTML = bookLinkPanel(b, 'Chưa tải được ảnh trang sách. Em mở sách điện tử của NXB Giáo dục nhé.');
    }, { once: true });
  }
  root.addEventListener('click', (ev) => {
    const pg = ev.target.closest('[data-page]');
    if (!pg) return;
    const p = pages[Number(pg.dataset.page)];
    const img = root.querySelector('.book-viewer img');
    img.src = p.image; img.alt = `Trang sách${p.page ? ` ${p.page}` : ''}: ${e.title}`;
    root.querySelector('.book-viewer__cap').textContent = pageCap(p);
    root.querySelector('.book-viewer__full').href = p.image;
    $$('[data-page]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === pg)));
  });
}
function bookLinkPanel(b, note = 'Xem hình minh hoạ trong sách điện tử của NXB Giáo dục.') {
  return `<div class="waiting book-link" role="note">
    <div class="waiting__icon">${svg('book', 30)}</div>
    <h3>SGK trang ${b.range[0]}${b.range[1] > b.range[0] ? `–${b.range[1]}` : ''}</h3>
    <p>${note}</p>
    <p><a class="btn btn--primary" href="${esc(b.url)}" target="_blank" rel="noopener">${svg('book', 20)}<span>Mở sách trang ${b.range[0]}</span></a></p>
    <p class="muted small">Hoặc mở sách giấy đến trang ${b.range[0]}.</p>
  </div>`;
}
const pageCap = (p) => [p.page ? `Trang ${p.page}` : '', p.caption].filter(Boolean).join(' — ') || 'Ảnh trang sách';

function relatedBlock(e) {
  const rel = relatedOf(e);
  if (!rel.length) return '';
  return `<section class="related" aria-labelledby="rel-title"><h3 id="rel-title">Bài cùng chủ đề</h3>
    <ul class="related__list">${rel.map((r) => `<li><a href="#bai/${encodeURIComponent(r.id)}">${esc(r.title)}${r.scoring ? ` ${svg('target', 16)}` : ''}</a></li>`).join('')}</ul></section>`;
}

async function showTab(tabId, { focus = false, updateHash = true } = {}) {
  if (!current) return;
  const { ex } = current;
  const tabs = TABS.filter((t) => !t.needs || t.needs(ex));
  const tab = tabs.find((t) => t.id === tabId) || tabs[0];
  if (current.tab === tab.id && $('#lesson-body').childElementCount) return;
  current.cleanup?.(); current.cleanup = null;
  current.tab = tab.id;
  $$('[role="tab"]', dlg).forEach((b) => {
    const on = b.dataset.tab === tab.id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  });
  const body = $('#lesson-body');
  const panel = document.createElement('div');
  panel.className = `panel panel--${tab.id}`;
  panel.id = `panel-${tab.id}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${tab.id}`);
  panel.tabIndex = 0;
  body.replaceChildren(panel);
  body.scrollTop = 0;
  // Điện thoại: cả hộp thoại cuộn chung → đổi tab thì đưa thanh tab về đầu màn hình nếu đã cuộn qua.
  const inner = dlg.querySelector('.sheet__inner'), tabsEl = dlg.querySelector('.tabs');
  if (inner && tabsEl && inner.scrollTop > tabsEl.offsetTop) inner.scrollTop = Math.max(0, tabsEl.offsetTop - 8);
  if (tab.id === 'huong-dan') {
    panel.innerHTML = panelGuide(ex);
    if (ex.scoring) {
      const { cameraTip } = await import('./practice.js');
      const tip = panel.querySelector('[data-camera-tip]');
      if (tip) tip.innerHTML = cameraTip(ex.scoring);
    }
  } else if (tab.id === 'video') current.cleanup = panelVideo(ex, panel);
  else if (tab.id === 'sach') panelBook(ex, panel);
  else if (tab.id === 'tu-tap') {
    const { mountPractice } = await import('./practice.js');
    if (current?.tab === 'tu-tap') current.cleanup = mountPractice(panel, ex);
  }
  if (tab.id !== 'tu-tap') body.insertAdjacentHTML('beforeend', relatedBlock(ex));
  if (updateHash) history.replaceState(null, '', `#bai/${encodeURIComponent(ex.id)}${tab.id === TABS[0].id ? '' : `/${tab.id}`}`);
}

function openLesson(id, tabId) {
  const ex = store.byId.get(id);
  if (!ex) { location.hash = ''; return; }
  if (current?.ex.id !== id) {
    current?.cleanup?.();
    current = { ex, tab: null, cleanup: null };
    const ch = store.chapters.get(ex.chapter);
    $('#lesson-crumbs').innerHTML = `<span class="grade-pill" data-grade="${ex.grade}">Lớp ${ex.grade}</span> ${esc(ch?.title || '')}`;
    $('#lesson-title').textContent = ex.title;
    const tabs = TABS.filter((t) => !t.needs || t.needs(ex));
    const st = contentStatus(ex);
    $('#lesson-tabs').innerHTML = tabs.map((t) => {
      const n = TABS.indexOf(t) + 1; // số thứ tự cố định: 1. Sách 2. Video 3. Hướng dẫn 4. Tự tập
      const waiting = (t.id === 'video' && !st.video && !hasVectorFigure(ex) && !hasBookAnim(ex)) || (t.id === 'sach' && !st.book);
      return `<button type="button" role="tab" id="tab-${t.id}" data-tab="${t.id}" aria-controls="panel-${t.id}" aria-selected="false" tabindex="-1">${svg(t.icon, 18)}<span><span class="tab-num">${n}.</span> ${t.label}</span>${waiting ? '<span class="tab-dot" title="Sắp có"><span class="visually-hidden"> (sắp có)</span></span>' : ''}</button>`;
    }).join('');
    $('#lesson-body').replaceChildren();
  }
  if (!dlg.open) { dlg.showModal(); document.body.classList.add('no-scroll'); }
  showTab(tabId || current.tab || TABS[0].id, { updateHash: false });
}

function closeLesson({ fromRoute = false } = {}) {
  current?.cleanup?.();
  current = null;
  if (dlg.open) dlg.close();
  document.body.classList.remove('no-scroll');
  if (!fromRoute && location.hash.startsWith('#bai/')) history.replaceState(null, '', location.pathname + location.search);
}

function initDialog() {
  dlg.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-close]') || ev.target === dlg) closeLesson();
    const t = ev.target.closest('[role="tab"]');
    if (t) showTab(t.dataset.tab);
  });
  dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); closeLesson(); }); // phím Esc
  $('#lesson-tabs').addEventListener('keydown', (ev) => {
    const tabs = $$('[role="tab"]', dlg);
    const i = tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[ev.key];
    if (next === undefined) return;
    ev.preventDefault();
    const b = tabs[(next + tabs.length) % tabs.length];
    showTab(b.dataset.tab, { focus: true });
  });
}

// ---------------------------------------------------------------- Định tuyến
async function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  const teacher = h.startsWith('giao-vien');
  $('#home-view').hidden = teacher;
  $('#teacher-view').hidden = !teacher;
  $$('[data-nav]').forEach((a) => {
    const on = a.dataset.nav === (teacher ? 'teacher' : 'home');
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (teacher) {
    closeLesson({ fromRoute: true });
    document.title = 'Giáo viên — GDTC Trợ lý tập luyện';
    const view = $('#teacher-view');
    if (!isTeacherUnlocked()) { renderTeacherGate(view, route); return; }
    const { renderTeacher } = await import('./teacher.js');
    renderTeacher(view, h.split('/')[1] || null);
    return;
  }
  document.title = 'GDTC Trợ lý tập luyện';
  if (h.startsWith('bai/')) {
    const [, id, tab] = h.split('/');
    openLesson(id, tab);
  } else {
    closeLesson({ fromRoute: true });
  }
}

async function main() {
  try {
    await loadData();
  } catch (err) {
    console.warn(err);
    $('#results').innerHTML = '<div class="empty"><p>Không tải được bài tập. Em kiểm tra mạng rồi tải lại trang nhé.</p></div>';
    return;
  }
  $('#draft-banner').hidden = !store.hasDrafts;
  initHome();
  initDialog();
  window.addEventListener('hashchange', route);
  route();
}

main();
