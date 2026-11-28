// Lời đọc "có hồn" cho giọng nói: chào, khen, động viên, nhắc khi máy chưa thấy em hoặc tư thế chưa đúng.
//
// NGUYÊN TẮC: phần HƯỚNG DẪN động tác (tên nhịp, câu mô tả, câu gợi ý sửa) đọc NGUYÊN VĂN theo SGK.
// Chỉ phần bao quanh (lời chào, lời khen, câu mở đầu nhận xét) mới được biến tấu, đổi luân phiên
// để không lặp đi lặp lại một câu.
//
// Dấu câu có tác dụng thật với giọng đọc: dấu "!" và "?" làm giọng lên xuống, dấu "," ngắt hơi.

const lastPick = new Map();
/** Chọn ngẫu nhiên một câu, tránh trùng câu vừa đọc lần trước. */
function pick(key, list) {
  if (list.length === 1) return list[0];
  let i;
  do { i = Math.floor(Math.random() * list.length); } while (i === lastPick.get(key));
  lastPick.set(key, i);
  return list[i];
}

/** Viết lại cho máy đọc trơn: "90°" → "90 độ", gạch nối → ngắt hơi. Không đổi nội dung. */
export const speakable = (s) => String(s || '')
  .replace(/(\d)\s*°/g, '$1 độ').replace(/°/g, ' độ')
  .replace(/\s*[–—]\s*/g, ', ')
  .replace(/\s+/g, ' ').trim();

/** Kết câu nhẹ nhàng: "Duỗi thẳng hai gối." → "Duỗi thẳng hai gối nhé!" */
const soften = (t) => `${String(t || '').trim().replace(/[.!…\s]+$/, '')} nhé!`;
/** Viết thường chữ đầu để ghép giữa câu. */
const lower1 = (t) => String(t || '').replace(/^\p{Lu}/u, (c) => c.toLowerCase());

// ---------------------------------------------------------------- Mở đầu
/** Lời chào khi bắt đầu tự tập. */
export const greetPractice = () => pick('greetP', [
  'Chào em! Mình cùng tập nào!',
  'Xin chào! Sẵn sàng chưa? Bắt đầu nhé!',
  'Chào em! Đứng vào khung hình, mình tập thôi!',
  'Bắt đầu nào! Em làm theo hướng dẫn nhé!',
]);
/** Lời chào ở mục 2. Video. */
export const greetVideo = () => pick('greetV', [
  'Chào em! Cùng xem bạn mẫu tập nhé.',
  'Xin chào! Mình cùng tập theo bạn mẫu nào!',
  'Chào em! Xem kỹ từng nhịp rồi tập theo nhé!',
]);

// ---------------------------------------------------------------- Trong lúc tập
/** Khen ngắn khi qua được một nhịp. */
export const praise = () => pick('praise', ['Tốt lắm!', 'Đúng rồi!', 'Giỏi quá!', 'Tuyệt!', 'Chuẩn luôn!', 'Hay lắm!']);
/** Khi hết giờ một nhịp mà chưa làm được. */
export const skipLine = () => pick('skip', [
  'Không sao, mình sang nhịp sau nhé!',
  'Không sao đâu, nhịp tiếp theo nào!',
  'Bỏ qua nhịp này, cố lên nhé!',
]);
/** Máy không thấy người tập. */
export const notSeenLine = () => pick('unseen', [
  'Ơ, máy chưa thấy em đâu! Em lùi ra xa một chút cho máy thấy cả người nhé.',
  'Em ơi, đứng vào khung hình nào!',
  'Máy đang tìm em đó! Em lùi lại một bước cho thấy cả người nhé.',
]);
/** Đứng quá xa, người nhỏ trong khung. */
export const tooFarLine = () => pick('far', [
  'Em đứng hơi xa rồi, tiến lại gần một bước nhé!',
  'Lại gần thêm chút nữa nào!',
]);
/** Thấy người nhưng chưa thấy rõ một số bộ phận. */
export const unclearLine = (parts) => (parts
  ? `Máy chưa thấy rõ ${parts}. Em lùi ra xa một chút nhé!`
  : 'Máy chưa thấy rõ cả người. Em lùi ra xa một chút nhé!');

/**
 * Nhận xét khi tư thế chưa đúng: câu mở đầu động viên + câu sửa.
 * `fix` là câu gợi ý theo SGK (rule.hint) hoặc câu do máy suy ra — giữ nguyên nội dung.
 */
export function fixLine(fix) {
  const lead = pick('lead', ['Gần được rồi!', 'Cố lên!', 'Thêm chút nữa thôi!', 'Sắp đúng rồi!', 'Làm tốt lắm!']);
  return `${lead} ${soften(speakable(fix))}`;
}

/**
 * Góc chưa đúng mà bài không soạn sẵn câu gợi ý: nói bằng lời thay cho số độ.
 * `label` là mô tả tư thế đúng (vd "Khuỷu tay co khoảng 90°"). Chỉ khớp bản lề (khuỷu tay, gối) mới nói
 * "gập thêm / duỗi thêm" — vai, hông, thân… thì hướng đúng tuỳ động tác, nên nhắc làm theo hình mẫu.
 */
export function angleFix(label, diff) {
  const d = Math.abs(diff);
  const what = lower1(speakable(label));
  const hinge = /khuỷu|gối/i.test(label) && !/vai|đùi|thân|hông/i.test(label);
  if (hinge) {
    const verb = diff > 0 ? 'gập' : 'duỗi';
    const amount = d < 15 ? 'một chút xíu' : d < 35 ? 'thêm chút nữa' : 'thêm nhiều nữa';
    return `Chú ý ${what}, em ${verb} ${amount}`;
  }
  if (d < 15) return `Chú ý ${what}, chỉnh thêm một chút xíu là chuẩn`;
  return `Chú ý ${what}, em nhìn hình mẫu làm theo`;
}

/** Bài đếm lần: chưa đếm được lần nào. */
export const repStartLine = (pose) => `Mình bắt đầu nào! ${speakable(pose || '')}`.trim();
/** Bài đếm lần: làm chưa đủ sâu. */
export const repDeeperLine = () => pick('deeper', [
  'Làm sâu hơn chút nữa nhé, cố lên!',
  'Gần được rồi! Xuống sâu thêm chút nữa nào!',
]);
const NUM = ['', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];
/** Đếm to số lần đạt ("Một!", "Hai!"…), lần cuối thêm lời khen. */
export const countLine = (n, target) => `${NUM[n] || n}!${n >= target ? ' Xong rồi, giỏi quá!' : ''}`;

// ---------------------------------------------------------------- Kết thúc
/** Lời kết theo điểm. */
export function finishLine(score) {
  const s = Math.round(score);
  if (s >= 90) return `${pick('f90', ['Xuất sắc!', 'Tuyệt vời!'])} Em được ${s} phần trăm.`;
  if (s >= 80) return `${pick('f80', ['Rất tốt!', 'Giỏi lắm!'])} Em được ${s} phần trăm.`;
  if (s >= 60) return `${pick('f60', ['Khá lắm!', 'Làm tốt đấy!'])} Em được ${s} phần trăm, tập thêm chút nữa là chuẩn luôn!`;
  return `Em được ${s} phần trăm. ${pick('f0', ['Cố lên nhé, mình tập lại lần nữa nào!', 'Không sao, tập lại là sẽ tốt hơn thôi!'])}`;
}
