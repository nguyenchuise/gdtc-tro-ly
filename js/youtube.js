// Video YouTube: nhận link bất kỳ → ID; nhúng kiểu "bấm mới tải" (nhẹ trang, không cookie theo dõi).

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Nhận link YouTube (watch, youtu.be, shorts, embed, live) hoặc ID 11 ký tự. Trả về { id, start } hoặc null. */
export function parseYouTube(input) {
  const s = String(input || '').trim();
  if (!s) return null;
  if (ID_RE.test(s)) return { id: s, start: 0 };
  let url;
  try { url = new URL(s.startsWith('http') ? s : `https://${s}`); } catch { return null; }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    id = url.searchParams.get('v');
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
    if (!id && m) id = m[1];
  }
  if (!id || !ID_RE.test(id)) return null;
  const t = url.searchParams.get('t') || url.searchParams.get('start') || '0';
  return { id, start: parseTime(t) };
}

/** "90", "1m30s", "1h2m3s" → giây. */
export function parseTime(t) {
  if (/^\d+$/.test(t)) return Number(t);
  const m = String(t).match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : 0;
}

export const watchUrl = (v) => `https://www.youtube.com/watch?v=${v.id}${v.start ? `&t=${v.start}s` : ''}`;
export const searchUrl = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const thumbUrl = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Tạo khung video: hiện ảnh bìa + nút Play; bấm vào mới nạp iframe youtube-nocookie. */
export function videoFacade(v, { autoplay = true } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'video-frame';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'video-facade';
  btn.setAttribute('aria-label', `Phát video: ${v.title || 'Video hướng dẫn'}`);
  btn.innerHTML = `<img src="${thumbUrl(v.id)}" alt="" loading="lazy" decoding="async" width="480" height="360">
    <span class="play-icon" aria-hidden="true"><svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7A8.5 8.5 0 0 0 1.5 7.7C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#e00"/><path d="M45 24 27 14v20z" fill="#fff"/></svg></span>`;
  btn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('gdtc:video')); // tạm dừng nhạc nền khi em xem video
    const iframe = document.createElement('iframe');
    const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
    if (autoplay) params.set('autoplay', '1');
    if (v.start) params.set('start', String(v.start));
    iframe.src = `https://www.youtube-nocookie.com/embed/${v.id}?${params}`;
    iframe.title = v.title || 'Video hướng dẫn';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    btn.replaceWith(iframe);
    iframe.focus();
  }, { once: true });
  wrap.append(btn);
  return wrap;
}
