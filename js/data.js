// Nạp dữ liệu: data/exercises.json + data/media.json (ảnh tự nhận theo thư mục) + bản nháp của cô trên máy này.
import { buildIndex, leadingNumber } from './search.js';

const DRAFT_KEY = 'gdtc-drafts-v1';

export const store = { raw: null, exercises: [], byId: new Map(), curriculum: [], chapters: new Map(), parts: new Map(), hasDrafts: false };

const safeStorage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};

export function readDrafts() {
  try { return JSON.parse(safeStorage.get(DRAFT_KEY) || '{}') || {}; } catch { return {}; }
}
export function writeDrafts(d) {
  if (!Object.keys(d).length) { safeStorage.del(DRAFT_KEY); return true; }
  return safeStorage.set(DRAFT_KEY, JSON.stringify(d));
}

/** Chuẩn hoá trường book: hỗ trợ cả dạng cũ {page, image} và dạng mới {pages: [...]}. */
export function normalizeBook(book) {
  const b = { series: null, pages: [], url: null, ...(book || {}) };
  if (!Array.isArray(b.pages)) b.pages = [];
  if (b.image && !b.pages.length) b.pages.push({ page: b.page ?? null, image: b.image, caption: '' });
  delete b.image; delete b.page;
  return b;
}

async function getJson(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export async function loadData() {
  const raw = await getJson('data/exercises.json');
  // media.json do GitHub Actions tự sinh khi deploy. Chạy thử trên máy có thể chưa có → bỏ qua.
  let media = {};
  try { media = await getJson('data/media.json'); } catch { /* chưa có ảnh nào */ }
  const drafts = readDrafts();
  store.raw = raw;
  store.curriculum = raw.curriculum || [];
  store.hasDrafts = Object.keys(drafts).length > 0;
  store.chapters.clear(); store.parts.clear();
  for (const g of store.curriculum) {
    for (const p of g.parts) {
      store.parts.set(p.id, { ...p, grade: g.grade, no: leadingNumber(p.title) });
      for (const c of p.chapters) store.chapters.set(c.id, { ...c, grade: g.grade, part: p.id, no: leadingNumber(c.title) });
    }
  }
  store.exercises = raw.exercises.map((src) => {
    const e = structuredClone(src);
    e.book = normalizeBook(e.book);
    e.youtube = (e.youtube || []).filter((v) => v && v.id);
    e.summary = e.summary || [];
    // Ảnh trang sách đặt theo quy ước thư mục media/sach/<id>/ (tự ánh xạ).
    const auto = media[e.id]?.book || [];
    const known = new Set(e.book.pages.map((p) => p.image));
    for (const m of auto) if (!known.has(m.image)) e.book.pages.push({ caption: '', ...m, auto: true });
    e.book.pages.sort((a, b) => (a.page ?? 999) - (b.page ?? 999));
    // Bản nháp của cô (chỉ trên máy này).
    const d = drafts[e.id];
    if (d) {
      e._draft = true;
      if (d.youtube) e.youtube = d.youtube;
      if (d.summary) e.summary = d.summary;
      if (d.book) {
        const autoPages = e.book.pages.filter((p) => p.auto);
        e.book = normalizeBook({ ...e.book, ...d.book });
        e.book.pages = [...d.book.pages || [], ...autoPages];
      }
    }
    const ch = store.chapters.get(e.chapter);
    const pt = ch && store.parts.get(ch.part);
    e._chapterTitle = ch?.title || 'Chưa xếp chủ đề';
    e._partTitle = pt?.title || '';
    e._chapterNo = ch?.no ?? null;
    e._partNo = pt?.no ?? null;
    return e;
  });
  store.exercises.sort((a, b) => a.grade - b.grade || orderOf(a) - orderOf(b));
  store.byId = new Map(store.exercises.map((e) => [e.id, e]));
  buildIndex(store.exercises);
  return store;
}

const chapterOrder = () => [...store.chapters.keys()];
function orderOf(e) {
  const i = chapterOrder().indexOf(e.chapter);
  return (i < 0 ? 999 : i) * 100 + (e.order ?? 50);
}

/** Tình trạng nội dung của một bài — dùng cho huy hiệu và "cửa sổ chờ". */
export const contentStatus = (e) => ({
  video: e.youtube.length > 0,
  book: e.book.pages.length > 0 || Boolean(e.book.url),
  summary: e.summary.length > 0,
  scoring: Boolean(e.scoring),
});

/** Bài liên quan: khai báo trong `related` + cùng chủ đề. */
export function relatedOf(e) {
  const ids = new Set([...(e.related || []), ...store.exercises.filter((o) => o.chapter === e.chapter).map((o) => o.id)]);
  ids.delete(e.id);
  return [...ids].map((id) => store.byId.get(id)).filter(Boolean);
}
