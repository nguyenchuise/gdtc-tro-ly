// Trang "Dành cho giáo viên": xem tình trạng nội dung, cập nhật video / trang sách / tóm tắt,
// xem thử trên máy, rồi đăng thẳng lên GitHub (hoặc tải file về để tự tải lên).
import { store, contentStatus, readDrafts, writeDrafts } from './data.js';
import { parseYouTube, thumbUrl } from './youtube.js';
import { esc, $, $$, toast } from './util.js';
import { lockTeacher } from './teacher-gate.js';

const GH_KEY = 'gdtc-github-v1';
const MAX_IMG = 1600;

// ---------------------------------------------------------------- Kết nối GitHub
function guessRepo() {
  const host = location.hostname;
  const m = host.match(/^([^.]+)\.github\.io$/);
  const repo = location.pathname.split('/').filter(Boolean)[0];
  return { owner: m ? m[1] : '', repo: m && repo ? repo : 'gdtc-tro-ly', branch: 'main' };
}
function loadConn() {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(GH_KEY) || localStorage.getItem(GH_KEY) || 'null'); } catch { /* trống */ }
  return { ...guessRepo(), token: '', remember: false, ...(saved || {}) };
}
function saveConn(c) {
  try {
    sessionStorage.removeItem(GH_KEY); localStorage.removeItem(GH_KEY);
    (c.remember ? localStorage : sessionStorage).setItem(GH_KEY, JSON.stringify(c));
  } catch { /* trình duyệt chặn lưu trữ */ }
}

async function gh(conn, path, init = {}) {
  const r = await fetch(`https://api.github.com/repos/${conn.owner}/${conn.repo}/${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${conn.token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!r.ok) {
    const msg = {
      401: 'Mã truy cập (token) không đúng hoặc đã hết hạn.',
      403: 'Token chưa có quyền ghi (Contents: Read and write) vào kho này.',
      404: 'Không tìm thấy kho/nhánh/tệp. Kiểm tra lại tên tài khoản, tên kho và nhánh.',
      409: 'Dữ liệu vừa được người khác sửa. Hãy bấm đăng lại.',
      422: 'GitHub từ chối dữ liệu (tệp quá lớn hoặc sai định dạng).',
    }[r.status] || `GitHub báo lỗi ${r.status}.`;
    const err = new Error(msg); err.status = r.status; throw err;
  }
  return r.json();
}
const b64encode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

// ---------------------------------------------------------------- Ảnh: nén trên máy trước khi lưu/đăng
async function compressImage(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMG / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c.toDataURL('image/jpeg', 0.82);
}
const slugPage = (p, i) => `trang-${p.page || `anh${i + 1}`}-${Date.now().toString(36)}${i}`;

// ---------------------------------------------------------------- Trạng thái trình soạn
let ed = null; // { id, youtubeText, summaryText, series, url, pages: [{page, image, caption}] }

function editorFromExercise(id) {
  const e = store.byId.get(id);
  const draft = readDrafts()[id];
  const src = draft || e;
  const book = src.book || e.book;
  return {
    id,
    youtubeText: (src.youtube || []).map((v) => `https://youtu.be/${v.id}${v.start ? `?t=${v.start}` : ''}${v.title ? ` | ${v.title}` : ''}`).join('\n'),
    summaryText: (src.summary || []).join('\n'),
    series: book.series || '',
    url: book.url || '',
    pages: (book.pages || []).filter((p) => !p.auto).map((p) => ({ ...p })),
    autoPages: e.book.pages.filter((p) => p.auto),
    hasDraft: Boolean(draft),
  };
}

function parseVideos(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const [link, ...rest] = line.split('|');
    const v = parseYouTube(link);
    return v ? { id: v.id, start: v.start, title: rest.join('|').trim() || 'Video hướng dẫn', ok: true } : { ok: false, line };
  });
}

function editorPayload() {
  const videos = parseVideos(ed.youtubeText).filter((v) => v.ok).map(({ id, start, title }) => ({ id, title, start }));
  return {
    youtube: videos,
    summary: ed.summaryText.split('\n').map((s) => s.replace(/^[-•*\s]+/, '').trim()).filter(Boolean),
    book: {
      series: ed.series.trim() || null,
      url: ed.url.trim() || null,
      pages: ed.pages.map((p) => ({ page: p.page ? Number(p.page) : null, image: p.image, caption: (p.caption || '').trim() })),
    },
  };
}

// ---------------------------------------------------------------- Giao diện
export function renderTeacher(root, editId) {
  const conn = loadConn();
  const ex = store.exercises;
  const counts = ex.reduce((a, e) => { const s = contentStatus(e); for (const k in s) a[k] += s[k] ? 1 : 0; return a; }, { video: 0, book: 0, summary: 0, scoring: 0 });
  const drafts = readDrafts();
  const startId = (editId && store.byId.has(editId) && editId) || ed?.id || ex[0]?.id;

  root.innerHTML = `
    <div class="teacher-head">
      <h1 id="teacher-title">Trang giáo viên</h1>
      <button type="button" class="btn btn--ghost btn--small" id="lock-teacher">Khoá lại</button>
    </div>
    <p class="lead">Chọn bài → dán link video, chụp trang sách, viết ý chính → Xem thử → Đăng.</p>
    <nav class="teacher-toc" aria-label="Mục lục trang giáo viên">
      <a href="#tv-status">1. Tình trạng nội dung</a><a href="#tv-editor">2. Cập nhật một bài</a>
      <a href="#tv-github">3. Kết nối GitHub</a><a href="#tv-folder">4. Cách khác</a><a href="#tv-phase2">5. Sắp có</a>
    </nav>

    ${Object.keys(drafts).length ? `<div class="notice notice--draft"><strong>Bản nháp trên máy này:</strong> ${Object.keys(drafts).map((id) => `<a href="#giao-vien/${encodeURIComponent(id)}">${esc(store.byId.get(id)?.title || id)}</a>`).join(', ')}.
      Học sinh chỉ thấy sau khi thầy cô bấm <em>Đăng lên GitHub</em>.</div>` : ''}

    <section class="card-section" id="tv-status" aria-labelledby="tv-status-h">
      <h2 id="tv-status-h">1. Tình trạng nội dung</h2>
      <div class="stats stats--inline">
        <div class="stat"><span class="stat__value">${counts.video}/${ex.length}</span><span class="stat__label">bài có video</span></div>
        <div class="stat"><span class="stat__value">${counts.book}/${ex.length}</span><span class="stat__label">bài có trang sách</span></div>
        <div class="stat"><span class="stat__value">${counts.summary}/${ex.length}</span><span class="stat__label">bài có tóm tắt</span></div>
        <div class="stat"><span class="stat__value">${counts.scoring}/${ex.length}</span><span class="stat__label">bài chấm bằng camera</span></div>
      </div>
      <p class="muted small">Ô “Chờ” nghĩa là học sinh đang thấy <em>cửa sổ chờ</em> (“Thầy cô đang chuẩn bị…”) ở mục đó.</p>
      <div class="table-wrap"><table class="status-table">
        <caption class="visually-hidden">Tình trạng nội dung từng bài</caption>
        <thead><tr><th scope="col">Bài</th><th scope="col">Video</th><th scope="col">Sách</th><th scope="col">Tóm tắt</th><th scope="col">Chấm điểm</th><th scope="col"><span class="visually-hidden">Thao tác</span></th></tr></thead>
        <tbody>${store.curriculum.map((g) => `<tr class="group-row"><th colspan="6" scope="rowgroup">Lớp ${g.grade}</th></tr>`
          + ex.filter((e) => e.grade === g.grade).map((e) => {
            const s = contentStatus(e);
            const cell = (ok) => ok ? '<td><span class="pill pill--ok">Có</span></td>' : '<td><span class="pill pill--wait">Chờ</span></td>';
            return `<tr><th scope="row"><span class="muted small">${esc(e._chapterTitle)}</span><br>${esc(e.title)}${e._draft ? ' <span class="badge badge--draft">Nháp</span>' : ''}</th>
              ${cell(s.video)}${cell(s.book)}${cell(s.summary)}<td>${s.scoring ? 'Có' : '—'}</td>
              <td><a class="btn btn--small btn--ghost" href="#giao-vien/${encodeURIComponent(e.id)}" data-edit="${e.id}">Cập nhật</a></td></tr>`;
          }).join('')).join('')}</tbody>
      </table></div>
    </section>

    <section class="card-section" id="tv-editor" aria-labelledby="tv-editor-h">
      <h2 id="tv-editor-h">2. Cập nhật nội dung một bài</h2>
      <div class="field">
        <label for="ed-lesson">Chọn bài</label>
        <select id="ed-lesson">${store.curriculum.map((g) => g.parts.map((p) => p.chapters.map((c) => {
          const items = ex.filter((e) => e.chapter === c.id);
          return items.length ? `<optgroup label="Lớp ${g.grade} · ${esc(c.title)}">${items.map((e) => `<option value="${e.id}">${esc(e.title)}</option>`).join('')}</optgroup>` : '';
        }).join('')).join('')).join('')}</select>
      </div>
      <div id="ed-form"></div>
    </section>

    <section class="card-section" id="tv-github" aria-labelledby="tv-github-h">
      <h2 id="tv-github-h">3. Kết nối GitHub (làm một lần)</h2>
      <p>Để nút <strong>Đăng lên GitHub</strong> hoạt động, thầy cô cần một <em>mã truy cập</em> (token) chỉ có quyền sửa kho này:</p>
      <ol class="howto">
        <li>Đăng nhập GitHub → mở <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Tạo fine-grained token ↗</a>.</li>
        <li>Token name: <code>gdtc-giao-vien</code>. Expiration: 90 ngày (hết hạn thì tạo lại).</li>
        <li>Repository access: <strong>Only select repositories</strong> → chọn <code>${esc(conn.repo || 'gdtc-tro-ly')}</code>.</li>
        <li>Permissions → Repository permissions → <strong>Contents: Read and write</strong>. Bấm <em>Generate token</em>, sao chép mã.</li>
        <li>Dán vào ô bên dưới, bấm <em>Kiểm tra kết nối</em>.</li>
      </ol>
      <form id="gh-form" class="form-grid">
        <div class="field"><label for="gh-owner">Tài khoản GitHub</label><input id="gh-owner" value="${esc(conn.owner)}" autocomplete="off" required placeholder="vd: thaonguyen"></div>
        <div class="field"><label for="gh-repo">Tên kho</label><input id="gh-repo" value="${esc(conn.repo)}" autocomplete="off" required></div>
        <div class="field"><label for="gh-branch">Nhánh</label><input id="gh-branch" value="${esc(conn.branch)}" autocomplete="off" required></div>
        <div class="field field--wide"><label for="gh-token">Token</label><input id="gh-token" type="password" value="${esc(conn.token)}" autocomplete="off" placeholder="github_pat_…"></div>
        <label class="check field--wide"><input type="checkbox" id="gh-remember" ${conn.remember ? 'checked' : ''}> Nhớ token trên máy này (chỉ chọn trên máy riêng của thầy cô, <strong>không</strong> chọn trên máy dùng chung)</label>
        <div class="actions field--wide"><button class="btn btn--primary" type="submit">Lưu và kiểm tra kết nối</button>
          <button class="btn btn--ghost" type="button" id="gh-forget">Xoá token khỏi máy này</button></div>
        <p class="status field--wide" id="gh-status" role="status" aria-live="polite"></p>
      </form>
      <p class="muted small">Token chỉ lưu trong trình duyệt của thầy cô và chỉ gửi tới api.github.com. Không bao giờ đưa token vào mã nguồn hay gửi cho học sinh.</p>
    </section>

    <section class="card-section" id="tv-folder" aria-labelledby="tv-folder-h">
      <h2 id="tv-folder-h">4. Cách khác (không cần token)</h2>
      <h3>a) Kéo thả ảnh trang sách vào đúng thư mục — tự ánh xạ</h3>
      <p>Mỗi bài có một thư mục riêng <code>media/sach/&lt;mã-bài&gt;/</code>. Ảnh nào đặt vào đó sẽ <strong>tự hiện</strong> ở tab “Sách giáo khoa” của bài sau khi trang cập nhật (1–2 phút). Đặt tên ảnh có số trang để tự sắp xếp, ví dụ <code>trang-12.jpg</code>, <code>trang-13.jpg</code>.</p>
      <p id="folder-hint"></p>
      <h3>b) Sửa trực tiếp tệp dữ liệu</h3>
      <p>Toàn bộ nội dung nằm trong <code>data/exercises.json</code>. Mở <a id="edit-json-link" target="_blank" rel="noopener">trình sửa tệp trên GitHub ↗</a>, tìm bài theo <code>"id"</code>, sửa rồi bấm <em>Commit changes</em>. Nếu tệp bị sai cú pháp, GitHub Actions sẽ báo lỗi và <strong>trang cũ vẫn giữ nguyên</strong> (không hỏng trang của học sinh).</p>
      <details><summary>Xem ví dụ một bài trong <code>exercises.json</code></summary>
<pre><code>{
  "id": "g6-dang-tay",
  "grade": 6,
  "chapter": "g6-c1",
  "title": "Đứng thẳng, hai tay dang ngang",
  "youtube": [
    { "id": "MÃ_11_KÝ_TỰ", "title": "Video của cô", "start": 0 }
  ],
  "summary": ["Tay ngang vai.", "Khuỷu tay thẳng.", "Giữ 2 giây."],
  "book": {
    "series": "Kết nối tri thức",
    "url": null,
    "pages": [ { "page": 12, "image": "media/sach/g6-dang-tay/trang-12.jpg", "caption": "" } ]
  },
  "scoring": {
    "mode": "hold", "holdSeconds": 2, "camera": "front",
    "rules": [
      { "label": "Tay trái ngang vai", "joints": [23, 11, 13], "target": 90, "tolerance": 12, "range": 40 }
    ]
  }
}</code></pre>
      <p class="small">Mã video là 11 ký tự sau <code>youtu.be/</code> hoặc sau <code>watch?v=</code>. Số khớp: 11/12 vai, 13/14 khuỷu, 15/16 cổ tay, 23/24 hông, 25/26 gối, 27/28 cổ chân (số lẻ = bên trái của học sinh). Góc đo tại khớp ở giữa. Chi tiết xem README.</p>
      </details>
      <h3>c) Video riêng của thầy cô</h3>
      <p>Tải video lên YouTube ở chế độ <strong>Không công khai (Unlisted)</strong>, rồi dán link vào mục 2. Không nên tải video trực tiếp lên GitHub (giới hạn dung lượng, trang chậm).</p>
    </section>

    <section class="card-section" id="tv-phase2" aria-labelledby="tv-phase2-h">
      <h2 id="tv-phase2-h">5. Sắp có (Phase 2)</h2>
      <ul>
        <li><strong>Quay video mẫu → tự sinh góc mục tiêu:</strong> thầy cô làm mẫu trước camera, hệ thống đo góc và gợi ý phần <code>scoring</code>.</li>
        <li><strong>Hỏi đáp AI tự do:</strong> chỉ gọi qua máy chủ trung gian (Cloudflare Worker) giữ khoá bí mật; không gửi ảnh/video học sinh.</li>
        <li><strong>Đăng nhập theo lớp, lưu điểm:</strong> cần nhà trường đồng ý và sự đồng ý của phụ huynh theo Luật Bảo vệ dữ liệu cá nhân 2025.</li>
      </ul>
    </section>`;

  $('#lock-teacher', root).addEventListener('click', () => { lockTeacher(); location.hash = ''; });
  const sel = $('#ed-lesson', root);
  sel.value = startId;
  const open = (id) => { ed = editorFromExercise(id); renderEditor(root, conn); };
  sel.addEventListener('change', () => { history.replaceState(null, '', `#giao-vien/${sel.value}`); open(sel.value); });
  if (!ed || ed.id !== startId) open(startId); else renderEditor(root, conn);
  if (editId) requestAnimationFrame(() => $('#tv-editor', root).scrollIntoView({ block: 'start' }));

  // Kết nối GitHub
  $('#gh-form', root).addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Object.assign(conn, readConnForm(root));
    saveConn(conn);
    const st = $('#gh-status', root);
    if (!conn.token) { st.textContent = 'Đã lưu. Chưa có token nên chỉ dùng được cách tải tệp về.'; return; }
    st.textContent = 'Đang kiểm tra…';
    try {
      const info = await gh(conn, '');
      if (!info.permissions?.push) throw new Error('Token đọc được kho nhưng chưa có quyền ghi (Contents: Read and write).');
      await gh(conn, `branches/${encodeURIComponent(conn.branch)}`);
      st.textContent = `Kết nối tốt: ${info.full_name} (nhánh ${conn.branch}). Thầy cô đã có thể bấm “Đăng lên GitHub”.`;
    } catch (err) { st.textContent = `Chưa kết nối được: ${err.message}`; }
    renderFolderHint(root, conn);
  });
  $('#gh-forget', root).addEventListener('click', () => {
    conn.token = ''; conn.remember = false; saveConn(conn);
    $('#gh-token', root).value = ''; $('#gh-remember', root).checked = false;
    $('#gh-status', root).textContent = 'Đã xoá token khỏi máy này.';
  });
  renderFolderHint(root, conn);
}

function readConnForm(root) {
  return {
    owner: $('#gh-owner', root).value.trim(), repo: $('#gh-repo', root).value.trim(), branch: $('#gh-branch', root).value.trim() || 'main',
    token: $('#gh-token', root).value.trim(), remember: $('#gh-remember', root).checked,
  };
}

function renderFolderHint(root, conn) {
  const id = ed?.id;
  const folder = `media/sach/${id}`;
  const base = conn.owner ? `https://github.com/${conn.owner}/${conn.repo}` : null;
  $('#folder-hint', root).innerHTML = `Thư mục của bài đang chọn: <code>${esc(folder)}/</code>
    ${base ? ` — <a href="${base}/upload/${enc(conn.branch)}/${enc(folder)}" target="_blank" rel="noopener">Mở trang tải ảnh vào thư mục này ↗</a>` : ' (điền tài khoản GitHub ở mục 3 để có link tải ảnh nhanh)'}`;
  const link = $('#edit-json-link', root);
  if (base) link.href = `${base}/edit/${enc(conn.branch)}/data/exercises.json`; else link.removeAttribute('href');
}

function renderEditor(root, conn) {
  const form = $('#ed-form', root);
  const e = store.byId.get(ed.id);
  form.innerHTML = `
    ${ed.hasDraft ? '<p class="notice notice--draft">Bài này đang có <strong>bản nháp</strong> trên máy này (chưa đăng).</p>' : ''}
    <p class="muted small">Mã bài: <code>${esc(ed.id)}</code> · Lớp ${e.grade} · ${esc(e._partTitle)} › ${esc(e._chapterTitle)}
      · <a href="#bai/${encodeURIComponent(ed.id)}">Mở bài này ↗</a></p>

    <fieldset><legend>Video YouTube</legend>
      <label for="ed-yt">Dán link YouTube, mỗi dòng một video. Muốn đặt tên thì thêm <code>| tên video</code> ở cuối dòng.</label>
      <textarea id="ed-yt" rows="3" placeholder="https://youtu.be/xxxxxxxxxxx | Video của cô&#10;https://www.youtube.com/watch?v=xxxxxxxxxxx&amp;t=30s">${esc(ed.youtubeText)}</textarea>
      <ul class="yt-preview" id="ed-yt-preview" aria-live="polite"></ul>
    </fieldset>

    <fieldset><legend>Tóm tắt nhanh (hiện cạnh ảnh trang sách)</legend>
      <label for="ed-sum">Mỗi dòng một ý ngắn — dành cho học sinh “lười đọc sách”. Nên 3–5 ý.</label>
      <textarea id="ed-sum" rows="4">${esc(ed.summaryText)}</textarea>
    </fieldset>

    <fieldset><legend>Trang sách giáo khoa</legend>
      <div class="form-grid">
        <div class="field"><label for="ed-series">Bộ sách</label><input id="ed-series" list="series-list" value="${esc(ed.series)}" placeholder="vd: Kết nối tri thức">
          <datalist id="series-list"><option value="Kết nối tri thức với cuộc sống"><option value="Cánh diều"><option value="Chân trời sáng tạo"></datalist></div>
        <div class="field"><label for="ed-url">Link sách điện tử (nếu có)</label><input id="ed-url" type="url" value="${esc(ed.url)}" placeholder="https://…"></div>
      </div>
      <div class="pages-editor" id="ed-pages"></div>
      <label class="btn btn--ghost">Thêm ảnh trang sách (chụp hoặc chọn)
        <input type="file" id="ed-img" accept="image/*" multiple class="visually-hidden"></label>
      <p class="muted small">Ảnh được thu nhỏ còn tối đa ${MAX_IMG}px ngay trên máy trước khi lưu. Chỉ chụp phần trang sách liên quan đến bài, dùng để học tập trong lớp.</p>
    </fieldset>

    <div class="actions editor-actions">
      <button type="button" class="btn btn--ghost" data-ed="preview">Xem thử trên máy này</button>
      <button type="button" class="btn btn--primary" data-ed="publish">Đăng lên GitHub</button>
      <button type="button" class="btn btn--ghost" data-ed="download">Tải tệp về (không cần token)</button>
      ${ed.hasDraft ? '<button type="button" class="btn btn--ghost btn--danger-text" data-ed="discard">Bỏ bản nháp</button>' : ''}
    </div>
    <p class="status" id="ed-status" role="status" aria-live="polite"></p>`;

  const ytInput = $('#ed-yt', form);
  const renderYt = () => {
    ed.youtubeText = ytInput.value;
    const vids = parseVideos(ed.youtubeText);
    $('#ed-yt-preview', form).innerHTML = vids.map((v) => v.ok
      ? `<li class="yt-ok"><img src="${thumbUrl(v.id)}" alt="" width="96" height="72" loading="lazy"><span><strong>${esc(v.title)}</strong><br><code>${v.id}</code>${v.start ? ` · bắt đầu ${v.start}s` : ''}</span></li>`
      : `<li class="yt-bad">Không nhận ra link: <code>${esc(v.line)}</code></li>`).join('');
  };
  ytInput.addEventListener('input', renderYt);
  renderYt();
  $('#ed-sum', form).addEventListener('input', (ev) => { ed.summaryText = ev.target.value; });
  $('#ed-series', form).addEventListener('input', (ev) => { ed.series = ev.target.value; });
  $('#ed-url', form).addEventListener('input', (ev) => { ed.url = ev.target.value; });
  renderPages(form);

  $('#ed-img', form).addEventListener('change', async (ev) => {
    const files = [...ev.target.files];
    ev.target.value = '';
    const st = $('#ed-status', form);
    for (const f of files) {
      st.textContent = `Đang xử lý ảnh ${f.name}…`;
      try {
        const guess = f.name.match(/(\d{1,3})/);
        ed.pages.push({ page: guess ? Number(guess[1]) : null, image: await compressImage(f), caption: '' });
      } catch { st.textContent = `Không đọc được ảnh ${f.name}. Thầy cô thử ảnh JPG hoặc PNG.`; }
    }
    if (files.length) st.textContent = `Đã thêm ${files.length} ảnh. Nhớ điền số trang rồi bấm Xem thử hoặc Đăng.`;
    renderPages(form);
  });

  form.querySelector('.actions').addEventListener('click', (ev) => {
    const act = ev.target.closest('[data-ed]')?.dataset.ed;
    if (act === 'preview') preview();
    else if (act === 'publish') publish(form, conn, root);
    else if (act === 'download') download(form);
    else if (act === 'discard') {
      const d = readDrafts(); delete d[ed.id]; writeDrafts(d);
      toast('Đã bỏ bản nháp.'); location.reload();
    }
  });
  renderFolderHint(root, conn);
}

function renderPages(form) {
  const box = $('#ed-pages', form);
  const auto = ed.autoPages.map((p) => `<div class="page-item page-item--auto">
      <img src="${esc(p.image)}" alt="" width="72" height="96" loading="lazy">
      <span class="small">${p.page ? `Trang ${p.page}` : 'Ảnh'} — lấy tự động từ thư mục <code>media/sach/${esc(ed.id)}/</code> (xoá trên GitHub nếu cần)</span></div>`).join('');
  box.innerHTML = auto + ed.pages.map((p, i) => `<div class="page-item">
      <img src="${esc(p.image)}" alt="Ảnh trang sách ${i + 1}" width="72" height="96">
      <div class="field"><label for="pg-${i}">Số trang</label><input id="pg-${i}" type="number" inputmode="numeric" min="1" max="300" value="${p.page ?? ''}" data-pg="${i}" data-k="page"></div>
      <div class="field"><label for="cap-${i}">Ghi chú (tuỳ chọn)</label><input id="cap-${i}" value="${esc(p.caption || '')}" data-pg="${i}" data-k="caption"></div>
      <button type="button" class="btn btn--small btn--ghost" data-rm="${i}" aria-label="Xoá ảnh ${i + 1}">Xoá</button>
    </div>`).join('') || (auto ? '' : '<p class="muted small">Chưa có ảnh trang sách.</p>');
  box.oninput = (ev) => { const i = ev.target.dataset.pg; if (i != null) ed.pages[i][ev.target.dataset.k] = ev.target.value; };
  box.onclick = (ev) => { const i = ev.target.closest('[data-rm]')?.dataset.rm; if (i != null) { ed.pages.splice(Number(i), 1); renderPages(form); } };
}

function preview() {
  const d = readDrafts();
  d[ed.id] = { ...editorPayload(), updatedAt: new Date().toISOString() };
  if (!writeDrafts(d)) { toast('Bộ nhớ trình duyệt đã đầy. Hãy bớt ảnh hoặc đăng bản nháp khác trước.'); return; }
  location.hash = `bai/${ed.id}/sach`;
  location.reload();
}

/** Ghép thay đổi của bài vào dữ liệu gốc; ảnh mới (data:) được đặt tên tệp trong media/sach/<id>/. */
function mergeInto(raw, payload, imagePaths) {
  const target = raw.exercises.find((x) => x.id === ed.id);
  if (!target) throw new Error(`Không tìm thấy bài ${ed.id} trong exercises.json.`);
  target.youtube = payload.youtube;
  target.summary = payload.summary;
  target.summaryReviewed = true; // tóm tắt do thầy cô viết → bỏ nhãn "mẫu demo" ở tab Sách
  target.book = { ...payload.book, pages: payload.book.pages.map((p, i) => ({ ...p, image: imagePaths[i] || p.image })) };
  return `${JSON.stringify(raw, null, 2)}\n`;
}

async function publish(form, conn, root) {
  Object.assign(conn, readConnForm(root));
  const st = $('#ed-status', form);
  if (!conn.owner || !conn.token) {
    st.innerHTML = 'Chưa kết nối GitHub. Thầy cô điền mục <a href="#tv-github">3. Kết nối GitHub</a>, hoặc dùng nút “Tải tệp về”.';
    return;
  }
  const btns = $$('[data-ed]', form); btns.forEach((b) => { b.disabled = true; });
  try {
    const payload = editorPayload();
    const paths = [];
    for (const [i, p] of payload.book.pages.entries()) {
      if (!p.image.startsWith('data:')) continue;
      const path = `media/sach/${ed.id}/${slugPage(p, i)}.jpg`;
      st.textContent = `Đang tải ảnh ${i + 1}/${payload.book.pages.length} lên GitHub…`;
      await gh(conn, `contents/${enc(path)}`, { method: 'PUT', body: JSON.stringify({ message: `Thêm ảnh trang sách cho bài ${ed.id}`, content: p.image.split(',')[1], branch: conn.branch }) });
      paths[i] = path;
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      st.textContent = 'Đang cập nhật dữ liệu bài tập…';
      const file = await gh(conn, `contents/data/exercises.json?ref=${encodeURIComponent(conn.branch)}`);
      const text = mergeInto(JSON.parse(b64decode(file.content)), payload, paths);
      try {
        await gh(conn, 'contents/data/exercises.json', { method: 'PUT', body: JSON.stringify({
          message: `Cập nhật nội dung bài ${ed.id} (từ trang giáo viên)`, content: b64encode(text), sha: file.sha, branch: conn.branch }) });
        break;
      } catch (err) { if (err.status !== 409 || attempt) throw err; }
    }
    const d = readDrafts(); delete d[ed.id]; writeDrafts(d);
    st.innerHTML = `Đã đăng! Trang của học sinh sẽ cập nhật sau khoảng 1–2 phút
      (<a href="https://github.com/${esc(conn.owner)}/${esc(conn.repo)}/actions" target="_blank" rel="noopener">xem tiến trình ↗</a>). Tải lại trang sau đó để thấy nội dung mới.`;
  } catch (err) {
    st.textContent = `Chưa đăng được: ${err.message} Bản nháp vẫn được giữ nếu thầy cô đã bấm “Xem thử”.`;
  } finally { btns.forEach((b) => { b.disabled = false; }); }
}

async function download(form) {
  const st = $('#ed-status', form);
  try {
    const payload = editorPayload();
    const paths = [];
    const imgs = [];
    payload.book.pages.forEach((p, i) => {
      if (!p.image.startsWith('data:')) return;
      const name = `${slugPage(p, i)}.jpg`;
      paths[i] = `media/sach/${ed.id}/${name}`;
      imgs.push({ name, data: p.image });
    });
    const r = await fetch('data/exercises.json', { cache: 'no-cache' });
    const text = mergeInto(await r.json(), payload, paths);
    save(new Blob([text], { type: 'application/json' }), 'exercises.json');
    for (const im of imgs) save(im.data, im.name);
    st.innerHTML = `Đã tải về <code>exercises.json</code>${imgs.length ? ` và ${imgs.length} ảnh` : ''}. Trên GitHub:
      ${imgs.length ? `(1) tải các ảnh vào thư mục <code>media/sach/${esc(ed.id)}/</code>; ` : ''}(${imgs.length ? 2 : 1}) tải <code>exercises.json</code> vào thư mục <code>data/</code> (ghi đè), rồi bấm <em>Commit changes</em>.`;
  } catch (err) { st.textContent = `Không tạo được tệp: ${err.message}`; }
}

function save(blobOrUrl, name) {
  const a = document.createElement('a');
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(url), 2000);
}
