# GDTC Trợ lý tập luyện

Website tĩnh giúp học sinh THCS (lớp 6–9) hỏi bài Giáo dục thể chất bằng chữ hoặc giọng nói, xem hướng dẫn, video YouTube, trang sách giáo khoa kèm tóm tắt, rồi **tự tập trước camera** để AI chấm mức giống tư thế mẫu.

- **Chi phí 0 đồng**: host trên GitHub Pages, không có máy chủ (backend).
- **AI chạy trên máy học sinh** (MediaPipe Pose, tự host trong `mp/`) → 50 em dùng cùng lúc không tốn gì thêm.
- **Không thu thập dữ liệu**: không đăng nhập, không lưu và không gửi video đi đâu.

> ⚠️ Bản demo: 24 bài trong `data/exercises.json` là **mẫu tự viết, chưa đối chiếu SGK**. Cấu trúc Phần/Chủ đề là cấu trúc mẫu, cần đối chiếu mục lục sách giáo khoa. Chưa có mã video YouTube và ảnh trang sách nào: giao diện hiện “cửa sổ chờ”.

---

## 1. Đưa lên mạng (làm một lần)

1. Tạo tài khoản GitHub (nếu chưa có).
2. Tạo repo **public** tên `gdtc-tro-ly` (không tick “Add a README”).
3. Đẩy code lên (máy có Git):
   ```bash
   git remote add origin https://github.com/<username>/gdtc-tro-ly.git
   ```
   ```bash
   git push -u origin main
   ```
   Không dùng Git? Vào repo → **Add file → Upload files** → kéo cả thư mục dự án vào → **Commit changes**. Lưu ý phải tải cả thư mục ẩn `.github/` (nếu trình duyệt không cho, tạo tệp `.github/workflows/pages.yml` bằng **Add file → Create new file** và dán nội dung vào).
4. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Vào tab **Actions**, đợi workflow “Deploy GitHub Pages” chạy xong (dấu ✓ xanh, khoảng 1–2 phút).
6. Mở `https://<username>.github.io/gdtc-tro-ly/` trên điện thoại. Camera chỉ chạy trên **https**, link GitHub Pages đáp ứng điều này.

## 2. Cập nhật nội dung (video, trang sách, tóm tắt)

Mọi nội dung nằm trong **`data/exercises.json`**; ảnh trang sách nằm trong **`media/sach/<mã-bài>/`**. Có 3 cách, từ dễ đến “kỹ thuật”:

### Cách 1: Trang “Dành cho giáo viên” (khuyên dùng)
Mở `…/gdtc-tro-ly/#giao-vien`:
1. **Tình trạng nội dung**: bảng cho biết bài nào còn “Chờ” video / sách / tóm tắt. Bấm **Cập nhật**.
2. **Cập nhật một bài**:
   - Dán link YouTube (mỗi dòng một video, thêm `| Tên video` nếu muốn). Nhận mọi dạng link: `youtu.be/…`, `watch?v=…`, `shorts/…`, có `&t=1m5s` để bắt đầu giữa video.
   - Viết **tóm tắt nhanh** (mỗi dòng một ý), hiện cạnh ảnh trang sách cho bạn “lười đọc sách”.
   - **Chụp/chọn ảnh trang sách** (tự thu nhỏ còn 1600px), điền số trang.
3. **Xem thử trên máy này**: chỉ máy của thầy cô thấy (bản nháp), học sinh chưa thấy.
4. **Đăng lên GitHub**: ảnh được tải vào `media/sach/<mã-bài>/`, `exercises.json` được cập nhật, trang tự deploy lại sau 1–2 phút.
   - Cần **token** một lần (mục 3 trên trang giáo viên có hướng dẫn từng bước): fine-grained token, chỉ chọn repo `gdtc-tro-ly`, quyền **Contents: Read and write**, hạn 90 ngày.
   - Token chỉ lưu trong trình duyệt của thầy cô, chỉ gửi tới `api.github.com`, **không nằm trong mã nguồn**. Không tick “Nhớ token” trên máy dùng chung.
5. Không có token? Bấm **Tải tệp về**: tải `exercises.json` + ảnh, rồi tải lên GitHub bằng **Add file → Upload files**.

Mỗi chỗ trống trên trang học sinh (“cửa sổ chờ”) đều có link **“Thầy cô: cập nhật nội dung này →”** dẫn thẳng tới trình soạn của đúng bài đó.

### Cách 2: Kéo thả ảnh vào đúng thư mục (tự ánh xạ, không cần token)
Trên GitHub, mở `media/sach/` → **Add file → Upload files**, gõ tên thư mục là mã bài, ví dụ `media/sach/g8-squat/`, rồi thả ảnh `trang-24.jpg`, `trang-25.jpg`. Khi deploy, `tools/build-media-manifest.mjs` quét thư mục và sinh `data/media.json` → ảnh **tự hiện** ở tab “Sách giáo khoa” của bài, sắp theo số trang trong tên tệp. Không cần sửa JSON.

### Cách 3: Sửa trực tiếp `data/exercises.json` trên GitHub
Mở tệp → biểu tượng ✏️ → sửa → **Commit changes**. Trước khi deploy, workflow chạy `tools/validate-data.mjs`: nếu JSON sai (thiếu dấu phẩy, mã video không đủ 11 ký tự, ảnh không tồn tại…) workflow **dừng và báo lỗi bằng tiếng Việt**, còn trang cũ vẫn chạy bình thường.

### Video riêng của thầy cô
Tải lên YouTube ở chế độ **Không công khai (Unlisted)** rồi dán link. Không tải video lên GitHub (giới hạn 100 MB/tệp, trang sẽ chậm).

## 3. Cấu trúc dữ liệu

```jsonc
{
  "bookSeries": null,                 // bộ sách mặc định, ví dụ "Kết nối tri thức với cuộc sống"
  "curriculum": [                     // mục lục: Lớp → Phần → Chủ đề (dùng để nhóm và tìm "chủ đề 2", "phần 1")
    { "grade": 6, "parts": [
      { "id": "g6-p1", "title": "Phần 1. Vận động cơ bản", "chapters": [
        { "id": "g6-c1", "title": "Chủ đề 1. Bài thể dục khởi động" } ] } ] }
  ],
  "exercises": [{
    "id": "g6-dang-tay",              // chữ thường không dấu, gạch ngang; cũng là tên thư mục ảnh
    "grade": 6, "chapter": "g6-c1", "order": 1,
    "title": "Đứng thẳng, hai tay dang ngang", "topic": "Bài thể dục",
    "keywords": "dang tay ngang khoi dong",   // từ khoá thêm cho tìm kiếm
    "related": ["g6-tay-dua-cao"],    // bài liên quan (bài cùng chủ đề tự được thêm)
    "steps": ["..."], "commonErrors": ["..."],
    "summary": ["Ý chính 1", "Ý chính 2"],    // tóm tắt nhanh, hiện cạnh ảnh trang sách
    "youtube": [{ "id": "MÃ_11_KÝ_TỰ", "title": "Video của cô", "start": 0 }],
    "youtubeSearch": "từ khoá tìm video tham khảo",
    "book": { "series": null, "url": null,
              "pages": [{ "page": 12, "image": "media/sach/g6-dang-tay/trang-12.jpg", "caption": "" }] },
    "demo": true,                     // hiện nhãn "Mẫu demo, chưa đối chiếu SGK" → đổi thành false khi đã duyệt
    "scoring": { ... }                // null nếu không chấm bằng camera (chạy, ném, bóng…)
  }]
}
```

Dạng cũ `"book": { "page": 12, "image": "..." }` vẫn được hỗ trợ.

### Phần chấm điểm `scoring`

| Trường | Ý nghĩa |
|---|---|
| `mode` | `"hold"` giữ tư thế; `"reps"` đếm số lần |
| `holdSeconds` | số giây phải giữ liên tục với điểm ≥ 80% |
| `camera` | `"front"` (đứng quay mặt vào máy) hoặc `"side"` (đứng nghiêng) → hiện mẹo đặt máy |
| `rules[]` | `{ label, joints: [a, b, c], target, tolerance, range }`: góc đo **tại khớp giữa b** |
| `oneOf` | thay cho `joints`: `[[23,25,27],[24,26,28]]` → lấy bên trái hoặc phải, bên nào gần `target` hơn |
| `reps` | `{ label, oneOf/joints, pick: "min", down, up, target, depthTarget, tolerance, range }`: xuống dưới `down`° rồi lên trên `up`° = 1 lần; chất lượng mỗi lần = độ sâu so với `depthTarget` |

Điểm mỗi rule: lệch ≤ `tolerance` → 100%, giảm tuyến tính về 0% khi lệch thêm `range` độ. Điểm = trung bình các rule. Khớp có `visibility < 0.5` → báo “chưa thấy rõ”, **không chấm**.

Số khớp MediaPipe (số lẻ = bên **trái của học sinh**): 11/12 vai · 13/14 khuỷu · 15/16 cổ tay · 23/24 hông · 25/26 gối · 27/28 cổ chân.

> Các góc mục tiêu trong bản demo là ước lượng. Nên để thầy cô làm mẫu, xem bảng “Đo được” trên tab Tự tập, rồi chỉnh `target` cho khớp thực tế (Phase 2 sẽ tự động hoá việc này).

## 4. Chạy thử trên máy

```bash
python3 -m http.server 8080
```
Mở `http://localhost:8080`. Camera chạy được trên `localhost`; mở bằng IP trong mạng LAN (http) thì camera bị chặn, hãy dùng link GitHub Pages.

Kiểm tra dữ liệu và logic chấm điểm (cần Node 18+):
```bash
node tools/validate-data.mjs && node tools/test-scoring.mjs
```

## 5. Cấu trúc thư mục

```
index.html            Trang duy nhất (trang chủ, hộp chi tiết bài, trang giáo viên)
css/app.css           Giao diện (ưu tiên điện thoại)
js/app.js             Trang chủ, cây Lớp → Phần → Chủ đề, hộp chi tiết, định tuyến #bai/<id>/<tab>
js/search.js          Tìm kiếm bỏ dấu, nhận "lớp 6", "chủ đề 2", "phần 1", bỏ từ thừa
js/voice.js           Nói để tìm (Web Speech API, vi-VN)
js/youtube.js         Đọc link YouTube, khung video "bấm mới tải" (youtube-nocookie)
js/pose-scoring.js    Tính góc, chấm điểm, đếm giữ/lần; nạp MediaPipe khi cần
js/practice.js        Tab Tự tập: camera / tải video, vẽ khung xương, bảng kết quả
js/teacher.js         Trang giáo viên: tình trạng, trình soạn, đăng lên GitHub
js/data.js            Nạp exercises.json + media.json + bản nháp
js/ai-chat.js         (Phase 2, chưa dùng) chỗ để sẵn cho hỏi đáp AI
data/exercises.json   Toàn bộ nội dung
data/media.json       Sinh tự động khi deploy từ media/sach/
media/sach/<id>/      Ảnh trang sách theo bài
mp/                   MediaPipe Tasks Vision 0.10.21 + mô hình pose_landmarker_lite (tự host)
tools/                Sinh media.json, kiểm tra dữ liệu, test chấm điểm
.github/workflows/pages.yml   Deploy GitHub Pages
```

Đường dẫn trực tiếp: `#bai/g8-squat` (Hướng dẫn), `#bai/g8-squat/video`, `#bai/g8-squat/sach`, `#bai/g8-squat/tu-tap`, `#giao-vien/g8-squat`. Thầy cô có thể dán link này vào nhóm lớp.

## 6. Quyền riêng tư

- Không đăng nhập, không cookie theo dõi, không analytics.
- Hình camera / video tải lên chỉ xử lý trong trình duyệt, không lưu, không gửi đi. Camera tự tắt khi đóng bài, đổi tab hoặc ẩn trang.
- Video YouTube dùng `youtube-nocookie.com` và chỉ tải khi học sinh bấm Play.
- Giọng nói: do trình duyệt nhận dạng (Chrome gửi âm thanh tới dịch vụ nhận dạng của Google). Trang web không lưu lại. Học sinh luôn có thể gõ thay vì nói.

## 7. Phase 2 (chưa làm, đã để sẵn chỗ)

- **Quay video mẫu → tự sinh góc mục tiêu** cho phần `scoring`.
- **Hỏi đáp AI tự do (Gemini)**: chỉ gọi qua **Cloudflare Worker** làm proxy giữ API key (xem `js/ai-chat.js`). Không bao giờ đặt key trong front-end. Không gửi ảnh/video học sinh lên gói miễn phí (Google dùng dữ liệu gói miễn phí để cải thiện sản phẩm).
- **Đăng nhập theo lớp, lưu điểm cho giáo viên**: cần nhà trường đồng ý và sự đồng ý của phụ huynh theo Luật Bảo vệ dữ liệu cá nhân 2025.

## 8. Hỗ trợ trình duyệt

| | Tìm kiếm | Nói để tìm | Video | Camera + chấm điểm |
|---|---|---|---|---|
| Chrome Android | ✓ | ✓ | ✓ | ✓ |
| Safari iOS 15+ | ✓ | ✓ (cần bật Siri/Đọc chính tả) | ✓ | ✓ |
| Chrome / Edge laptop | ✓ | ✓ | ✓ | ✓ |
| Firefox | ✓ | ✗ (hiện thông báo, gõ thay) | ✓ | ✓ |

Lần đầu mở tab “Tự tập”, máy tải khoảng 15 MB (thư viện + mô hình), các lần sau dùng bộ nhớ đệm. Nên tải trước bằng Wi-Fi của trường.
