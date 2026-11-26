// Nhận ra trang đang mở TRONG một ứng dụng (Zalo, Facebook, Messenger…) thay vì trình duyệt thật.
// Trình duyệt nằm trong ứng dụng hay bị cắt bớt tính năng:
//   - Zalo trên Android dùng WebView, thường KHÔNG có bộ đọc giọng nói (trang web không tự bù được);
//   - camera cũng có thể bị chặn.
// Nên hiện băng nhắc kèm nút mở nhanh sang Chrome / Safari, và nút sao chép link.
import { esc } from './util.js';

const UA = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
const APPS = [
  [/Zalo/i, 'Zalo'],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, 'Facebook'],
  [/Messenger/i, 'Messenger'],
  [/Instagram/i, 'Instagram'],
  [/TikTok|musical_ly|BytedanceWebview/i, 'TikTok'],
  [/\bLine\//i, 'LINE'],
  [/MicroMessenger/i, 'WeChat'],
];

/** Tên ứng dụng đang chứa trang ('' nếu đang ở trình duyệt thật). */
export function inAppName() {
  for (const [re, name] of APPS) if (re.test(UA)) return name;
  return '';
}
export const isIOS = () => /iP(hone|ad|od)/.test(UA)
  || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/i.test(UA);

/**
 * Đường dẫn mở trang này bằng trình duyệt thật:
 * - Android: intent:// mở bằng Chrome (không có Chrome thì quay về link thường);
 * - iPhone (iOS 17 trở lên): x-safari-https:// mở bằng Safari.
 * Không phải ứng dụng nào cũng cho mở kiểu này, nên luôn kèm hướng dẫn bấm ba chấm.
 */
export function openInBrowserHref(url = location.href) {
  if (isAndroid()) {
    return `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;`
      + `S.browser_fallback_url=${encodeURIComponent(url)};end`;
  }
  if (isIOS()) return `x-safari-${url}`;
  return url;
}
const browserName = () => (isIOS() ? 'Safari' : 'Chrome');
const menuHint = () => (isIOS()
  ? 'bấm nút <b>⋯</b> (ba chấm) ở góc trên → chọn <b>mở bằng trình duyệt / Safari</b>'
  : 'bấm nút <b>⋮</b> (ba chấm) ở góc trên → chọn <b>mở bằng trình duyệt</b>');

/** Hai nút mở nhanh + sao chép link (dùng chung cho băng nhắc và dòng nhắc trong bài). */
function actionsHTML() {
  return `<span class="inapp__actions">
    <a class="btn btn--primary btn--small" href="${esc(openInBrowserHref())}" data-inapp="open" rel="noopener">Mở bằng ${browserName()}</a>
    <button type="button" class="btn btn--ghost btn--small" data-inapp="copy">Sao chép link</button>
  </span>`;
}

/** Nội dung dòng nhắc khi không đọc được (trong mục Video). */
export function voiceHelpHTML({ app = inAppName(), st = '' } = {}) {
  if (app) {
    return `<b>Đang mở trong ${esc(app)}:</b> ứng dụng này không có giọng đọc. Để nghe đọc nhịp, ${menuHint()}.
      ${actionsHTML()}`;
  }
  if (st === 'unsupported') return '<b>Trình duyệt này không có giọng đọc.</b> Em mở bằng Chrome (Android) hoặc Safari (iPhone) nhé.';
  return `<b>Máy chưa có giọng đọc tiếng Việt</b> nên chỉ hiện chữ.
    ${isIOS() ? 'Em mở bằng Safari.' : 'Android: vào Cài đặt, tìm mục <i>Chuyển văn bản thành giọng nói</i> và tải giọng Tiếng Việt.'}`;
}

/** Sao chép link trang (có dự phòng cho ứng dụng chặn bộ nhớ tạm). */
async function copyLink(btn) {
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    if (btn) { const old = btn.textContent; btn.textContent = 'Đã chép ✓'; setTimeout(() => { btn.textContent = old; }, 2000); }
  } catch {
    window.prompt('Chép link này rồi dán vào Chrome / Safari:', url);
  }
}

/** Băng nhắc ở đầu trang khi đang mở trong ứng dụng; nghe bấm cho mọi nút mở / sao chép. */
export function initInApp() {
  document.addEventListener('click', (e) => {
    const copy = e.target.closest('[data-inapp="copy"]');
    if (copy) { e.preventDefault(); copyLink(copy); return; }
    if (e.target.closest('[data-inapp="close"]')) {
      document.getElementById('inapp')?.setAttribute('hidden', '');
      try { sessionStorage.setItem('gdtc-inapp-closed', '1'); } catch { /* bỏ qua */ }
    }
  });
  const app = inAppName();
  const box = document.getElementById('inapp');
  if (!app || !box) return;
  try { if (sessionStorage.getItem('gdtc-inapp-closed')) return; } catch { /* bỏ qua */ }
  const why = isIOS()
    ? 'Giọng đọc cần chạm một lần mới chạy; nếu giọng đọc hoặc camera vẫn không chạy,'
    : `${esc(app)} trên Android thường không có giọng đọc, camera cũng có thể bị chặn.`;
  box.innerHTML = `<div class="container inapp__inner">
      <p class="inapp__text"><b>Em đang mở trong ${esc(app)}.</b> ${why}
        Mở bằng ${browserName()} để dùng đủ — hoặc ${menuHint()}.</p>
      ${actionsHTML()}
      <button type="button" class="inapp__close" data-inapp="close" aria-label="Đóng nhắc nhở">×</button>
    </div>`;
  box.hidden = false;
}
