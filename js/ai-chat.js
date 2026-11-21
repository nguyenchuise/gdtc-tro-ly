// PHASE 2 — CHƯA DÙNG. Chỗ để sẵn cho hỏi đáp AI tự do.
//
// Nguyên tắc bắt buộc:
// 1. KHÔNG bao giờ đặt API key (Gemini hay bất kỳ dịch vụ nào) trong mã front-end này.
//    Mọi lời gọi đi qua một Cloudflare Worker làm proxy, key lưu trong Worker secrets.
// 2. Chỉ gửi CÂU HỎI DẠNG CHỮ. Không gửi ảnh/video học sinh: gói miễn phí của Gemini
//    cho phép Google dùng dữ liệu để cải thiện sản phẩm.
// 3. Worker nên giới hạn tần suất (rate limit) theo IP và chỉ nhận yêu cầu từ domain GitHub Pages của trường.
// 4. Câu trả lời nên kèm gợi ý bài tập trong data/exercises.json (truyền danh sách tiêu đề vào system prompt).
//
// Ví dụ khi triển khai:
//   const WORKER_URL = 'https://gdtc-ai.<tai-khoan>.workers.dev/chat';
//   export async function ask(question) {
//     const r = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ question: String(question).slice(0, 500) }) });
//     if (!r.ok) throw new Error('AI tạm thời không trả lời được');
//     return (await r.json()).answer;
//   }

export const AI_CHAT_ENABLED = false;
