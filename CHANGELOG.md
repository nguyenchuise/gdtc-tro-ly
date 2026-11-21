# Changelog

## [0.2.0] - 2026-11-21: Giao diện mới, chấm điểm có ảnh kết quả, khoá trang giáo viên

### Thêm mới
- **Tự tập**: nhãn % của từng bộ phận nổi ngay trên camera (tự né nhau, né ô điểm và nút Dừng; màn hình nhỏ thì chỉ ghi %).
- **Tự chụp ảnh khi đạt**: ảnh có khung xương, % từng bộ phận, điểm và thời gian. Hiện thẻ “Kết quả lần này” và “Kết quả tốt nhất”; tập lại mà cao hơn thì tự thay kỷ lục. Có nút lưu ảnh về máy. Không lưu, không gửi đi.
- Điều kiện **Đạt** chặt hơn: *mọi* bộ phận ≥ 80% (trước đây là điểm trung bình).
- Bài đếm lần (ví dụ nâng cao đùi, squat): tự đếm, chỉ tính lần đạt chuẩn, dừng ở mục tiêu và giữ kết quả tốt nhất.
- Thanh tiến độ và ô điểm (HUD) ngay trên hình; viền xanh khi đang đúng tư thế; vòng xoay khi đang tải bộ chấm điểm.
- **Trang giáo viên cần mã** (mặc định 1324, chỉ lưu mã băm), có nút “Khoá lại”.
- Trang chủ: khối Lớp và Phần **thu gọn được**, nút “Thu gọn/Mở tất cả”; bộ lọc chủ đề có nút “Tất cả chủ đề” đứng riêng, mỗi Phần là một nhóm thu gọn; gợi ý tìm nhanh.

### Thay đổi
- Giao diện mới theo gợi ý của skill ui-ux-pro-max (nhóm education/fitness): màu riêng cho từng lớp, thẻ bài gọn, tab dạng nút, cam “thành tích” cho kết quả tốt nhất, biểu tượng SVG thay emoji, bỏ hiệu ứng lặp vô hạn trang trí.
- Tab trên điện thoại vừa một hàng (biểu tượng trên, chữ dưới): “Hướng dẫn · Video · Sách · Tự tập”.
- Tab Sách: bỏ các nút chọn tỉ lệ, luôn chia đôi cân bằng (Ý chính | Trang sách).
- Câu chữ ngắn gọn, dễ hiểu hơn cho học sinh THCS.

### Sửa lỗi
- Bộ đếm giữ tư thế bị kẹt khi video tải lên tự lặp lại (thời gian quay về 0).

### Đã kiểm tra
- Lighthouse mobile trang chủ: Performance 100, Accessibility 100, Best Practices 100.
- Playwright: bộ lọc/thu gọn, mã giáo viên (sai/đúng/khoá lại), tab Sách, chấm điểm người thật + tự chụp + tập lại giữ kỷ lục, đếm 10 lần với chuyển động giả lập; không có lỗi console.

## [0.1.0] - 2026-11-21: Bản demo đầu tiên

### Thêm mới
- Trang chủ: ô hỏi bài, nút micro (Web Speech API, `vi-VN`), chip lọc lớp 6–9, lọc theo Phần/Chủ đề, danh sách nhóm theo **Lớp → Phần → Chủ đề → Bài**.
- Tìm kiếm bỏ dấu tiếng Việt; nhận “lớp 6/lop 6”, “chủ đề 2/chương 2”, “phần 1”; bỏ từ thừa (“hướng dẫn”, “bài tập”, “em muốn”…); khớp đúng 1 bài thì mở luôn.
- Hộp chi tiết bài (bottom sheet trên điện thoại, hộp giữa màn hình trên laptop), 4 tab:
  - **Hướng dẫn**: các bước, lỗi thường gặp, mẹo đặt camera.
  - **Video**: nhúng YouTube kiểu “bấm mới tải” (`youtube-nocookie`), nhiều video/bài, nút “Mở trên YouTube”.
  - **Sách giáo khoa**: ảnh trang sách và **tóm tắt nhanh** cạnh nhau trong cùng một tab, chọn tỉ lệ (ưu tiên ảnh / cân bằng / ưu tiên tóm tắt).
  - **Tự tập & chấm điểm**: camera trước (lật gương, đổi camera), quay hoặc chọn video; khung xương; điểm hiện tại, cao nhất, thời gian giữ, bảng từng rule, gợi ý sửa lỗi tệ nhất, “Đạt!”.
- **Cửa sổ chờ** cho mọi nội dung chưa có (video, trang sách, tóm tắt), kèm link tìm video tham khảo và link cho giáo viên cập nhật đúng bài.
- Bài liên quan (cùng chủ đề + khai báo `related`).
- Chấm điểm: `mode: "hold"` và `"reps"`, `oneOf` trái/phải, bỏ qua khớp mờ (visibility < 0.5), góc tính theo điểm ảnh (không méo theo tỉ lệ khung hình).
- Trang **Dành cho giáo viên** (`#giao-vien`): bảng tình trạng nội dung; trình soạn (link YouTube, tóm tắt, ảnh trang sách nén trên máy); xem thử bằng bản nháp trên máy; **đăng thẳng lên GitHub** bằng token cá nhân; hoặc tải tệp về.
- Tự ánh xạ ảnh theo thư mục `media/sach/<mã-bài>/` (sinh `data/media.json` khi deploy).
- GitHub Actions: kiểm tra dữ liệu (báo lỗi tiếng Việt, không deploy nếu sai), test chấm điểm & tìm kiếm, deploy GitHub Pages.
- MediaPipe Tasks Vision 0.10.21 + `pose_landmarker_lite` tự host trong `mp/`, chỉ tải khi mở tab Tự tập; GPU, tự chuyển CPU nếu lỗi.
- 24 bài mẫu demo (6 bài/lớp, 14 bài chấm được bằng camera), gắn nhãn “Mẫu demo, chưa đối chiếu SGK”.
- Chỗ để sẵn cho Phase 2: `js/ai-chat.js`, mục Phase 2 trong README và trang giáo viên.

### Đã kiểm tra
- Lighthouse mobile (trang chủ, máy local): Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Playwright (Chromium, giả lập Pixel 7 và laptop 1366px): tìm kiếm, lọc, mở từng tab, camera giả lập, tải video, bản nháp giáo viên, phát video nhúng; không có lỗi console từ trang (chỉ có cảnh báo GPU của MediaPipe).
- Chấm điểm với ảnh người thật (ảnh mẫu của MediaPipe): bài “dang tay” đạt 99% và “Đạt!”; bài “tay đưa cao” với cùng ảnh chỉ đạt 50%, có gợi ý sửa đúng.
