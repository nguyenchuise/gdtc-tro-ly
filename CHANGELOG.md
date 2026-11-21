# Changelog

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
