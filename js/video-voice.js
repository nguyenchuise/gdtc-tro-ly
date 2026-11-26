// Giọng đọc cho mục 2. Video: đọc tên nhịp và câu hướng dẫn mỗi khi đổi nhịp.
// Đọc xong mới sang nhịp sau, để em nghe kịp (giọng chạy nhanh 1,2× cho đỡ lê thê).
// Dùng chung công tắc 🔊 với mục 4. Tự tập (cùng khoá lưu trong js/speak.js).
//
// iPhone chỉ cho đọc sau một cú chạm (xem js/speak.js). Nếu em mở thẳng link mà chưa chạm gì,
// nút hiện "Chạm để nghe đọc": chạm vào là mở khoá và đọc ngay nhịp đang hiện.
import {
  say, stopVoice, voicePref, setVoicePref, speechSupported, unlockVoice, voiceUnlocked, justUnlocked, voiceStatus, speechMs,
} from './speak.js';
import { inAppName, voiceHelpHTML } from './inapp.js';

const RATE = 1.2;
const strip = (s) => String(s || '').replace(/^[a-z]\d?\)\s*/i, '').trim();

/** Tách một nhịp thành: tên động tác, tên nhịp, câu mô tả. */
function pieces(pose = {}) {
  return {
    group: strip(pose.group),
    code: strip(pose.code),
    caption: strip(pose.caption).replace(/^(TTCB|Nhịp\s*\d+)[.:]?\s*/i, '') || strip(pose.title),
  };
}

/**
 * Câu đọc cho một nhịp: "Động tác … . Nhịp 3. Hai tay dang ngang."
 * Tên động tác và câu mô tả giống hệt nhịp trước thì bỏ, chỉ đọc tên nhịp — nghe đỡ lặp.
 */
export function beatSpeech(pose = {}, prev = {}) {
  const p = pieces(pose);
  return [
    p.group && p.group !== prev.group ? p.group : '',
    p.code,
    p.caption && p.caption !== prev.caption ? p.caption : '',
  ].filter(Boolean).join('. ');
}

function label() {
  if (!voicePref()) return '🔇 Đọc nhịp';
  return voiceUnlocked() ? '🔊 Đọc nhịp' : '🔊 Chạm để nghe đọc';
}
function paint(btn) {
  if (!btn) return;
  btn.textContent = label();
  btn.setAttribute('aria-pressed', String(voicePref()));
  btn.classList.toggle('is-locked', voicePref() && !voiceUnlocked());
}

export const voiceButton = () => (speechSupported()
  ? `<button type="button" class="btn btn--ghost btn--small vfig__toggle vfig__voice${voicePref() && !voiceUnlocked() ? ' is-locked' : ''}"
      data-a="voice" aria-pressed="${voicePref()}">${label()}</button>`
  : '');

/** Dòng nhắc dưới trình phát: máy / ứng dụng không có giọng đọc thì nói rõ cách khắc phục. */
export const voiceNoticeHTML = () => '<p class="vfig__voicewarn small" role="note" hidden></p>';

/**
 * Bộ đọc nhịp. `onDone` được gọi khi đọc xong (để trình phát chạy tiếp).
 * `holding` = true nghĩa là đang đọc, trình phát nên đứng yên ở nhịp này.
 */
export function createBeatVoice(onDone) {
  let holding = false, timer = 0, prev = {}, seq = 0, btn = null, note = null, checkT = 0;
  const release = () => {
    if (!holding) return;
    holding = false;
    clearTimeout(timer);
    onDone?.();
  };
  const onUnlock = () => paint(btn);
  window.addEventListener('gdtc:voice-unlocked', onUnlock);

  /** Sau khi danh sách giọng nạp xong: không có giọng tiếng Việt / đang trong Zalo… thì báo. */
  function checkAvailability() {
    if (!note) return;
    const st = voiceStatus();
    if (st === 'loading') { checkT = setTimeout(checkAvailability, 500); return; }
    const app = inAppName();
    const missing = st === 'unsupported' || st === 'novoice';
    if (!missing) { note.hidden = true; return; }
    note.innerHTML = voiceHelpHTML({ app, st });
    note.hidden = false;
    if (btn) btn.hidden = true; // không có giọng thì giấu nút cho khỏi rối
  }

  const api = {
    get holding() { return holding; },
    /** Gắn nút 🔊 và dòng nhắc của trình phát. */
    bind(button, notice) {
      btn = button; note = notice;
      paint(btn);
      checkT = setTimeout(checkAvailability, 300);
    },
    /**
     * Đọc một nhịp. Trả về true nếu đang đọc (trình phát phải chờ).
     * full: đọc đủ tên động tác + câu mô tả (khi em chủ động chạm nghe).
     */
    speak(pose, { full = false, hold = true } = {}) {
      if (!voicePref()) return false;
      const text = beatSpeech(pose, full ? {} : prev);
      if (!text) return false;
      const my = ++seq; // chỉ nhận "đọc xong" của đúng câu này, bỏ qua câu cũ vừa bị thay
      if (!say(text, { rate: RATE, onend: () => { if (my === seq) release(); } })) return false;
      prev = pieces(pose);
      if (!hold) return false; // đọc nhưng không bắt trình phát chờ (vd em chạm lúc hình đang di chuyển)
      holding = true;
      clearTimeout(timer);
      // Dự phòng khi trình duyệt không báo "đọc xong": chờ theo độ dài câu, không chờ cứng 9 giây.
      timer = setTimeout(() => { if (my === seq) release(); }, Math.min(12000, speechMs(text, RATE) * 1.6 + 800));
      return true;
    },
    /**
     * Bấm nút 🔊 (gọi NGAY trong trình xử lý cú chạm). `pose` = nhịp đang hiện, để đọc ngay.
     * - Đang bật mà máy chưa cho đọc: cú chạm này mở khoá và đọc ngay (KHÔNG tắt).
     * - Đang bật và đã đọc được: tắt.  - Đang tắt: bật, mở khoá, đọc ngay.
     */
    toggle(pose, { hold = true } = {}) {
      // Nút đang hiện "Chạm để nghe đọc": cú chạm này là để NGHE, không phải để tắt. (Bộ bắt cú chạm
      // toàn trang có thể đã mở khoá ngay trước khi tới lượt nút, nên xét cả "vừa mới mở khoá".)
      if (voicePref() && (!voiceUnlocked() || justUnlocked())) {
        unlockVoice();
        paint(btn);
        if (pose) api.speak(pose, { full: true, hold });
        return true;
      }
      const on = !voicePref();
      setVoicePref(on);
      if (on) { unlockVoice(); if (pose) api.speak(pose, { full: true, hold }); }
      else { seq++; stopVoice(); release(); }
      paint(btn);
      return on;
    },
    stop() {
      seq++; clearTimeout(timer); clearTimeout(checkT); holding = false; stopVoice();
      window.removeEventListener('gdtc:voice-unlocked', onUnlock);
    },
  };
  return api;
}
