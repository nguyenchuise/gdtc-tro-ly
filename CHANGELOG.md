# Changelog

## [0.30.0] - 2026-11-26: Kết quả tìm kiếm chia theo lớp; nút gợi ý lọc đúng bài

### Thay đổi
- **Kết quả tìm kiếm nay cũng chia theo Lớp 6 → 7 → 8 → 9**, giữ nguyên các khối Lớp / Phần / Chủ đề
  và **thu gọn – mở được** như khi xem cả danh sách (trước đây tìm xong đổ ra một danh sách phẳng).
  Nút **Thu gọn tất cả** vì vậy cũng hiện khi đang tìm.
- Nút gợi ý còn **3**, chọn lại cho đúng và phủ đủ 4 lớp:
  **Thể dục nhịp điệu** (10 bài đếm nhịp, lớp 6–9) · **Chạy cự li ngắn** (17 bài) · **Cầu lông** (12 bài).
  Bỏ nút "Thể dục liên hoàn" vì đã gộp vào nút đầu.

### Sửa
- **Bấm "Thể dục nhịp điệu" trước đây ra lẫn cả nhảy cao, chạy…** Lý do: bỏ dấu thì "nhịp **điệu**" và
  "**điều** chỉnh" đều thành `dieu`, mà "thể dục" lại là từ bị lược nên không phân biệt được.
  Nay nút này **lọc thẳng theo kiểu chấm** (`scoring.mode = "sequence"`) nên ra **đúng 10 bài** thể dục
  đếm nhịp, không lẫn bài nào. Gõ tay hoặc bấm "Xoá tìm kiếm" thì bỏ bộ lọc, không bị kẹt.
- Tìm theo nhiều từ: chữ chỉ khớp **lỏng** (nằm giữa một từ khác) không còn được tính là "trúng từ",
  nên câu nhiều từ bớt lọt bài không liên quan.

## [0.29.1] - 2026-11-26: Sửa mô hình khựng nửa chừng khi đọc nhịp

### Sửa
- **Hình (nhất là mô hình 3D nhìn từ phía sau) bị khựng giữa hai tư thế trong lúc đọc nhịp.**
  Nguyên nhân: số nhịp được tính bằng `Math.round`, nên nó đổi ở **giữa đường** đi từ tư thế này sang
  tư thế kia; lệnh dừng để nghe đọc rơi đúng lúc đó, làm động tác đứng khựng nửa chừng.
  Nay động tác **chạy liền mạch hết nhịp, tới đúng tư thế rồi mới dừng chờ đọc xong**:
  - Hình nộm / vector: chỉ đọc và dừng khi `t` chạm đúng số nguyên (đúng tư thế).
  - Mô hình 3D: trang chính báo `speaking` cho cầu nối, cầu nối tự dừng khi mô hình đi hết nhịp
    (`frac ≥ 0,92` hoặc `≤ 0,12`, xem `samplePose`) — không dừng từ xa để khỏi trễ lệnh.
  - Đo thực tế bài lớp 8 nhịp điệu: trước khi sửa 271/325 lần dừng rơi vào giữa đường (frac ~0,55–0,62);
    sau khi sửa 0/180.

## [0.29.0] - 2026-11-26: Đọc nhịp ở mục Video; nút "Chấm luôn"; sửa hình mẫu bị co trên camera

### Thêm
- **Mục 2. Video đọc tên nhịp cho TẤT CẢ bài** (trước chỉ mục Tự tập mới có giọng).
  Nút **🔊 Đọc nhịp** ở hàng điều khiển; giọng chạy **1,2×**; **đọc xong mới sang nhịp sau** để em nghe kịp
  (hình nộm/vector đứng yên, mô hình 3D tạm dừng rồi chạy tiếp). Tên động tác và câu mô tả giống nhịp trước
  thì bỏ, chỉ đọc tên nhịp cho đỡ lặp. Dùng chung công tắc 🔊 với mục Tự tập.
- **Nút "Chấm luôn"** ở mục 4. Tự tập cho **75 bài không đếm nhịp** (57 bài giữ tư thế + 18 bài đếm lần) —
  trước đây chỉ 10 bài thể dục đếm nhịp có nút "Bỏ qua nhịp". Bấm vào là chốt kết quả với đúng những gì em
  đã làm được (điểm cao nhất đã đạt / số lần đã đạt), vẫn có ảnh, phiếu PDF và gửi cho thầy cô như bình thường.

### Sửa
- **Hình mẫu nhỏ ở góc dưới phải khung camera bị co còn ~34×20px ở 31 bài** có hình sách nằm ngang:
  do `min(100%, …)` tính theo khung cha rộng tự do. Nay dùng đơn vị theo bề ngang màn hình, khung ra
  **~124×73px**, nhìn rõ mà vẫn không che người tập.

### Thay đổi
- Từ khoá gợi ý ở ô tìm kiếm rút còn **3**, ưu tiên bài trọng tâm cả 4 lớp:
  **Thể dục liên hoàn** (6 bài đếm nhịp lớp 6–7) · **Thể dục nhịp điệu** (lớp 8–9) · **Chạy cự li ngắn** (lớp 6–9).

### Đã rà soát
- Chạy thử camera cho **cả 85 bài có chấm điểm**: 85/85 có hình mẫu trong khung camera (đều là ảnh sách thật,
  nằm góc dưới phải) và 85/85 có giọng đọc hướng dẫn. Không bài nào thiếu.

## [0.28.1] - 2026-11-25: Bật gửi kết quả — dùng Google Apps Script

### Thay đổi
- **Chỗ nhận kết quả đổi sang Google Apps Script Web app** (`worker/apps-script/`) thay cho Cloudflare Worker:
  cách này không cần Client ID / Client secret / Refresh token nên dựng nhanh và ít sai sót hơn.
  `RESULT_ENDPOINT` trong `js/result-upload.js` nay trỏ tới địa chỉ `…/exec`.
- Khi chỗ nhận là Apps Script, trang gửi kiểu `no-cors` (Apps Script không trả nhãn CORS) nên không
  báo lỗi giả trong console; dữ liệu vẫn được ghi bình thường.
- Mã Cloudflare Worker (`worker/gdtc-ket-qua.js`) vẫn giữ lại làm phương án thay thế.

## [0.28.0] - 2026-11-25: Tự gửi kết quả tự tập về Google Sheet + Drive của thầy cô

### Thêm
- **Sau mỗi lần tập xong, app tự gửi kết quả về Worker của thầy cô** (Worker ghi vào Google Sheet và lưu
  ảnh vào Google Drive). Chạy nền, không hiện popup, không chặn thao tác.
  - Gửi: `sessionId` (dạng `YYYYMMDD_HHmmss_TenBai_3số`), tên bài, điểm cao nhất, danh sách lỗi tư thế,
    và tối đa 3 ảnh — 1 ảnh lúc điểm cao nhất + tối đa 2 khung lỗi rõ nhất (JPEG 0.7, rộng ≤ 640px, base64).
  - Mỗi lần hoàn thành chỉ gửi đúng **một lần** (cờ chống trùng khi vẽ lại). Lỗi mạng chỉ ghi `console.error`.
  - Khi có gửi, dòng nhắc cuối buổi thành **"Ảnh đã được lưu và gửi, em có thể lưu PDF để giữ lại."**
    (chưa cấu hình địa chỉ gửi thì giữ "Ảnh đã được lưu, em có thể lưu PDF để giữ lại.").
  - Địa chỉ Worker đặt ở một hằng duy nhất `RESULT_ENDPOINT` trong `js/result-upload.js`; để trống thì KHÔNG gửi.
- **Worker** (`worker/`): nhận POST → gọi thẳng Google Sheets API + Drive API bằng refresh token OAuth của
  thầy cô (khoá đặt trong Cloudflare Worker secret, không nằm trong repo). Có `GET ?token=` để đọc lại dữ liệu.

## [0.27.0] - 2026-11-25: Mọi bài tự tập đều có giọng đọc và lời nhắc "Chưa đạt"

### Thêm
- **Giọng đọc hướng dẫn và lời nhắc lý do chưa đạt cho TẤT CẢ bài ở mục 4. Tự tập**, giống các bài thể dục đếm nhịp
  (trước đây chỉ bài đếm nhịp mới có):
  - **Vào bài**: đọc yêu cầu và hiện chữ to giữa màn hình ("Giữ 1 giây…" / "Làm 3 lần…" kèm mô tả tư thế), tự ẩn sau 5 giây cho thoáng.
  - **Chưa đạt quá 5 giây**: đọc và hiện chữ to lý do cụ thể, ví dụ *"Chưa đạt. Khuỷu tay co khoảng 90°: gập lại thêm khoảng 90 độ."*
    Bài đếm lần chưa đếm được lần nào thì nhắc chính động tác của bài.
  - **Vẫn chưa đạt**: nhắc lại mỗi 10 giây. Làm đúng được thì lời nhắc tắt và tính lại giờ.
  - Lý do được suy ra từ bộ phận có điểm thấp nhất (bài ngoài chủ đề thể dục không soạn sẵn câu gợi ý).
  - Nút bật/tắt giọng đọc 🔊 nay có ở mọi bài. Máy không có giọng tiếng Việt thì vẫn hiện chữ như cũ.
- Bài đếm nhịp giữ nguyên cơ chế cũ: quá 10 giây chưa đạt thì tự chuyển sang nhịp sau.

### Thay đổi
- Tìm kiếm: bấm **Tìm** hoặc một từ khoá gợi ý thì tự cuộn xuống danh sách kết quả (khớp đúng 1 bài thì mở thẳng bài đó).
  Từ khoá mẫu đổi thành **Chạy ngắn · Nhảy xa · Cầu lông · Dẫn bóng** (bỏ "Plank" vì không khớp bài nào).
- Sau mỗi lần có kết quả, mục Tự tập hiện: *"Ảnh đã được lưu, em có thể lưu PDF để giữ lại."*
  Bỏ câu "hình camera … không lưu, không gửi đi" ở cuối trang và trong mục Tự tập.

## [0.26.0] - 2026-11-24: Bạn mẫu đi đủ các hình trong sách

### Thêm
- **Hình nộm "Bạn mẫu tập cùng em" (mục 2. Video) đi lần lượt qua đủ các hình SGK** ở 56 bài ngoài chủ đề Bài tập thể dục.
  Trước đây hình nộm chỉ diễn một tư thế chấm điểm (đứng → tư thế mẫu).
  - Tư thế lấy từ **chính các khung ảnh sách**: MediaPipe Pose (bản chính xác cao) nhận diện khớp trên 513 khung,
    soát bằng mắt từng khung và loại các khung nhận nhầm (ảnh cận tay, vợt, bóng).
  - Mỗi nút là một hình trong sách ("3.2" = Hình 3, ảnh thứ 2). Ảnh SGK bên phải **đổi cùng lúc**, kèm chú thích hình.
  - Hình nhìn từ trước được lật thành **nhìn từ phía sau** (tay trái ở bên trái màn hình); hình nhìn nghiêng giữ như sách.
  - Hình đạt từ 80% theo đúng bộ chấm của bài có dấu **★ "Tư thế máy chấm"**, ghi góc đo được so với góc mẫu (46 bài có).
  - Khung sơ đồ hoặc cảnh sân tập đông người: bạn mẫu giữ tư thế hình trước và ghi rõ lí do.
- Dữ liệu ở `data/sgk-poses.json` (86 KB, chỉ tải khi mở mục Video); công cụ sinh lại và soát ở `tools/sgk-poses/`.
  `tools/validate-data.mjs` kiểm tra số tư thế khớp số khung sách.

### Còn lại
- 19 bài vẫn dùng hình nộm cũ vẽ từ góc chấm, vì SGK chỉ có sơ đồ hoặc cảnh sân tập với người rất nhỏ
  (các bài luyện tập phối hợp, chạy tiếp sức, trò chơi bổ trợ) hoặc có dưới 2 hình người rõ.

## [0.25.0] - 2026-11-24: Đủ hình SGK cho mọi bài; nhạc nền "Workout Music"

### Thêm
- **Rà soát toàn bộ 79 bài ngoài chủ đề Bài tập thể dục.** Nay **cả 89/89 bài** có hình động cắt từ ảnh gốc SGK, gồm 568 khung cho 79 bài này.
  - Lấy lại các hình trước bị lọc vì bè ngang: sân tập, đội hình luyện tập, cảnh thi đấu. Khung hình động đã phóng riêng cho từng hình nên hiện vừa khung.
  - **Đọc lại các chú thích "Hình N" máy bỏ sót** (đọc chữ kiểu rải rác), ví dụ: Hình 3 Nâng cao đùi, Hình 3 Rút sức cuối cùng, Hình 3 Chạy đà giậm nhảy, Hình 4 Hai bước ném rổ, Hình 2 và 5 Dừng bóng bổng, Hình 2 Dẫn bóng mu ngoài.
  - **Cắt tay 21 hình kĩ thuật và sơ đồ** máy không tự nhận ra, ví dụ vị trí chân trụ và bóng, hướng chạy đà, bàn đạp xuất phát, cách cầm vợt và cầm cầu, khung thành, sân cầu lông.
  - **14 bài trong SGK chỉ có hình trò chơi** (luyện tập phối hợp, bổ trợ) và các bài chỉ có một hình kĩ thuật: thêm hình trò chơi của chính bài đó.
  - Vẫn bỏ hình trò chơi khởi động đầu bài, vì không phải động tác của bài.
- **Nhạc nền "Workout Music" (prettyjohn1)**, tệp thầy cô gửi.
  - Nén về 128 kbps cho điện thoại tải nhanh.
  - Phát lặp lại; tự dừng khi bật camera hoặc video tự tập, phát lại khi tập xong.

## [0.24.2] - 2026-11-24: Luôn tải bản mới nhất sau mỗi lần cập nhật

### Sửa
- Sau khi cập nhật, trình duyệt (nhất là điện thoại) có thể vẫn chạy mã cũ đã lưu, nên tính năng mới như tự cuộn tới danh sách bài chưa có tác dụng.
  Từ bản này, khi deploy, GitHub Actions gắn mã phiên bản vào mọi tệp JS/CSS (`tools/cache-bust.mjs`), nên trình duyệt luôn tải bản mới.
- Cuối trang hiện **"Phiên bản x.y.z · mã"** để kiểm tra đang xem bản nào.

## [0.24.1] - 2026-11-24: Chọn lớp / chủ đề tự cuộn tới danh sách bài

### Thay đổi
- Chọn **lớp** hoặc **chủ đề** thì trang tự cuộn xuống danh sách bài tập vừa lọc, không phải tự kéo tìm.
  Danh sách nháy viền xanh nhẹ để em thấy đã đổi. Máy bật "giảm chuyển động" thì nhảy thẳng tới, không cuộn mượt.

## [0.24.0] - 2026-11-24: Ảnh sân trường trên trang chủ

### Thêm
- **Nền chìm ảnh sân trường ở khối đầu trang:**
  - 3 ảnh tự chuyển mờ sau mỗi 8 giây, có hiệu ứng phóng rất nhẹ.
  - Phủ lớp xanh lá đậm để chữ trắng và ô tìm kiếm luôn rõ; trên điện thoại lớp phủ đậm hơn.
  - Máy bật "giảm chuyển động" thì giữ cố định ảnh đầu.
- **Thẻ "Đơn vị triển khai" cuối trang chủ:**
  - Ảnh 16:9 tự chuyển sau mỗi 6 giây, có 3 chấm để chọn ảnh.
  - Ghi Trường THCS Nguyễn Tất Thành, Phường Đông Gia Nghĩa, Tỉnh Lâm Đồng; Tác giả: Cô Quý Anh; một câu giới thiệu mục tiêu.
  - Thẻ xếp dọc trên điện thoại.
- Ảnh nằm trong `media/truong/`, đã nén khoảng 240 KB mỗi ảnh. Thay ảnh của trường bằng cách giữ đúng tên tệp (xem `media/truong/HUONG-DAN.md`).

## [0.23.0] - 2026-11-24: Đủ 10 bài thể dục có bạn mẫu dựng hình; 3D sắc nét như tranh SGK; nhịp 8 lớp 6 rõ bước trái

### Thêm
- **Mô hình 3D cho 4 bài còn lại**: lớp 7 nhịp 11–20 và 21–30, lớp 8 thể dục nhịp điệu bài 1 và bài 2.
  Cả 10 bài thể dục nay đều có bạn mẫu dựng hình ở cột ①, chạy cùng nhịp với ảnh gốc SGK ở cột ②.

### Thay đổi
- **Mô hình 3D sắc nét kiểu tranh SGK** (`js/fig3d-style.js`, áp cho cả 9 tệp 3D, không sửa lõi của Gemini):
  - Màu phẳng tươi, đúng mã màu đồng phục. Trước đây màu bị "pha trắng" do lệch chuẩn màu sRGB.
  - Nét viền đậm #1E293B như bản vector lớp 6.
  - Vẽ đủ độ phân giải màn hình điện thoại.
- **Lớp 6 nhịp 8 (chân trái bước sang ngang):**
  - Chân phải đứng yên, chân trái bước ra, thân dịch theo. Trước đây hai chân dang đều ra hai bên, trông như đứng tại chỗ.
  - Thêm **trục giữa** nét đứt và **dấu chân** ở chỗ đứng ban đầu.
- Ghép nhịp 3D với ảnh SGK theo tên động tác chính xác hơn: ưu tiên tên trùng khớp hoàn toàn, bỏ chữ "Động tác" ở đầu tên.

## [0.22.0] - 2026-11-24: Mô hình 3D cho 5 bài thể dục, thông tin tác giả, nhạc nền

### Thêm
- **Mô hình 3D (Three.js) của thầy cô** ở cột ① mục 2. Video cho 5 bài:
  - Lớp 6 nhịp 12–23 và nhịp 24–30.
  - Lớp 7 nhịp 1–10.
  - Lớp 9 thể dục nhịp điệu phần 1 và phần 2.
- **Cách hoạt động của mô hình 3D:**
  - Camera phía sau, bật sẵn khớp AI; kéo ngang trên hình để xoay xem các phía.
  - Chạy **cùng nhịp** với ảnh gốc SGK ở cột ②. Nhịp được ghép theo tên động tác và "Nhịp n", kể cả bài lớp 9 nhiều động tác.
  - Nhịp SGK không in hình (TTCB, các nhịp lặp lại) thì ghi rõ "SGK không in hình nhịp này".
  - Chỉ chạy khi khung đang hiện trên màn hình.
  - Thư viện Three.js được lưu sẵn trong trang.
  - Công cụ ghép: `tools/import-3d-figure.mjs`.
- **Thông tin tác giả:**
  - Dải trang trọng ở đầu trang và thẻ viền vàng ở cuối trang: Cô Quý Anh, Trường THCS Nguyễn Tất Thành, địa chỉ, email liên hệ.
  - Thêm một dòng ở chân phiếu PDF gửi thầy cô.
- **Nhạc nền vui:**
  - Tự bật ở lần chạm đầu tiên.
  - **Tự tắt khi em bật camera hoặc video tự tập** (chỉ còn giọng nói hướng dẫn), phát lại khi tập xong; dừng khi em xem video hướng dẫn.
  - Nút ♪ ở thanh tiêu đề và trong hộp bài.
  - Mặc định là giai điệu tự soạn, không vướng bản quyền. Thầy cô có thể thả tệp nhạc có quyền sử dụng vào `media/nhac/`.

### Thay đổi
- Chân trang: ghi đúng "Nội dung bám theo SGK Giáo dục thể chất 6–9", bỏ chữ "bản demo".

## [0.21.0] - 2026-11-24: Hình động cắt từ SGK cho toàn học phần (mục Video và Tự tập)

### Thêm
- **Hình động "Động tác trong sách" cho 65 bài nữa**, tổng 75/89 bài.
  - 445 khung cắt từ ảnh gốc trang SGK.
  - Mỗi hình kĩ thuật "Hình N" được tách thành từng người trong chuỗi động tác, chạy lần lượt.
  - Có nút chọn từng hình: "Hình 2", "Hình 3"…
  - Ảnh vẫn lấy trực tiếp từ máy chủ NXB, không sao chép vào kho mã.
  - Bỏ hình trò chơi khởi động, sơ đồ sân và đội hình luyện tập, vì không phải động tác của bài.
  - 14 bài luyện tập phối hợp hoặc bổ trợ chưa có hình động, vì SGK các bài này chỉ có hình trò chơi.
- **Mục 4. Tự tập** của các bài này dùng ảnh sách làm hình mẫu, giống các bài đếm nhịp.
  - Thẻ "Hình mẫu trong sách" trước khi tập.
  - Khung hình mẫu nhỏ ngay trong camera.
  - Bài giữ tư thế hoặc đếm lần vẫn giữ danh sách góc máy chấm dưới hình.
  - Không tải được ảnh sách thì tự quay về hình nộm như cũ.

### Thay đổi
- **Mục 2. Video:** cột phải ② hiện ảnh gốc SGK cho mọi bài có hình.
  - Bài đếm nhịp: chạy **cùng nhịp** với bạn mẫu bên trái.
  - Bài khác: tự chạy lần lượt, có nút ‹ › và dừng riêng.
- **Hình động trong sách:** mỗi hình trong sách có tỉ lệ phóng riêng, nên hình cận cảnh (bàn chân, tay cầm vợt) và hình toàn thân đều vừa khung.
- Chấm cam trên tab 2. Video giờ chỉ báo **chưa có video thật**.

## [0.20.0] - 2026-11-24: Bạn mẫu phía sau (nhân tạo) bên trái, ảnh gốc SGK bên phải, chạy cùng nhịp

### Thay đổi
- **Mục 2. Video, hàng trên hai cột chạy cùng nhịp:**
  - **Trái**: ① Bạn mẫu tập cùng em, chỉ còn góc nhìn **phía sau** dựng nhân tạo, có điểm khớp AI.
  - **Phải**: ② Động tác trong sách, **ảnh gốc SGK** chạy động.
  - Bỏ hình phía trước dựng nhân tạo. Góc phía trước dùng đúng hình trong sách, để giám khảo đối chiếu và để sớm phát hiện chỗ hình nhân tạo lệch sách.
  - Bấm nhịp nào thì cả hai cột cùng sang nhịp đó. Đã kiểm tra tự động trên 10 bài có ảnh SGK.
  - ③ Video hướng dẫn nằm bên dưới.
  - Bài chưa có hình động từ sách: cột phải ghi "chưa có", kèm link sang mục 1. Sách.
- **Nhờ Gemini chỉ cần một tệp (phía sau).**
  - `tools/import-gemini-figure.mjs <mã-bài> <tệp-phía-sau.html>`.
  - Công cụ báo lỗi nếu số tư thế khác số nhịp của bài.
  - Câu lệnh mẫu trong `tools/gemini-src/HUONG-DAN-GEMINI.md` đã sửa theo cách mới.

## [0.19.0] - 2026-11-24: Mục Video cùng một khung cho mọi bài

### Thay đổi
- **Mục 2. Video của cả 89 bài theo đúng khung bài mẫu lớp 6**, gồm 3 phần đánh số cố định:
  1. Bạn mẫu tập cùng em.
  2. Động tác trong sách (hình động).
  3. Video hướng dẫn.
  - Phần chưa có hiện ô nét đứt "sắp có" ngay tại chỗ, nên bài nào cũng cùng thứ tự, cùng vị trí.
  - **Ảnh trang sách chỉ ở mục 1. Sách**, hình chuyển động và video chỉ ở mục 2. Video.
- **Hình nộm tạm** trong phần "Bạn mẫu" cho 84 bài có chấm điểm nhưng chưa có tệp Gemini.
  - Hình vẽ từ chính các góc máy chấm, dùng cùng nút bấm như bản vector: ‹ › Dừng/Chạy, tốc độ, điểm khớp AI, chọn nhịp.
  - 9 bài thể dục còn lại có từng nhịp TTCB, 1, 2…, chia theo động tác ở lớp 8 và 9.
  - 15 bài quay trước có hai hình: phía sau (trái) và phía trước (phải).
  - 60 bài quay nghiêng có một hình nhìn nghiêng.
  - Có tệp Gemini của bài nào thì ghép bằng `tools/import-gemini-figure.mjs`, hình vector tự thay chỗ hình nộm.

## [0.18.0] - 2026-11-24: Bạn mẫu vector hai góc nhìn, hình động chuyển sang mục Video

### Thêm
- **Bạn mẫu vector hai góc nhìn** ở đầu mục 2. Video (thử trước với bài lớp 6 *Bài thể dục liên hoàn, nhịp 1–11*).
  - Bên trái là **phía sau**: tay trái bạn mẫu ở bên trái màn hình, em đứng sau làm theo, không bị ngược chiều.
  - Bên phải là **phía trước**, như hình trong sách.
  - Hai hình chạy cùng nhịp và tự chạy. Có sẵn **điểm khớp AI** (vai, khuỷu, cổ tay, hông, gối, cổ chân) và mũi tên nét đứt kiểu SGK; bấm để bật/tắt.
  - Có nút ‹ ›, Dừng/Chạy, tốc độ Chậm/Vừa/Nhanh và dãy chọn nhịp TTCB, 1…11.
  - Chỉ vẽ khi khung đang hiện trên màn hình, để đỡ tốn pin.
  - Hình vẽ lấy từ 2 tệp thầy cô dựng bằng Gemini.
- **Công cụ ghép tệp Gemini** `tools/import-gemini-figure.mjs`.
  - Tự tách phần vẽ, bỏ phần giao diện riêng, chạy thử từng tư thế (không được ra NaN) và bật bài trong dữ liệu.
  - Câu lệnh mẫu cho các bài tiếp theo nằm ở `tools/gemini-src/HUONG-DAN-GEMINI.md`.

### Thay đổi
- **Hình động ghép từ SGK chuyển từ mục 1. Sách sang mục 2. Video**, nằm dưới bạn mẫu vector. Phần "Video sắp có" vẫn ở dưới cùng.
  - Mục 1. Sách có dòng nhắc kèm link sang mục 2. Video.
  - Tab Video không còn chấm "sắp có" khi bài đã có hình chuyển động.
- **Tối ưu cho điện thoại.**
  - Khung hình được cắt bớt lề hai bên nên bạn mẫu to hơn khoảng 1,4 lần.
  - Dãy chọn nhịp nằm ngay dưới hình và cuộn ngang được.
  - Khung phụ "góc nghiêng" chỉ hiện trên máy tính bảng và máy tính.

### Sửa cho khớp SGK (trang 49–50)
- **Phối cảnh:** tay đưa về phía người xem (nhịp 9, 11) không còn bị vẽ như đang giơ lên cao. Tâm chiếu đặt ngang ngực, công cụ ghép tự sửa cho mọi bài.
- **Nhịp 4:** hai tay gần thẳng, bắt chéo thấp trước đùi; khuỵu gối sâu hơn; đầu cúi nhưng mắt mở nhìn tay.
- **Nhịp 8–11:** hai chân đứng rộng hơn vai như hình trong sách.

## [0.17.0] - 2026-11-23: Phiếu kết quả PDF, đạt nhịp khi quá nửa bộ phận đạt

### Thêm
- **Nút “Xuất PDF cho thầy cô”** trên thẻ kết quả, dùng cho mọi bài có camera.
  - Tạo phiếu **một trang A4** ngay trên máy, không gửi đi đâu (`js/report-pdf.js`, không cần thư viện ngoài).
  - Phiếu gồm: họ tên (không bắt buộc, không lưu), dòng ghi lớp, thời gian, bài, điểm máy chấm (Đạt/Chưa đạt), ảnh lúc tập (bài trọn bộ: ảnh ghép các nhịp), điểm từng phần / từng nhịp.
  - Có ô **dành cho giáo viên**: nhận xét, điểm/xếp loại, chữ ký.

### Thay đổi (10 bài thể dục chấm trọn bộ)
- **Đạt nhịp khi quá nửa số bộ phận máy thấy được đạt ≥ 80%.** Bộ phận bị khuất (vd không thấy chân) không còn chặn nhịp.
  Máy cần thấy ít nhất một nửa số bộ phận.
- Gợi ý sửa dựa trên bộ phận máy thấy được. Chỉ nhắc “chưa thấy rõ…” khi thấy chưa đủ một nửa.

## [0.16.0] - 2026-11-23: Qua nhịp nhanh, nói lý do chưa đạt, camera góc rộng

### Thay đổi (10 bài thể dục chấm trọn bộ)
- **Hình mẫu trong khung camera nhỏ lại một nửa**, nằm góc phải dưới. Dòng gợi ý chừa chỗ cho hình.
- **Qua nhịp ngay:** làm chuẩn (≥ 90%, không bộ phận nào dưới 75%) liên tục 0,3 giây là sang nhịp sau, không chờ đủ 1 giây.
  Mỗi lần đạt có tiếng **“ting”**; hết giờ thì tiếng trầm.
- **Sau 5 giây chưa đạt:**
  - Máy **nói ngắn gọn lý do**, ví dụ “Chưa đạt. Co hai cẳng tay lại trước ngực.”
  - Chữ to trên camera chuyển màu cam, ghi lý do.
- Nhắc **“Em đứng hơi xa, tiến lại gần một bước”** khi người quá nhỏ trong khung.
- **Giọng đọc nhanh 1,2×.**
- **Camera góc rộng:**
  - Tự thu zoom về mức rộng nhất máy cho phép.
  - Nếu máy có camera sau góc siêu rộng (iPhone 11 trở lên, nhiều máy Android) thì hiện nút **“Góc rộng”** để đứng gần hơn mà vẫn thấy đủ người.
  - Hình camera nét hơn (960×720).
- Mẹo đặt máy mới ở tab Tự tập: dựng dọc, thấp ngang hông; đứng xa thì nghe giọng đọc và tiếng “ting”.

## [0.15.0] - 2026-11-23: Chấm trọn bộ dễ thở hơn, đọc hướng dẫn từng nhịp

### Thay đổi (10 bài thể dục chấm trọn bộ)
- **Dễ đạt hơn:**
  - Mỗi nhịp đạt khi điểm trung bình ≥ 80% và không bộ phận nào dưới 60% (trước: mọi bộ phận ≥ 80%).
  - Tiêu chí nới vừa phải: góc +8°, vị trí +¼ bề rộng vai.
- **Giữ 1 giây** mỗi nhịp (trước 1,5 giây).
- **Tự bỏ qua sau 10 giây** không làm được, chỉ tính lúc máy thấy người; nhịp đầu thêm 5 giây để vào chỗ. Còn 5 giây thì có đếm ngược.
- **Hình mẫu to trong khung camera:**
  - Cao gần bằng khung (khoảng 4–5 lần trước), để nhìn được khi đặt điện thoại xa.
  - Bấm để đổi to → nhỏ → ẩn.
  - Bỏ bảng nhỏ trên camera cho thoáng; bảng đầy đủ vẫn ở dưới.
- **Hướng dẫn từng nhịp:**
  - Câu ngắn cho cả 168 nhịp, hiện chữ to giữa khung camera.
  - Đọc bằng giọng tiếng Việt có sẵn trong điện thoại, không cần mạng. Nút 🔊/🔇 bật/tắt, máy nhớ lựa chọn.
  - Hết bài đọc điểm.

## [0.14.0] - 2026-11-23: Chấm trọn bộ các bài thể dục

### Thay đổi
- **10 bài thể dục liên hoàn / nhịp điệu (lớp 6 – 9) chuyển sang chấm trọn bộ:**
  - Máy chấm lần lượt cả **168 nhịp** theo đúng các hình trong sách, thay vì chỉ chấm 1 tư thế.
  - Mỗi nhịp phải đúng và **giữ liên tục 1,5 giây** mới được tính rồi chuyển sang nhịp sau.
  - Hết bài mới ra điểm: trung bình các nhịp, số nhịp đạt, điểm theo từng động tác, ảnh ghép tất cả các nhịp (lưu về máy được).
- Tiêu chí từng nhịp chặt hơn và **không nới thêm**: kiểm tra cả tay, chân và thân (tay cao hơn đầu, chân rộng hơn vai,
  hai tay bắt chéo, thân gập, nghiêng lườn, ngồi xổm chống tay…). Làm sai tư thế sẽ không qua được nhịp.
- Khi tập:
  - Hình mẫu đứng yên ở đúng nhịp đang chấm (điện thoại: góc khung camera; máy tính: cột phải).
  - Có dải ô theo dõi tiến độ, ô ghi đúng số nhịp trong sách.
  - Có nút **Bỏ qua nhịp** cho nhịp khó; sau 12 giây chưa qua thì có nhắc.
- Bài nhịp điệu chọn được chấm **Cả bài** hoặc từng động tác.
- Bộ chấm điểm thêm các loại rule theo vị trí (`dy`, `dx`, `torso`, `tilt`); trình kiểm tra dữ liệu hiểu chế độ `sequence`.
- Các bài khác giữ nguyên (giữ 1 giây, nới góc) để thầy cô so sánh khi thử nghiệm.

## [0.13.0] - 2026-11-23: Hình mẫu chuyển động từ sách, tab đánh số, chấm dễ hơn

### Thêm
- **Hình mẫu chuyển động ghép từ chính ảnh trong SGK** cho 10 bài thể dục (lớp 6: 3 bài liên hoàn; lớp 7: 3 bài liên hoàn;
  lớp 8, 9: mỗi lớp 2 bài nhịp điệu), tổng 168 khung "Nhịp" (`js/book-anim.js`, trường `bookAnim`).
  - Các hình "TTCB, Nhịp 1, Nhịp 2…" trong sách được cắt đúng vùng và chạy lần lượt như phim, cùng tỉ lệ, chân đặt cùng mặt sàn.
  - Dưới hình là chú thích gốc của sách cho nhịp đó. Có nút ‹ ›, dừng/chạy, tốc độ Chậm/Vừa/Nhanh; bài nhịp điệu chọn được từng động tác.
  - Ảnh vẫn lấy trực tiếp từ máy chủ NXB Giáo dục (không lưu ảnh trong repo). Không tải được ảnh thì tự quay về hình nộm.
- Tab 4. Tự tập: hình mẫu là hình động từ sách. Chạy sẵn động tác máy chấm, khung máy chấm viền cam, ghi "Máy chấm nhịp này" và dừng lâu hơn.
  Điện thoại: hình nhỏ ở góc khung camera.

### Thay đổi
- **Tab đánh số và đổi thứ tự cho mọi bài: 1. Sách · 2. Video · 3. Hướng dẫn · 4. Tự tập**; mở bài vào tab Sách.
- **Chấm dễ hơn để tạo hứng khởi:**
  - Bài giữ tư thế chỉ cần đúng **khoảng 1 giây** là tự chụp ảnh (trước 2 giây). Bài đếm lần cần **3 lần** (trước 8 – 10).
  - Mỗi góc được lệch thêm 10° mà vẫn 100%, làm gần đúng là khoảng 80–100%.
  - Bài đếm lần: mỗi lần đạt nháy "Đúng rồi!"; ảnh chụp đúng khoảnh khắc sâu nhất của lần tốt nhất.
- Tối ưu cho điện thoại / iPad ngoài sân trường:
  - Nút "Bật camera" luôn nổi ở mép dưới khi đang xem hình mẫu.
  - Hàng chọn động tác cuộn ngang.
  - Hình mẫu gọn hơn trên màn hình nhỏ.

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
