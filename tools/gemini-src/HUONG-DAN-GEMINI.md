# Nhờ Gemini vẽ "bạn mẫu" phía sau (nhân tạo) cho bài mới

Bài đã có: **Lớp 6 – Bài thể dục liên hoàn (nhịp 1–11)** (`g6-dang-tay`). Tệp mẫu: `g6-dang-tay.back.html` (ngay thư mục này).

Trên trang, mục 2. Video chia hai cột chạy cùng nhịp:
- **Bên trái**: ① Bạn mẫu nhìn **từ phía sau**, dựng nhân tạo bằng tệp Gemini.
- **Bên phải**: ② **Ảnh gốc SGK** chạy động. Góc phía trước giữ đúng hình trong sách để tránh sai lệch.

Vì vậy **chỉ cần nhờ Gemini làm MỘT tệp: góc nhìn phía sau**.

## Ba bước

1. Mở Gemini, **đính kèm**:
   - tệp mẫu `g6-dang-tay.back.html`;
   - ảnh chụp các trang SGK của bài cần làm (xem cột "Trang SGK" ở bảng cuối).
2. Dán **câu lệnh** bên dưới, sửa 4 chỗ `[...]` theo bảng cuối trang.
3. Gửi lại tệp HTML Gemini trả về. Người phụ trách kỹ thuật chạy:

   ```bash
   node tools/import-gemini-figure.mjs <mã-bài> <tệp-phía-sau.html>
   ```

   Công cụ tự ghép vào mục **2. Video**, tự chạy thử, tự sửa phối cảnh và báo lỗi nếu tệp thiếu gì.
   Chỗ nào lệch so với hình SGK thì chỉnh trong `tools/gemini-src/<mã-bài>.fix.json` (xem tệp của bài lớp 6 làm mẫu) rồi chạy lại lệnh trên.

## Câu lệnh mẫu (dán vào Gemini)

```text
Tôi gửi kèm 1 tệp HTML mẫu: hình người vector 2.5D tập "Bài thể dục liên hoàn" lớp 6 (TTCB và nhịp 1–11)
nhìn từ PHÍA SAU người tập, cùng ảnh các trang SGK Giáo dục thể chất (Kết nối tri thức) của bài
[TÊN BÀI], lớp [LỚP], trang [TRANG].

Hãy tạo 1 tệp HTML MỚI, góc nhìn PHÍA SAU, cho bài này. GIỮ NGUYÊN động cơ vẽ của tệp mẫu: cùng nhân vật, đồng phục, màu,
phép chiếu 2.5D, cách vẽ điểm khớp AI (vai, khuỷu, cổ tay, hông, gối, cổ chân), mũi tên nét đứt kiểu SGK.
Chỉ thay danh sách tư thế, chuyển động giữa các tư thế, và mở rộng động cơ khi cần.

Yêu cầu bắt buộc (để trang web tự ghép được):
1. Đặt toàn bộ động cơ giữa hai dòng chú thích  // @@ENGINE-START  và  // @@ENGINE-END  trong thẻ <script>.
   Đoạn này gồm: const COLORS, hằng số khung xương (ANATOMY hoặc RIG), const POSES = [...],
   function samplePoseAtTime(t), các hàm vẽ, và một hàm tên build...SvgInner(pose, prefix) trả về
   nội dung bên trong <svg viewBox="0 0 360 390">.
   Trong đoạn này KHÔNG dùng document, window; chỉ được đọc appState.showAI, appState.showArrows,
   appState.showXray. Phần giao diện (nút bấm, bảng tư thế, tải SVG…) đặt sau // @@ENGINE-END.
2. POSES có đúng [SỐ TƯ THẾ] tư thế, đúng thứ tự: [DANH SÁCH NHỊP].
   Mỗi tư thế có: code ("TTCB" hoặc "Nhịp 5"), group (tên động tác, ví dụ "Tay ngực"; bài không chia
   động tác thì để ""), shortTitle, caption (mô tả ngắn theo SGK, tiếng Việt).
   Mỗi tư thế có thêm: rearTip (mẹo khi nhìn từ sau) và angleRef (góc tham chiếu ngắn, ví dụ "Vai 90° • Gối 180°").
3. samplePoseAtTime(t): t chạy từ 0 đến POSES.length (dùng POSES.length, không viết cố định 12);
   tư thế cuối nối mượt về tư thế đầu; trả về đối tượng tư thế có nearestIdx (số thứ tự tư thế gần nhất).
4. Tay chân TRÁI của bạn mẫu nằm bên TRÁI màn hình (người xem đứng sau bạn mẫu). Tư thế mỗi nhịp phải khớp
   đúng hình nhịp đó trong SGK (trang web đặt ảnh SGK chạy cùng nhịp ngay bên cạnh để đối chiếu).
5. Mọi nét vẽ (tay dang ngang, bàn tay, mũi tên, chữ) nằm trong vùng x = 55 đến 305 của viewBox, vì điện
   thoại sẽ cắt bỏ phần ngoài. KHÔNG làm khung hình phụ (inset) bên cạnh nhân vật.
6. Giữ nguyên hàm project3D như tệp mẫu (trang web tự chỉnh phối cảnh khi ghép).
7. Nếu bài có động tác mà động cơ mẫu chưa vẽ được (gập thân, nghiêng lườn, đá hoặc co một chân, bước
   chân, giậm chân, bật nhảy khỏi mặt đất, chạy tại chỗ, đẩy hông…), hãy MỞ RỘNG động cơ bằng tham số mới
   cho từng tư thế (ví dụ torsoBend, torsoSide, legL / legR: { lift, kneeBend, fwd, out }, jump), mặc định 0
   để tư thế cũ không đổi.
8. Tư thế phải khớp hình trong SGK: góc tay, độ rộng chân, chân nào bước, hướng xoay người, hướng nhìn.

Trả về 1 tệp HTML hoàn chỉnh, mở bằng trình duyệt là chạy được, đặt tên: [MÃ BÀI].back.html
```

## Bảng điền cho các bài còn lại

| Mã bài | Lớp | Tên bài | Trang SGK (in trên sách) | Số tư thế | Danh sách nhịp (đúng thứ tự) |
|---|---|---|---|---|---|
| g6-tay-dua-cao | 6 | Bài thể dục liên hoàn (từ nhịp 12 đến nhịp 23) | 54–55 | 12 | Nhịp 12 → Nhịp 23 |
| g6-the-duc-nhip-24-30 | 6 | Bài thể dục liên hoàn (từ nhịp 24 đến nhịp 30) | 58–59 | 7 | Nhịp 24 → Nhịp 30 |
| g7-td-1-10 | 7 | Bài thể dục liên hoàn (từ nhịp 1 đến nhịp 10) | 40–41 | 11 | TTCB, Nhịp 1 → Nhịp 10 |
| g7-td-11-20 | 7 | Bài thể dục liên hoàn (từ nhịp 11 đến nhịp 20) | 44–45 | 10 | Nhịp 11 → Nhịp 20 |
| g7-td-21-30 | 7 | Bài thể dục liên hoàn (từ nhịp 21 đến nhịp 30) | 47–48 | 10 | Nhịp 21 → Nhịp 30 |
| g8-nhip-dieu-1 | 8 | Bài thể dục nhịp điệu (chạy tại chỗ, tay ngực, vươn người, bật tách chụm chân) | 46–48 | 28 | [Chạy tại chỗ] Nhịp 1–4; [Tay ngực] Nhịp 1–8; [Vươn người] Nhịp 1–8; [Bật tách chụm chân] Nhịp 1–8 |
| g8-nhip-dieu-2 | 8 | Bài thể dục nhịp điệu (lườn, bật nhảy co gối, di chuyển chéo, bật nhảy – tay cao) | 51–52 | 22 | [Lườn] Nhịp 1, 2, 3, 5, 6, 7, 8; [Bật nhảy co gối] Nhịp 1–4; [Di chuyển chéo] Nhịp 1, 2, 3, 5, 6, 7, 8; [Bật nhảy – tay cao] Nhịp 1–4 |
| g9-nhip-dieu-1 | 9 | Bài thể dục nhịp điệu (Phần 1) | 42–44 | 32 | [Giậm chân tại chỗ] Nhịp 1–8; [Giậm chân tại chỗ (lần 2)] Nhịp 1–8; [Thu chân, tay cao] Nhịp 1–8; [Bật tách chụm] Nhịp 1–4; [Vặn mình] Nhịp 1–4 |
| g9-nhip-dieu-2 | 9 | Bài thể dục nhịp điệu (Phần 2) | 47–49 | 24 | [Đặt gót] Nhịp 1–4; [Bước đuổi] Nhịp 1–8; [Đẩy hông] Nhịp 1–4; [Bật nhảy] Nhịp 1–8 |

Số tư thế và thứ tự phải giống bảng, vì phần chấm điểm ở mục **4. Tự tập** đi theo đúng các nhịp này.
Lớp 8 và 9 có nhiều động tác: điền tên động tác vào trường `group` của mỗi tư thế.
Bài dài (22–32 tư thế) có thể nhờ Gemini làm từng động tác rồi ghép, miễn tệp cuối cùng đủ số tư thế.
