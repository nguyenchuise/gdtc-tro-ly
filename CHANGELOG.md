# Changelog

## [0.12.0] - 2026-11-22: Hình nộm tư thế mẫu ở tab Tự tập

### Thêm
- **Hình nộm tư thế mẫu** cho cả 88 bài có camera, **vẽ tự động từ chính các góc máy dùng để chấm** (`js/pose-figure.js`),
  nên hình luôn khớp với cách chấm. Bài giữ tư thế: hình chuyển từ đứng sang tư thế mẫu rồi giữ yên (như ảnh GIF);
  bài đếm lần: hình lặp động tác lên – xuống. Tắt chuyển động khi máy bật "giảm chuyển động".
- Chấm cam đánh số trên hình = bộ phận được chấm, kèm chú thích "① Tay trái ngang vai ~90°".
- **Trước khi bật camera:** thẻ "Tư thế mẫu" ngay trên nút Bật camera.
- **Đang tập – máy tính:** hình mẫu ở đầu cột bên phải, cạnh camera. **Điện thoại:** hình mẫu nhỏ ở góc khung camera,
  bấm để thu nhỏ / hiện lại.
- Gợi ý vẽ riêng (`scoring.figure`) cho tư thế khó suy ra từ góc: xuất phát thấp lớp 8, 9.

## [0.11.0] - 2026-11-22: Lớp 9 theo sách giáo khoa – đủ 4 khối

### Thay đổi
- **Lớp 9 dựng lại theo SGK Giáo dục thể chất 9 – Kết nối tri thức với cuộc sống:** 3 phần, 8 chủ đề, 19 bài.
  - Phần 1. Kiến thức chung: Sử dụng các yếu tố tự nhiên và dinh dưỡng để rèn luyện sức khoẻ, phát triển thể chất.
  - Phần 2. Vận động cơ bản: Chạy cự li ngắn (100 m), Nhảy cao kiểu nằm nghiêng, Chạy cự li trung bình, Bài tập thể dục (nhịp điệu).
  - Phần 3. Thể thao tự chọn: Cầu lông, Bóng đá, Bóng rổ.
- **Tự tập camera cho 18/19 bài**; ảnh xem trước các trang (sách lớp 9: số ảnh = trang in + 2) và link sách gốc.
- Toàn bộ 89 bài lớp 6 – 9 đã theo SGK; không còn bài mẫu demo. README cập nhật.

## [0.10.0] - 2026-11-22: Lớp 8 theo sách giáo khoa

### Thay đổi
- **Lớp 8 dựng lại theo SGK Giáo dục thể chất 8 – Kết nối tri thức với cuộc sống:** 3 phần, 8 chủ đề, 22 bài.
  - Phần 1. Kiến thức chung: Sử dụng chế độ dinh dưỡng thích hợp với bản thân trong luyện tập TDTT.
  - Phần 2. Vận động cơ bản: Chạy cự li ngắn (100 m), Nhảy cao kiểu bước qua, Chạy cự li trung bình, Bài tập thể dục (nhịp điệu).
  - Phần 3. Thể thao tự chọn: Cầu lông, Bóng đá, Bóng rổ.
- **Tự tập camera cho 21/22 bài** (mọi bài vận động); góc mục tiêu ước lượng từ hình minh hoạ.
- Ảnh xem trước các trang và link sách gốc (sách lớp 8: số trang in = số ảnh, trình đọc NXB đếm từ 0).
- Gợi ý tìm kiếm "Squat" (bài mẫu cũ, đã bỏ) đổi thành "Nhảy cao".

## [0.9.0] - 2026-11-22: Lớp 7 theo sách giáo khoa

### Thay đổi
- **Lớp 7 dựng lại theo SGK Giáo dục thể chất 7 – Kết nối tri thức với cuộc sống:** 3 phần, 8 chủ đề, 23 bài,
  tên phần/chủ đề/bài đúng mục lục sách.
  - Phần 1. Kiến thức chung: Lựa chọn và sử dụng các yếu tố của môi trường tự nhiên trong luyện tập.
  - Phần 2. Vận động cơ bản: Chạy cự li ngắn (60 m), Nhảy xa kiểu ngồi, Chạy cự li trung bình, Bài tập thể dục.
  - Phần 3. Thể thao tự chọn: Cầu lông, Bóng đá, Bóng rổ.
- **Tự tập camera cho 22/23 bài** (mọi bài vận động). Đếm lần cho: chạy nâng cao đùi, bật nhảy hai chân, chạy tại chỗ,
  bật nhảy tách – chụm chân (cầu lông), tâng bóng bằng đùi; các bài khác giữ tư thế chính trong sách 2 giây.
  Góc mục tiêu là ước lượng từ hình minh hoạ.
- Mỗi bài có tóm tắt viết lại ngắn gọn, số trang SGK, ảnh xem trước các trang (tải từ sách điện tử NXB) và link sách gốc.

## [0.8.1] - 2026-11-22: Cửa sổ bài tập không nhảy khi chuyển tab

### Sửa
- Máy tính: 4 tab Hướng dẫn / Video / Sách / Tự tập dùng **chung một cỡ cửa sổ** (theo tab Tự tập),
  luôn chừa chỗ thanh cuộn → chuyển tab không còn bị giật khung.
- Link "Mở sách trang …" lớp 6: `#page=` là số trang in (trình đọc của NXB đếm từ 0 = bìa).

## [0.8.0] - 2026-11-22: Giao diện điện thoại gọn hơn, đổi camera trước/sau

### Thay đổi
- **Điện thoại:** cả cửa sổ bài tập cuộn chung (tiêu đề và thanh tab không còn đứng yên chiếm nửa màn hình);
  chỉ nút Đóng nổi cố định ở góc. Khi bật camera, khung camera tự cuộn lên đầu màn hình.
- **Điện thoại:** chữ nhỏ hơn một bậc (1rem = 15px), tiêu đề, tab, thẻ mục tiêu gọn hơn. Nút vẫn ≥ 44px.
- **Khung camera giữ đúng tỉ lệ của camera** (dọc hoặc ngang), vừa màn hình, không cắt hình.
- **Đổi camera:** nút có chữ "Camera sau" / "Camera trước", chỉ hiện khi máy có từ 2 camera.
  Mặc định camera trước; chỉ đổi khi bấm (thầy cô hoặc bạn quay giúp). Camera sau không lật gương.

## [0.7.0] - 2026-11-22: Tự tập – xem camera và bảng từng bộ phận cùng lúc

### Thay đổi
- Bảng "Từng bộ phận" **luôn mở** (bỏ nút thu gọn "Xem chi tiết từng bộ phận").
- **Máy tính (≥ 1000px):** ở tab Tự tập, hộp thoại rộng ra (tối đa 1320px); khi đang tập, **camera bên trái,
  bảng điểm + gợi ý + bảng từng bộ phận bên phải**, nhìn được cùng lúc, không phải cuộn.
- **Điện thoại:** bảng nhỏ **ngay trong khung camera** (không nền, chữ trắng viền bóng, chấm màu + %).
  Tự chọn góc trên trái hoặc phải để không che người; nếu cả hai góc đều che thì tự làm mờ.
  Bảng đầy đủ (đo được / cần / đạt) nằm ngay dưới khung camera.

## [0.6.0] - 2026-11-22: Lớp 6 – tự tập camera mọi bài, xem trước trang sách

### Thay đổi
- **Tự tập với camera cho 24/25 bài lớp 6** (mọi bài vận động, đủ 7 chủ đề vận động). Mỗi bài chấm một tư thế chính
  lấy từ hình trong sách, ghi rõ ở thẻ mục tiêu (ví dụ "Tư thế ném rổ: bóng trên vai, khuỷu gập dưới bóng…").
  Bài có động tác lặp (chạy tại chỗ, bật cao, vung chân đá, chuyền bóng) thì đếm số lần.
  Góc mục tiêu là **ước lượng từ hình minh hoạ** (`"estimated": true`), cần thử với học sinh thật và chỉnh dần.
- Bài lý thuyết "Chế độ dinh dưỡng" không có động tác nên không có Tự tập.
- **Tab Sách:** hiện **ảnh xem trước các trang của bài** (chọn Trang 106, 107…), ảnh tải trực tiếp từ sách điện tử
  của NXB Giáo dục (không sao chép, không lưu trong repo). Nếu không tải được ảnh → tự hiện nút "Mở sách trang …".
  Link sách gốc thành tuỳ chọn nhỏ "Mở sách gốc để xem thêm trang ↗".

## [0.5.0] - 2026-11-22: Lớp 6 theo sách giáo khoa

### Thay đổi
- **Lớp 6 dựng lại theo SGK Giáo dục thể chất 6 – Kết nối tri thức với cuộc sống:** 3 phần, 8 chủ đề, 25 bài,
  tên phần, chủ đề và bài **đúng theo mục lục sách** (thay cho dữ liệu mẫu cũ).
  - Phần 1. Kiến thức chung: Chế độ dinh dưỡng trong luyện tập TDTT.
  - Phần 2. Vận động cơ bản: Chạy cự li ngắn (60 m), Ném bóng, Chạy cự li trung bình, Bài tập thể dục.
  - Phần 3. Thể thao tự chọn: Cầu lông, Bóng đá, Bóng rổ.
- Mỗi bài có các bước, lỗi hay gặp và ý chính **viết lại ngắn gọn** (không chép nguyên văn sách),
  cùng **số trang SGK** và nút "Mở sách trang …" tới sách điện tử của NXB Giáo dục.
- Chấm điểm camera giữ cho 3 bài: Bài thể dục liên hoàn nhịp 1–11 (nhịp 3, dang ngang), nhịp 12–23 (nhịp 17, tay lên cao),
  và các động tác bổ trợ chạy ngắn (đếm nâng cao đùi).
- Tìm kiếm: cụm từ đứng liền nhau trong nội dung được ưu tiên hơn.
- Ảnh trang sách **chưa** đưa lên: sách ghi bản quyền thuộc NXB Giáo dục Việt Nam, cấm sao chép, phát tán khi chưa được phép.

## [0.4.0] - 2026-11-21: Phong cách tinh gọn, gợi ý ngay trên camera

### Thay đổi
- Cỡ chữ gốc 18px → **16px**, chữ mảnh hơn (bỏ độ đậm 800; nút/tab 600). Tiêu đề, ô lớp, thẻ bài, số liệu gọn lại. Nút vẫn ≥ 48px.
- **Tự tập:** câu gợi ý sửa tư thế hiện **ngay trên hình camera** (dải tối, chữ trắng; xanh khi đúng).
  Khi camera chạy, thẻ mục tiêu, mẹo đặt máy và nút chọn nguồn tự ẩn để hình và gợi ý nằm trọn trong màn hình điện thoại.
- MASTER.md cập nhật cỡ chữ và quy tắc trang Tự tập.

### Đã kiểm tra
- Lighthouse mobile trang chủ: Performance 100, Accessibility 100, Best Practices 100.
- Điện thoại 375px: gợi ý và điểm nhìn thấy cùng lúc với camera, không cần cuộn; toàn bộ test chức năng đạt.

## [0.3.0] - 2026-11-21: Trang chủ mới theo mẫu Bento (skill ui-ux-pro-max)

### Thay đổi
- Design system lưu tại `design-system/gdtc/MASTER.md` (sinh bằng skill ui-ux-pro-max, đã chỉnh theo yêu cầu nhà trường):
  nền Accessible & Ethical, Claymorphism nhẹ, mẫu bố cục **Bento Box Grid**; giữ xanh #0f8a5f, cam thành tích, Be Vietnam Pro.
- Trang chủ: hero 2 cột có minh hoạ màn hình chấm điểm; khối “Bắt đầu nhanh” gồm ô “Tự tập với camera” và 4 ô Lớp 6–9 màu riêng
  (số bài, số bài chấm điểm, dấu ✓ khi chọn); thẻ bài có hình minh hoạ theo môn; thanh điều hướng dưới đáy trên điện thoại.
- Chữ gốc 18px; mọi nút ≥ 48px, có biểu tượng kèm chữ (nút Nói/Tìm, Đóng…); ô tìm có nhãn hiện rõ.
- Phóng to chữ 200% không cuộn ngang; tôn trọng chế độ giảm chuyển động.

### Đã kiểm tra
- Lighthouse mobile trang chủ: Performance 99, Accessibility 100, Best Practices 100.
- Không có nút < 48px ở 375px và 1366px; toàn bộ test chức năng cũ vẫn đạt, không lỗi console.

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
