// Tìm kiếm bài tập: bỏ dấu tiếng Việt, nhận "lớp 6", "chủ đề 2", "chương 2", "phần 1", bỏ từ thừa.

export function normalize(s = '') {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const STOP_PHRASES = [
  'huong dan', 'bai tap', 'em muon', 'cho em', 'muon hoc', 'muon tap', 'lam sao', 'nhu the nao',
  'the nao', 'cach tap', 'cach lam', 'xem', 'hoc', 'tap', 'bai', 'dong tac', 'ky thuat', 'ki thuat',
  'oi', 'a', 'voi', 'nhe', 'giup', 'gi', 'la', 'cua', 'mon', 'the duc', 'gdtc',
];
// Sắp xếp dài trước để "bai tap" bị bỏ trước "bai".
STOP_PHRASES.sort((a, b) => b.length - a.length);

/** Tách các bộ lọc ra khỏi câu hỏi. */
export function parseQuery(raw) {
  let q = ` ${normalize(raw)} `;
  const out = { grade: null, chapterNo: null, partNo: null, terms: [] };
  const take = (re, key) => {
    const m = q.match(re);
    if (m) { out[key] = Number(m[1]); q = q.replace(m[0], ' '); }
  };
  take(/\s(?:lop|khoi)\s*([6-9])\s/, 'grade');
  take(/\s(?:chu de|chuong|chude)\s*(\d{1,2})\s/, 'chapterNo');
  take(/\sphan\s*(\d{1,2})\s/, 'partNo');
  for (const p of STOP_PHRASES) q = q.replaceAll(` ${p} `, ' ').replaceAll(` ${p} `, ' ');
  out.terms = q.split(' ').filter((t) => t.length > 0);
  return out;
}

/** Lấy số thứ tự từ tiêu đề "Chủ đề 2. ..." / "Phần 1. ...". */
export const leadingNumber = (title) => {
  const m = normalize(title).match(/^(?:chu de|chuong|phan|bai)\s*(\d+)/);
  return m ? Number(m[1]) : null;
};

/** Chuẩn bị chuỗi tìm kiếm cho từng bài (gọi một lần sau khi nạp dữ liệu). */
export function buildIndex(exercises) {
  for (const e of exercises) {
    e._title = normalize(e.title);
    e._hay = normalize([e.title, e.topic, e.keywords, e._chapterTitle, e._partTitle,
      (e.summary || []).join(' '), (e.steps || []).join(' ')].join(' '));
  }
}

/** Trả về danh sách bài khớp, sắp theo điểm liên quan. */
export function search(exercises, raw, { grade = null, chapter = null } = {}) {
  const q = parseQuery(raw);
  const g = q.grade ?? grade;
  // Câu hỏi nêu lớp/chủ đề khác với nút lọc đang chọn → bỏ nút lọc chủ đề.
  if ((q.grade != null && q.grade !== grade) || q.chapterNo != null || q.partNo != null) chapter = null;
  let list = exercises.filter((e) => (g == null || e.grade === g)
    && (chapter == null || e.chapter === chapter)
    && (q.chapterNo == null || e._chapterNo === q.chapterNo)
    && (q.partNo == null || e._partNo === q.partNo));
  if (!q.terms.length) return { query: q, results: list };
  const scored = [];
  for (const e of list) {
    let s = 0;
    let hits = 0;
    for (const t of q.terms) {
      // Từ ngắn (≤ 2 chữ, ví dụ "rổ") phải khớp nguyên từ; từ dài hơn được khớp phần đầu ("bon" → "bong").
      const re = new RegExp(t.length <= 2 ? `(^|\\s)${t}(\\s|$)` : `(^|\\s)${t}`);
      if (re.test(e._title)) { s += 5; hits++; } else if (re.test(e._hay)) { s += 2; hits++; } else if (t.length >= 3 && e._hay.includes(t)) { s += 1; hits++; }
    }
    // Cụm nhiều từ khớp liền nhau trong tiêu đề → cộng thêm.
    if (q.terms.length > 1 && e._title.includes(q.terms.join(' '))) s += 6;
    if (hits) scored.push({ e, s: s + hits * 2, hits });
  }
  // Ưu tiên bài khớp đủ mọi từ; nếu không có (câu nói dài, lẫn từ thừa) thì nới lỏng còn một nửa số từ.
  let pool = scored.filter((x) => x.hits === q.terms.length);
  if (!pool.length) pool = scored.filter((x) => x.hits >= Math.ceil(q.terms.length / 2));
  pool.sort((a, b) => b.s - a.s);
  return { query: q, results: pool.map((x) => x.e) };
}
