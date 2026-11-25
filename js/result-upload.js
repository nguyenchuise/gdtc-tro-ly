// Gửi kết quả tự tập (điểm + vài ảnh) về Worker của cô (Worker ghi vào Google Sheet + Drive).
// Chạy NỀN, không chặn giao diện, không hiện popup. Lỗi mạng chỉ ghi console.error.
// Để RESULT_ENDPOINT = '' thì KHÔNG gửi gì (ảnh chỉ nằm trong máy như trước).

// ⚠️ ĐỊA CHỈ NHẬN KẾT QUẢ (không phải địa chỉ trang web).
// Đang dùng Google Apps Script Web app — xem worker/apps-script/README.md.
// Đổi chỗ nhận thì sửa đúng một dòng này; để '' thì KHÔNG gửi gì.
export const RESULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxOtYeSmb8OCChqSjTWjLZOwCZJrBC-wz7SXpBJKzByOT9ZdMudmPvsW09ZfIVJZBTd4A/exec';

export const uploadEnabled = () => Boolean(RESULT_ENDPOINT);

const noDiacritics = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

/** sessionId: YYYYMMDD_HHmmss_TenBaiKhongDau_SoNgauNhien3ChuSo (đồng bộ tên thư mục Drive và dòng Sheet). */
export function makeSessionId(exerciseName, date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}_${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
  const name = noDiacritics(exerciseName).replace(/[^A-Za-z0-9]+/g, '').slice(0, 40) || 'Bai';
  const rnd = Math.floor(100 + Math.random() * 900);
  return `${stamp}_${name}_${rnd}`;
}

/** Thu nhỏ một ảnh dataURL về rộng tối đa maxW, nén JPEG chất lượng q. Trả về Promise<dataURL>. */
export function shrinkDataUrl(dataUrl, maxW = 640, q = 0.7) {
  return new Promise((resolve) => {
    if (!dataUrl) { resolve(dataUrl); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const s = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * s));
        c.height = Math.max(1, Math.round(img.height * s));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', q));
      } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Gửi một bản ghi lên Worker. Fire-and-forget; không chặn, không ném lỗi ra ngoài. */
// Google Apps Script không trả kèm nhãn CORS nên trình duyệt không đọc được phản hồi:
// gửi kiểu "no-cors" (vẫn ghi dữ liệu bình thường, chỉ là ta không đọc được kết quả trả về).
const isAppsScript = /(^|\.)script\.google\.com\//.test(RESULT_ENDPOINT);

export function sendResult(payload) {
  if (!RESULT_ENDPOINT) return;
  try {
    fetch(RESULT_ENDPOINT, {
      method: 'POST',
      // text/plain để tránh CORS preflight; phía nhận đọc body dạng text rồi JSON.parse.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      keepalive: true, // vẫn gửi xong kể cả khi em rời trang ngay sau đó
      ...(isAppsScript ? { mode: 'no-cors' } : {}),
    })
      .then((r) => { if (!isAppsScript && !r.ok) console.error('Gửi kết quả: HTTP', r.status); })
      .catch((e) => console.error('Gửi kết quả: lỗi mạng', e));
  } catch (e) {
    console.error('Gửi kết quả: lỗi', e);
  }
}
