// Ứng dụng chính: trang chủ, tìm kiếm, cây Lớp → Phần → Chủ đề → Bài, hộp chi tiết bài tập.
import { loadData, store, contentStatus, relatedOf } from './data.js';
import { search } from './search.js';
import { listen, voiceSupported } from './voice.js';
import { videoFacade, watchUrl, searchUrl } from './youtube.js';
import { esc, $, $$, debounce } from './util.js';

const state = { grade: null, chapter: null, q: '' };
const GRADES = [6, 7, 8, 9];
const TABS = [
  { id: 'huong-dan', label: 'Hướng dẫn' },
  { id: 'video', label: 'Video' },
  { id: 'sach', label: 'Sách giáo khoa' },
  { id: 'tu-tap', label: 'Tự tập & chấm điểm', needs: (e) => e.scoring },
];
const ICONS = {
  video: '<path d="M4 6h11a1 1 0 0 1 1 1v3l5-3v10l-5-3v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a2 2 0 0 0-2 2 2 2 0 0 0-2-2H4V4zm2 2v11h4a4 4 0 0 1 1 .2V7a1 1 0 0 0-1-1H6zm12 0h-4a1 1 0 0 0-1 1v10.2a4 4 0 0 1 1-.2h4V6z"/>',
  target: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
  wait: '<path d="M6 2h12v2h-1v3.6a3 3 0 0 1-.9 2.1L13.8 12l2.3 2.3a3 3 0 0 1 .9 2.1V20h1v2H6v-2h1v-3.6a3 3 0 0 1 .9-2.1l2.3-2.3-2.3-2.3A3 3 0 0 1 7 7.6V4H6V2zm3 2v3.6l3 3 3-3V4H9zm3 9.4-3 3V20h6v-3.6l-3-3z"/>',
};
const svg = (name, size = 18) => `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><g fill="currentColor">${ICONS[name]}</g></svg>`;

// ---------------------------------------------------------------- Trang chủ
function renderGradeChips() {
  const chips = [{ g: null, label: 'Tất cả' }, ...GRADES.map((g) => ({ g, label: `Lớp ${g}` }))];
  $('#grade-chips').innerHTML = chips.map(({ g, label }) =>
    `<button type="button" class="chip" data-grade="${g ?? ''}" aria-pressed="${state.grade === g}">${label}</button>`).join('');
}

function renderChapterNav() {
  const nav = $('#chapter-nav');
  const cur = store.curriculum.find((c) => c.grade === state.grade);
  if (!cur) { nav.innerHTML = ''; nav.hidden = true; return; }
  nav.hidden = false;
  nav.innerHTML = `<button type="button" class="chip chip--sm" data-chapter="" aria-pressed="${!state.chapter}">Tất cả chủ đề</button>`
    + cur.parts.map((p) => `<div class="chapter-group" role="group" aria-label="${esc(p.title)}">
        <span class="chapter-group__label">${esc(p.title)}</span>
        ${p.chapters.map((c) => `<button type="button" class="chip chip--sm" data-chapter="${c.id}" aria-pressed="${state.chapter === c.id}">${esc(c.title)}</button>`).join('')}
      </div>`).join('');
}

function card(e, { crumbs = false } = {}) {
  const st = contentStatus(e);
  const badges = [
    st.scoring && `<span class="badge badge--score">${svg('target', 14)} Chấm bằng camera</span>`,
    st.video ? `<span class="badge">${svg('video', 14)} Video</span>` : `<span class="badge badge--wait">${svg('wait', 14)} Chờ video</span>`,
    st.book ? `<span class="badge">${svg('book', 14)} Trang sách</span>` : '',
    e._draft && '<span class="badge badge--draft">Bản nháp</span>',
  ].filter(Boolean).join('');
  return `<li><a class="card" href="#bai/${encodeURIComponent(e.id)}">
    ${crumbs ? `<span class="card__crumbs">Lớp ${e.grade} · ${esc(e._chapterTitle)}</span>` : ''}
    <span class="card__title">${esc(e.title)}</span>
    <span class="card__topic">${esc(e.topic)}${e.demo ? ' · <em>Mẫu demo</em>' : ''}</span>
    <span class="card__badges">${badges}</span>
  </a></li>`;
}

function renderResults({ openSingle = false } = {}) {
  const { results, query } = search(store.exercises, state.q, { grade: state.grade, chapter: state.chapter });
  const box = $('#results');
  const summary = $('#result-summary');
  const hasTerms = query.terms.length > 0;
  if (!results.length) {
    summary.textContent = 'Không tìm thấy bài phù hợp.';
    box.innerHTML = `<div class="empty"><p>Chưa có bài nào khớp với “${esc(state.q)}”.</p>
      <p>Em thử từ khoá ngắn hơn (ví dụ “squat”, “chạy”, “bóng rổ”) hoặc bỏ bộ lọc lớp/chủ đề.</p>
      <button type="button" class="btn btn--ghost" data-clear>Xoá tìm kiếm và bộ lọc</button></div>`;
    return;
  }
  const filters = [query.grade && `lớp ${query.grade}`, query.partNo && `phần ${query.partNo}`, query.chapterNo && `chủ đề ${query.chapterNo}`].filter(Boolean);
  summary.textContent = hasTerms || filters.length
    ? `Tìm thấy ${results.length} bài${filters.length ? ` (${filters.join(', ')})` : ''}.`
    : `${results.length} bài tập`;
  if (hasTerms) {
    box.innerHTML = `<ul class="grid">${results.map((e) => card(e, { crumbs: true })).join('')}</ul>`;
  } else {
    box.innerHTML = renderTree(results);
  }
  if (openSingle && results.length === 1) location.hash = `bai/${results[0].id}`;
}

/** Nhóm bài theo Lớp → Phần → Chủ đề, theo đúng thứ tự trong mục lục. */
function renderTree(list) {
  const ids = new Set(list.map((e) => e.id));
  let html = '';
  for (const g of store.curriculum) {
    const inGrade = list.filter((e) => e.grade === g.grade);
    if (!inGrade.length) continue;
    html += `<section class="grade-block" aria-labelledby="grade-${g.grade}"><h2 id="grade-${g.grade}" class="grade-title">Lớp ${g.grade}</h2>`;
    for (const p of g.parts) {
      const chs = p.chapters.map((c) => ({ c, items: store.exercises.filter((e) => e.chapter === c.id && ids.has(e.id)) })).filter((x) => x.items.length);
      if (!chs.length) continue;
      html += `<h3 class="part-title">${esc(p.title)}</h3>`;
      for (const { c, items } of chs) {
        html += `<div class="chapter-block"><h4 class="chapter-title">${esc(c.title)} <span class="count">${items.length} bài</span></h4>
          <ul class="grid">${items.map((e) => card(e)).join('')}</ul></div>`;
      }
    }
    // Bài chưa xếp chủ đề
    const loose = inGrade.filter((e) => !store.chapters.has(e.chapter));
    if (loose.length) html += `<div class="chapter-block"><h4 class="chapter-title">Chưa xếp chủ đề</h4><ul class="grid">${loose.map((e) => card(e)).join('')}</ul></div>`;
    html += '</section>';
  }
  return html;
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
  $('#grade-chips').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-grade]');
    if (b) setGrade(b.dataset.grade ? Number(b.dataset.grade) : null);
  });
  $('#chapter-nav').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-chapter]');
    if (!b) return;
    state.chapter = b.dataset.chapter || null;
    renderChapterNav(); renderResults();
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
        msg.textContent = on ? 'Cô đang nghe… em nói tên bài tập nhé.' : msg.textContent.startsWith('Cô đang nghe') ? '' : msg.textContent;
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
    video: ['Video đang được thầy cô chuẩn bị', 'Bài này chưa có video hướng dẫn của thầy cô. Trong lúc chờ, em có thể xem video tham khảo trên YouTube (nhớ xin phép bố mẹ khi xem).'],
    book: ['Trang sách đang được thầy cô cập nhật', 'Ảnh chụp trang sách giáo khoa cho bài này sẽ hiện ở đây. Em có thể mở sách giấy của mình để xem trong lúc chờ.'],
    summary: ['Phần tóm tắt đang được chuẩn bị', 'Thầy cô sẽ viết vài ý chính, ngắn gọn để em nắm nhanh nội dung bài.'],
  }[kind];
  return `<div class="waiting" role="note">
    <div class="waiting__icon">${svg('wait', 32)}</div>
    <h3>${text[0]}</h3>
    <p>${text[1]}</p>
    ${extra}
    <p class="waiting__teacher"><a href="#giao-vien/${encodeURIComponent(e.id)}">Thầy cô: cập nhật nội dung này →</a></p>
  </div>`;
}

function panelGuide(e) {
  return `
    ${e.demo ? '<p class="notice notice--demo">Mẫu demo, chưa đối chiếu SGK.</p>' : ''}
    <h3>Các bước thực hiện</h3>
    <ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${e.commonErrors?.length ? `<h3>Lỗi thường gặp</h3><ul class="errors">${e.commonErrors.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    ${e.scoring ? `<h3>Mẹo đặt camera khi tự tập</h3><p class="tip" data-camera-tip></p>
      <p><a class="btn btn--primary" href="#bai/${encodeURIComponent(e.id)}/tu-tap">${svg('target')} Tự tập và chấm điểm</a></p>`
      : '<p class="notice">Bài này không chấm được bằng camera. Em xem hướng dẫn và video rồi tập cùng thầy cô trên lớp nhé.</p>'}`;
}

function panelVideo(e, root) {
  if (!e.youtube.length) {
    root.innerHTML = waitingPanel('video', e, e.youtubeSearch
      ? `<p><a class="btn btn--ghost" href="${searchUrl(e.youtubeSearch)}" target="_blank" rel="noopener">Tìm video tham khảo trên YouTube ↗</a></p>` : '');
    return;
  }
  const list = e.youtube;
  root.innerHTML = `<div class="player"></div>
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
}

function panelBook(e, root) {
  const b = e.book;
  const pages = b.pages;
  const series = b.series || store.raw.bookSeries;
  const summary = e.summary.length
    ? `<ul class="summary-list">${e.summary.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
       ${e.demo && !e.summaryReviewed && !e._draft ? '<p class="muted small">Tóm tắt mẫu demo, chưa đối chiếu SGK.</p>' : ''}`
    : waitingPanel('summary', e);
  const imageSide = pages.length
    ? `<figure class="book-viewer">
        <div class="book-viewer__frame"><img src="${esc(pages[0].image)}" alt="Trang sách${pages[0].page ? ` ${pages[0].page}` : ''}: ${esc(e.title)}" decoding="async"></div>
        <figcaption><span class="book-viewer__cap">${pageCap(pages[0])}</span>
          <a class="btn btn--ghost btn--small book-viewer__full" href="${esc(pages[0].image)}" target="_blank" rel="noopener">Xem ảnh lớn ↗</a></figcaption>
        ${pages.length > 1 ? `<div class="book-pages" role="group" aria-label="Chọn trang">${pages.map((p, i) =>
          `<button type="button" class="chip chip--sm" data-page="${i}" aria-pressed="${i === 0}">${p.page ? `Trang ${p.page}` : `Ảnh ${i + 1}`}</button>`).join('')}</div>` : ''}
       </figure>`
    : waitingPanel('book', e, b.url ? `<p><a class="btn btn--ghost" href="${esc(b.url)}" target="_blank" rel="noopener">Mở sách điện tử ↗</a></p>` : '');
  root.innerHTML = `
    <div class="split-toolbar" role="group" aria-label="Tỉ lệ hiển thị">
      <span class="muted small">${series ? `Bộ sách: ${esc(series)}` : 'Bộ sách: chưa cập nhật'}</span>
      <span class="split-toolbar__btns">
        <button type="button" class="chip chip--sm" data-ratio="book" aria-pressed="false">Ưu tiên ảnh sách</button>
        <button type="button" class="chip chip--sm" data-ratio="even" aria-pressed="true">Cân bằng</button>
        <button type="button" class="chip chip--sm" data-ratio="text" aria-pressed="false">Ưu tiên tóm tắt</button>
      </span>
    </div>
    <div class="book-split" data-ratio="even">
      <section class="book-split__text" aria-labelledby="sum-title"><h3 id="sum-title">Tóm tắt nhanh</h3>${summary}
        ${b.url && pages.length ? `<p><a href="${esc(b.url)}" target="_blank" rel="noopener">Mở sách điện tử ↗</a></p>` : ''}</section>
      <section class="book-split__image" aria-label="Trang sách giáo khoa">${imageSide}</section>
    </div>`;
  root.addEventListener('click', (ev) => {
    const r = ev.target.closest('[data-ratio]');
    if (r) {
      root.querySelector('.book-split').dataset.ratio = r.dataset.ratio;
      $$('[data-ratio]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === r)));
    }
    const pg = ev.target.closest('[data-page]');
    if (pg) {
      const p = pages[Number(pg.dataset.page)];
      const img = root.querySelector('.book-viewer img');
      img.src = p.image; img.alt = `Trang sách${p.page ? ` ${p.page}` : ''}: ${e.title}`;
      root.querySelector('.book-viewer__cap').textContent = pageCap(p);
      root.querySelector('.book-viewer__full').href = p.image;
      $$('[data-page]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === pg)));
    }
  });
}
const pageCap = (p) => [p.page ? `Trang ${p.page}` : '', p.caption].filter(Boolean).join(' — ') || 'Ảnh trang sách';

function relatedBlock(e) {
  const rel = relatedOf(e);
  if (!rel.length) return '';
  return `<section class="related" aria-labelledby="rel-title"><h3 id="rel-title">Bài cùng chủ đề: ${esc(e._chapterTitle)}</h3>
    <ul class="related__list">${rel.map((r) => `<li><a href="#bai/${encodeURIComponent(r.id)}">${esc(r.title)}${r.scoring ? ` <span class="badge badge--score">${svg('target', 12)} Chấm điểm</span>` : ''}</a></li>`).join('')}</ul></section>`;
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
  if (tab.id === 'huong-dan') {
    panel.innerHTML = panelGuide(ex);
    if (ex.scoring) {
      const { cameraTip } = await import('./practice.js');
      const tip = panel.querySelector('[data-camera-tip]');
      if (tip) tip.innerHTML = cameraTip(ex.scoring);
    }
  } else if (tab.id === 'video') panelVideo(ex, panel);
  else if (tab.id === 'sach') panelBook(ex, panel);
  else if (tab.id === 'tu-tap') {
    const { mountPractice } = await import('./practice.js');
    if (current?.tab === 'tu-tap') current.cleanup = mountPractice(panel, ex);
  }
  if (tab.id !== 'tu-tap') body.insertAdjacentHTML('beforeend', relatedBlock(ex));
  if (updateHash) history.replaceState(null, '', `#bai/${encodeURIComponent(ex.id)}${tab.id === 'huong-dan' ? '' : `/${tab.id}`}`);
}

function openLesson(id, tabId) {
  const ex = store.byId.get(id);
  if (!ex) { location.hash = ''; return; }
  if (current?.ex.id !== id) {
    current?.cleanup?.();
    current = { ex, tab: null, cleanup: null };
    const ch = store.chapters.get(ex.chapter);
    const part = ch && store.parts.get(ch.part);
    $('#lesson-crumbs').innerHTML = [`Lớp ${ex.grade}`, part?.title, ch?.title].filter(Boolean).map(esc).join(' <span aria-hidden="true">›</span> ');
    $('#lesson-title').textContent = ex.title;
    const tabs = TABS.filter((t) => !t.needs || t.needs(ex));
    const st = contentStatus(ex);
    $('#lesson-tabs').innerHTML = tabs.map((t) => {
      const waiting = (t.id === 'video' && !st.video) || (t.id === 'sach' && !st.book);
      return `<button type="button" role="tab" id="tab-${t.id}" data-tab="${t.id}" aria-controls="panel-${t.id}" aria-selected="false" tabindex="-1">${t.label}${waiting ? '<span class="tab-dot" title="Đang chờ cập nhật"><span class="visually-hidden"> (đang chờ cập nhật)</span></span>' : ''}</button>`;
    }).join('');
    $('#lesson-body').replaceChildren();
  }
  if (!dlg.open) { dlg.showModal(); document.body.classList.add('no-scroll'); }
  showTab(tabId || current.tab || 'huong-dan', { updateHash: false });
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
  $$('[data-nav]').forEach((a) => a.toggleAttribute('aria-current', teacher && a.dataset.nav === 'teacher'));
  if (teacher) {
    closeLesson({ fromRoute: true });
    const { renderTeacher } = await import('./teacher.js');
    renderTeacher($('#teacher-view'), h.split('/')[1] || null);
    document.title = 'Dành cho giáo viên — GDTC Trợ lý tập luyện';
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
    $('#results').innerHTML = '<div class="empty"><p>Không tải được danh sách bài tập. Em kiểm tra mạng rồi tải lại trang nhé.</p></div>';
    return;
  }
  $('#draft-banner').hidden = !store.hasDrafts;
  initHome();
  initDialog();
  window.addEventListener('hashchange', route);
  route();
}

main();
