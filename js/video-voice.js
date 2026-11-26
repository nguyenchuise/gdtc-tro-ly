// Giọng đọc cho mục 2. Video: đọc tên nhịp và câu hướng dẫn mỗi khi đổi nhịp.
// Đọc xong mới sang nhịp sau, để em nghe kịp (giọng chạy nhanh 1,2× cho đỡ lê thê).
// Dùng chung công tắc 🔊 với mục 4. Tự tập (cùng khoá lưu trong js/speak.js).
import { say, stopVoice, voicePref, setVoicePref, speechSupported } from './speak.js';

const RATE = 1.2;
const MAX_HOLD = 9000; // phòng trường hợp trình duyệt không báo "đọc xong"

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

export const voiceButton = () => (speechSupported()
  ? `<button type="button" class="btn btn--ghost btn--small vfig__toggle" data-a="voice" aria-pressed="${voicePref()}"
      aria-label="Đọc tên nhịp">${voicePref() ? '🔊' : '🔇'} Đọc nhịp</button>`
  : '');

/**
 * Bộ đọc nhịp. `onDone` được gọi khi đọc xong (để trình phát chạy tiếp).
 * `holding` = true nghĩa là đang đọc, trình phát nên đứng yên ở nhịp này.
 */
export function createBeatVoice(onDone) {
  let holding = false, timer = 0, prev = {};
  const release = () => {
    if (!holding) return;
    holding = false;
    clearTimeout(timer);
    onDone?.();
  };
  return {
    get holding() { return holding; },
    get on() { return voicePref(); },
    /** Đọc một nhịp. Trả về true nếu đang đọc (trình phát phải chờ). */
    speak(pose) {
      if (!voicePref()) return false;
      const text = beatSpeech(pose, prev);
      prev = pieces(pose);
      if (!text || !say(text, { rate: RATE, onend: release })) return false;
      holding = true;
      clearTimeout(timer);
      timer = setTimeout(release, MAX_HOLD);
      return true;
    },
    /** Bấm nút 🔊. Trả về trạng thái mới. */
    toggle(btn) {
      const on = !voicePref();
      setVoicePref(on);
      if (btn) { btn.textContent = on ? '🔊 Đọc nhịp' : '🔇 Đọc nhịp'; btn.setAttribute('aria-pressed', String(on)); }
      if (!on) { stopVoice(); release(); }
      return on;
    },
    stop() { clearTimeout(timer); holding = false; stopVoice(); },
  };
}
