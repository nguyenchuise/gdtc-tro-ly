# GDTC Trợ lý tập luyện

Website tĩnh giúp học sinh THCS (lớp 6–9) hỏi bài Giáo dục thể chất bằng chữ hoặc giọng nói, xem hướng dẫn, video YouTube, trang sách giáo khoa kèm tóm tắt, rồi **tự tập trước camera** để AI chấm mức giống tư thế mẫu.

- **Chi phí 0 đồng**: host trên GitHub Pages, không có máy chủ (backend).
- **AI chạy trên máy học sinh** (MediaPipe Pose, tự host trong `mp/`) → 50 em dùng cùng lúc không tốn gì thêm.
- **Không thu thập dữ liệu**: không đăng nhập, không lưu và không gửi video đi đâu.

> Nội dung: **89 bài lớp 6 – 9 theo SGK Giáo dục thể chất – Kết nối tri thức với cuộc sống** (NXB Giáo dục Việt Nam). Phần, chủ đề, bài đúng mục lục sách; tóm tắt viết lại ngắn gọn (không chép nguyên văn); ảnh trang sách hiển thị trực tiếp từ sách điện tử của NXB (không lưu trong repo). Mọi bài vận động có Tự tập với camera; góc chấm là **ước lượng từ hình minh hoạ**, cần chỉnh dần theo thực tế. Chưa có mã video YouTube: tab Video hiện “cửa sổ chờ”.

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

### Mã vào trang giáo viên
Trang `#giao-vien` cần nhập mã (mặc định **1324**). Mã đúng được nhớ đến khi đóng tab; nút **Khoá lại** để thoát.

> Đây chỉ là khoá chống học sinh bấm nhầm, **không phải bảo mật thật**: trang tĩnh nên người rành kỹ thuật vẫn vượt qua được. Mã không nằm nguyên văn trong mã nguồn (chỉ có mã băm SHA-256). Quyền sửa nội dung thật sự vẫn cần **token GitHub** riêng của thầy cô.

Đổi mã: chạy lệnh dưới (thay `MÃ_MỚI`), rồi dán kết quả vào `CODE_HASH` trong `js/teacher-gate.js`:
```bash
printf '%s' 'gdtc:MÃ_MỚI' | sha256sum
```

### Cách 1: Trang giáo viên (khuyên dùng)
Mở `…/gdtc-tro-ly/#giao-vien`, nhập mã:
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
Trên GitHub, mở `media/sach/` → **Add file → Upload files**, gõ tên thư mục là mã bài, ví dụ `media/sach/g8-xuat-phat-thap/`, rồi thả ảnh `trang-24.jpg`, `trang-25.jpg`. Khi deploy, `tools/build-media-manifest.mjs` quét thư mục và sinh `data/media.json` → ảnh **tự hiện** ở tab “Sách giáo khoa” của bài, sắp theo số trang trong tên tệp. Không cần sửa JSON.

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

> Các góc mục tiêu hiện là ước lượng từ hình trong sách. Nên để thầy cô làm mẫu, xem bảng “Đo được” trên tab Tự tập, rồi chỉnh `target` cho khớp thực tế (Phase 2 sẽ tự động hoá việc này).

## 4. Tự tập và chấm điểm (học sinh)

- Trên hình camera, mỗi bộ phận hiện **nhãn % nổi** ngay cạnh khớp (xanh ≥ 80%, cam 50–79%, đỏ < 50%). Màn hình chật thì nhãn chỉ ghi số %.
- **Đạt** khi *mọi* bộ phận ≥ 80% liên tục **khoảng 1 giây** (bài giữ tư thế), hoặc **3 lần** đạt chuẩn (bài đếm lần).
- Chấm đã được **nới cho dễ đạt** (`EASE` trong `js/pose-scoring.js`): mỗi góc được lệch thêm 10° mà vẫn 100%, điểm giảm chậm hơn; làm gần đúng tư thế là được khoảng 80–100%. Bảng "Cần" vẫn ghi góc chuẩn trong sách.
- Khi đạt, trang **tự chụp ảnh ngay** (bài đếm lần: chụp đúng khoảnh khắc sâu nhất của lần tốt nhất) (kèm khung xương, % từng bộ phận, điểm, thời gian) và hiện thẻ **Kết quả lần này**. **Kết quả tốt nhất** được giữ lại; bấm **Tập lại để phá kỷ lục**, nếu lần sau cao hơn thì tự thay.
- Kết quả chỉ nằm trong trình duyệt khi đang mở trang, **không lưu, không gửi đi**; tải lại trang là mất. Học sinh có thể bấm **Lưu ảnh về máy** để cho thầy cô xem.

**Chấm trọn bộ (10 bài thể dục, `scoring.mode = "sequence"`).** Máy chấm lần lượt **từng nhịp** theo đúng các hình trong sách:
- Mỗi nhịp phải đúng mọi tiêu chí ≥ 80% và **giữ liên tục 1,5 giây** (`holdSeconds`). Đúng thì máy chụp ảnh nhịp đó và chuyển sang nhịp sau.
- Nhịp khó quá thì bấm **Bỏ qua nhịp** (nhịp đó tính 0 điểm).
- Hết bài mới có **điểm tổng = trung bình các nhịp**, kèm ảnh ghép tất cả các nhịp và điểm theo từng động tác.
- Bài nhịp điệu chọn được chấm *Cả bài* hoặc từng động tác.
- Mỗi nhịp (`steps[k]`) gồm `frame` (khung hình trong `bookAnim`) và `rules`. Ngoài rule góc, có rule theo vị trí, không nới thêm:
  - `dy`: tay cao hơn đầu / thấp hơn gối…
  - `dx`: hai chân rộng hơn vai, hai tay bắt chéo…
  - `torso`: thân gập.
  - `tilt`: nghiêng lườn.

  Đơn vị là bề rộng vai, xem chú thích trong `js/pose-scoring.js`.
- Tiêu chí là **ước lượng từ hình sách**, cần thầy cô thử và chỉnh.

**Hình mẫu chuyển động từ sách (bài thể dục).** 10 bài thể dục liên hoàn / nhịp điệu (lớp 6 – 9) có trường `bookAnim`: mỗi khung là
`{page, box: [x, y, rộng, cao], cap, label, group}` (toạ độ tỉ lệ 0–1 trên ảnh trang). Trang web chỉ "nhìn qua ô cửa sổ" vào ảnh trang
sách trên máy chủ NXB, không sao chép ảnh. Tab 1. Sách có trình chiếu đầy đủ (chọn động tác, ‹ ›, tốc độ); tab 4. Tự tập dùng nó làm
hình mẫu, chạy sẵn động tác máy chấm và đánh dấu "Máy chấm nhịp này". Không tải được ảnh sách thì tự quay về hình nộm.

Thứ tự tab trong mỗi bài: **1. Sách · 2. Video · 3. Hướng dẫn · 4. Tự tập**; mở bài mặc định vào tab Sách.
Giao diện ưu tiên điện thoại và iPad dùng ngoài sân trường: nút "Bật camera" luôn nổi ở mép dưới khi xem hình mẫu.

## 5. Chạy thử trên máy

```bash
python3 -m http.server 8080
```
Mở `http://localhost:8080`. Camera chạy được trên `localhost`; mở bằng IP trong mạng LAN (http) thì camera bị chặn, hãy dùng link GitHub Pages.

Kiểm tra dữ liệu và logic chấm điểm (cần Node 18+):
```bash
node tools/validate-data.mjs && node tools/test-scoring.mjs
```

## 6. Cấu trúc thư mục

```
index.html            Trang duy nhất (trang chủ, hộp chi tiết bài, trang giáo viên)
css/app.css           Giao diện (ưu tiên điện thoại)
js/app.js             Trang chủ, cây Lớp → Phần → Chủ đề, hộp chi tiết, định tuyến #bai/<id>/<tab>
js/search.js          Tìm kiếm bỏ dấu, nhận "lớp 6", "chủ đề 2", "phần 1", bỏ từ thừa
js/voice.js           Nói để tìm (Web Speech API, vi-VN)
js/youtube.js         Đọc link YouTube, khung video "bấm mới tải" (youtube-nocookie)
js/pose-scoring.js    Tính góc, chấm điểm, đếm giữ/lần; nạp MediaPipe khi cần
js/practice.js        Tab Tự tập: camera / video, nhãn % nổi, tự chụp ảnh khi đạt, kết quả tốt nhất
js/book-anim.js       Hình động ghép từ các hình "Nhịp" trong SGK (10 bài thể dục), cắt bằng CSS từ ảnh trang của NXB
js/pose-figure.js     Hình nộm tư thế mẫu vẽ từ góc chấm (dùng cho các bài còn lại)
js/teacher.js         Trang giáo viên: tình trạng, trình soạn, đăng lên GitHub
js/teacher-gate.js    Ô nhập mã vào trang giáo viên
js/data.js            Nạp exercises.json + media.json + bản nháp
js/ai-chat.js         (Phase 2, chưa dùng) chỗ để sẵn cho hỏi đáp AI
data/exercises.json   Toàn bộ nội dung
data/media.json       Sinh tự động khi deploy từ media/sach/
media/sach/<id>/      Ảnh trang sách theo bài
mp/                   MediaPipe Tasks Vision 0.10.21 + mô hình pose_landmarker_lite (tự host)
tools/                Sinh media.json, kiểm tra dữ liệu, test chấm điểm
.github/workflows/pages.yml   Deploy GitHub Pages
```

Đường dẫn trực tiếp: `#bai/g8-xuat-phat-thap` (tab 1. Sách), `#bai/g8-xuat-phat-thap/video`, `#bai/g8-xuat-phat-thap/huong-dan`, `#bai/g8-xuat-phat-thap/tu-tap`, `#giao-vien/g8-xuat-phat-thap`. Thầy cô có thể dán link này vào nhóm lớp.

## 7. Quyền riêng tư

- Không đăng nhập, không cookie theo dõi, không analytics.
- Hình camera / video tải lên chỉ xử lý trong trình duyệt, không lưu, không gửi đi. Camera tự tắt khi đóng bài, đổi tab hoặc ẩn trang.
- Video YouTube dùng `youtube-nocookie.com` và chỉ tải khi học sinh bấm Play.
- Giọng nói: do trình duyệt nhận dạng (Chrome gửi âm thanh tới dịch vụ nhận dạng của Google). Trang web không lưu lại. Học sinh luôn có thể gõ thay vì nói.

## 8. Phase 2 (chưa làm, đã để sẵn chỗ)

- **Quay video mẫu → tự sinh góc mục tiêu** cho phần `scoring`.
- **Hỏi đáp AI tự do (Gemini)**: chỉ gọi qua **Cloudflare Worker** làm proxy giữ API key (xem `js/ai-chat.js`). Không bao giờ đặt key trong front-end. Không gửi ảnh/video học sinh lên gói miễn phí (Google dùng dữ liệu gói miễn phí để cải thiện sản phẩm).
- **Đăng nhập theo lớp, lưu điểm cho giáo viên**: cần nhà trường đồng ý và sự đồng ý của phụ huynh theo Luật Bảo vệ dữ liệu cá nhân 2025.

## 9. Hỗ trợ trình duyệt

| | Tìm kiếm | Nói để tìm | Video | Camera + chấm điểm |
|---|---|---|---|---|
| Chrome Android | ✓ | ✓ | ✓ | ✓ |
| Safari iOS 15+ | ✓ | ✓ (cần bật Siri/Đọc chính tả) | ✓ | ✓ |
| Chrome / Edge laptop | ✓ | ✓ | ✓ | ✓ |
| Firefox | ✓ | ✗ (hiện thông báo, gõ thay) | ✓ | ✓ |

Lần đầu mở tab “Tự tập”, máy tải khoảng 15 MB (thư viện + mô hình), các lần sau dùng bộ nhớ đệm. Nên tải trước bằng Wi-Fi của trường.
