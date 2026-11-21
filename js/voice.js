// Hỏi bằng giọng nói (Web Speech API, tiếng Việt). Âm thanh do trình duyệt xử lý; trang web không lưu lại.

const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

export const voiceSupported = () => Boolean(Recognition);

/**
 * Bắt đầu nghe. Trả về hàm dừng.
 * onText(text, isFinal) — onState('listening' | 'idle') — onError(thông báo tiếng Việt)
 */
export function listen({ onText, onState, onError }) {
  if (!Recognition) {
    onError('Trình duyệt này chưa hỗ trợ nói để tìm. Em hãy gõ câu hỏi vào ô nhé (nên dùng Chrome trên điện thoại hoặc máy tính).');
    return () => {};
  }
  const rec = new Recognition();
  rec.lang = 'vi-VN';
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  let finalText = '';
  rec.onstart = () => onState('listening');
  rec.onresult = (ev) => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
    }
    onText((finalText || interim).trim(), false);
  };
  rec.onerror = (ev) => {
    const msg = {
      'not-allowed': 'Em chưa cho phép dùng micro. Bấm vào biểu tượng ổ khoá trên thanh địa chỉ để cho phép, hoặc gõ câu hỏi nhé.',
      'service-not-allowed': 'Thiết bị chưa bật nhận dạng giọng nói. Em gõ câu hỏi vào ô nhé.',
      'no-speech': 'Cô chưa nghe thấy gì. Em bấm micro và nói lại nhé.',
      'audio-capture': 'Không tìm thấy micro trên thiết bị.',
      network: 'Nhận dạng giọng nói cần mạng Internet. Em kiểm tra mạng hoặc gõ câu hỏi nhé.',
    }[ev.error];
    if (ev.error !== 'aborted') onError(msg || 'Không nghe được. Em thử lại hoặc gõ câu hỏi nhé.');
  };
  rec.onend = () => {
    onState('idle');
    if (finalText.trim()) onText(finalText.trim(), true);
  };
  try { rec.start(); } catch { onError('Micro đang bận, em thử lại sau giây lát.'); }
  return () => { try { rec.stop(); } catch { /* đã dừng */ } };
}
