# Hình nộm theo từng hình SGK (`data/sgk-poses.json`)

Ở mục **2. Video**, cột ① của các bài chưa có tệp 3D/vector dùng **hình nộm đi lần lượt theo từng hình trong sách**.
Tư thế lấy từ chính các khung ảnh SGK (`bookAnim`): MediaPipe Pose nhận diện khớp trên ảnh, rồi chuẩn hoá thành hình nộm.
Ảnh sách bên phải đổi cùng lúc. Hình nào đạt từ 80% theo đúng bộ chấm của bài thì nút có dấu ★ "Tư thế máy chấm".

Khung không nhận được người (sơ đồ, ảnh cận tay/vợt/bóng, cảnh sân tập người quá nhỏ) để `null`:
bạn mẫu giữ tư thế của hình trước. Bài có dưới 2 tư thế thì quay về hình nộm cũ vẽ từ góc chấm (`js/pose-figure.js`).

## Sinh lại (khi sửa khung `bookAnim` của một bài)

Cần Python 3, `pip install mediapipe pillow numpy` và `tesseract` có gói tiếng Việt (`vie`).

1. Đặt ảnh trang SGK vào `tools/sgk-poses/pages/p6/001.png`… (hoặc đặt biến `SGK_PAGES`).
   Thư mục này **không đưa lên kho** (bản quyền NXB).
2. Tải mô hình MediaPipe bản chính xác cao `pose_landmarker_heavy.task` vào `tools/sgk-poses/work/`.
3. Chạy lần lượt:
   ```
   python3 tools/sgk-poses/1-detect.py            # nhận diện khớp mọi khung → work/all.json
   python3 tools/sgk-poses/2-captions.py          # đọc chữ chú thích "Hình N. …" → work/caps.json
   python3 tools/sgk-poses/3-build.py             # chọn người, kiểm tra, chuẩn hoá → data/sgk-poses.json
   python3 tools/sgk-poses/4-review.py soat.png g6   # bảng soát: ảnh sách + hình nộm cạnh nhau
   ```
4. Xem bảng soát. Khung nào hình nộm sai thì thêm số khung (đếm từ 0) vào `drop.json` rồi chạy lại bước 3.
5. `node tools/validate-data.mjs` kiểm tra số tư thế khớp số khung sách.
