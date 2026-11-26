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
- Thẻ kết quả có nút **Xuất PDF cho thầy cô**: phiếu một trang A4 (điểm, ảnh, từng phần/từng nhịp, ô nhận xét và chữ ký giáo viên), tạo ngay trên máy.
- Khi đạt, trang **tự chụp ảnh ngay** (bài đếm lần: chụp đúng khoảnh khắc sâu nhất của lần tốt nhất) (kèm khung xương, % từng bộ phận, điểm, thời gian) và hiện thẻ **Kết quả lần này**. **Kết quả tốt nhất** được giữ lại; bấm **Tập lại để phá kỷ lục**, nếu lần sau cao hơn thì tự thay.
- Kết quả nằm trong trình duyệt khi đang mở trang; tải lại trang là mất. Học sinh bấm **Lưu ảnh về máy** hoặc **Xuất PDF** để cho thầy cô xem.
- **Tự gửi kết quả cho thầy cô.** `RESULT_ENDPOINT` trong `js/result-upload.js` trỏ tới chỗ nhận — hiện là **Google Apps Script Web app**
  (`worker/apps-script/`, không cần khoá); phương án thay thế là Cloudflare Worker (`worker/gdtc-ket-qua.js`). Khi đã đặt,
  thì mỗi lần tập xong app tự gửi nền về Worker: `sessionId`, tên bài, điểm cao nhất, danh sách lỗi, 1 ảnh điểm cao nhất + tối đa
  2 khung lỗi (JPEG 0.7, ≤ 640px). Worker ghi một dòng vào Google Sheet và lưu ảnh vào một thư mục Drive theo `sessionId`.
  Mỗi lần hoàn thành chỉ gửi một lần; lỗi mạng chỉ ghi `console.error`. Khi bật gửi, trang nhắc *"Ảnh đã được lưu và gửi, em có thể
  lưu PDF để giữ lại."*; để trống `RESULT_ENDPOINT` thì không gửi và nhắc *"Ảnh đã được lưu, em có thể lưu PDF để giữ lại."*
- **Nút "Chấm luôn"** (bài không đếm nhịp): chốt kết quả với đúng những gì em đã làm được — điểm cao nhất đã đạt, hoặc số lần đã đạt.
  Tương đương nút **Bỏ qua nhịp** của bài đếm nhịp. Vẫn có ảnh, phiếu PDF và gửi kết quả như bình thường.
- **Giọng đọc và lời nhắc "Chưa đạt" có ở mọi bài** (nút 🔊/🔇; máy không có giọng tiếng Việt thì chỉ hiện chữ):
  vào bài đọc yêu cầu và hiện chữ to giữa khung camera (tự ẩn sau 5 giây); **chưa đạt quá 5 giây** thì đọc và hiện lý do cụ thể
  (suy ra từ bộ phận điểm thấp nhất, vd *"Khuỷu tay co khoảng 90°: gập lại thêm khoảng 90 độ"*), rồi **nhắc lại mỗi 10 giây**
  cho tới khi làm đúng. Xem `TELL_FIRST` / `TELL_AGAIN` và `tellWhy()` trong `js/practice.js`.

**Chấm trọn bộ (10 bài thể dục, `scoring.mode = "sequence"`).** Máy chấm lần lượt **từng nhịp** theo đúng các hình trong sách:
- Mỗi nhịp đạt khi máy thấy ít nhất một nửa số bộ phận và **quá nửa số bộ phận thấy được đạt ≥ 80%** (bộ phận bị khuất, vd chân, không chặn nhịp) và **giữ liên tục 1 giây** (`holdSeconds`). Tiêu chí được nới vừa phải (góc +8°, vị trí +¼ bề rộng vai, xem `easeSeq` trong `js/practice.js`). Đúng thì máy chụp ảnh nhịp đó và chuyển sang nhịp sau.
- Thử **10 giây** (`autoSkipSeconds`, chỉ tính lúc máy thấy người; nhịp đầu thêm 5 giây) mà chưa được thì **tự sang nhịp sau** (tính 0 điểm). Vẫn có nút **Bỏ qua nhịp**.
- Mỗi nhịp có câu hướng dẫn ngắn (`steps[k].say`): hiện **chữ to giữa khung camera** và **đọc bằng giọng tiếng Việt có sẵn trong máy** (nút 🔊/🔇; máy không có giọng tiếng Việt thì chỉ hiện chữ).
- Hình mẫu trong khung camera mặc định **to** (cao gần bằng khung) để nhìn từ xa 2–3 m; bấm vào để đổi to → nhỏ → ẩn.
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
js/book-anim.js       Hình động ghép từ các hình "Nhịp" trong SGK (10 bài thể dục, mục 2. Video), cắt bằng CSS từ ảnh trang của NXB
js/figure-anim.js     Mục 2. Video: bạn mẫu phía sau nhân tạo (trái) + ảnh gốc SGK chạy động (phải), cùng nhịp
js/figures/<id>.*.js  Hình vector từng bài, SINH TỰ ĐỘNG từ tệp Gemini bằng tools/import-gemini-figure.mjs
tools/gemini-src/     Tệp Gemini gốc, tệp chỉnh cho khớp SGK (<id>.fix.json), câu lệnh mẫu HUONG-DAN-GEMINI.md
js/pose-figure.js     Hình nộm tư thế mẫu vẽ từ góc chấm (bài chưa có data/sgk-poses.json)
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

### Mục 2. Video: cùng một khung cho mọi bài

Mọi bài có mục 2. Video giống bài mẫu lớp 6 (nhịp 1–11).

Hàng trên chia **hai cột chạy cùng nhịp**, để đối chiếu ngay và phát hiện sai lệch:

| Cột | Nội dung | Khi chưa có |
|---|---|---|
| Trái: ① Bạn mẫu tập cùng em | Góc nhìn **phía sau** dựng nhân tạo (tệp Gemini), có điểm khớp AI | Bài có chấm điểm: **hình nộm đi lần lượt theo từng hình SGK** (`data/sgk-poses.json`, sinh bằng `tools/sgk-poses/`), cùng nhịp với ảnh sách, hình đúng tư thế máy chấm có ★. Sách chỉ có sơ đồ/cảnh đông người: hình nộm vẽ từ góc máy chấm. Bài không chấm: "sắp có". |
| Phải: ② Động tác trong sách | **Ảnh gốc SGK** chạy động. Góc phía trước giữ đúng sách, không dựng lại. | "Chưa có hình động", kèm link sang mục 1. Sách |

- Hàng điều khiển có nút **🔊 Đọc nhịp**: đọc tên nhịp và câu hướng dẫn mỗi khi đổi nhịp (giọng 1,2×), **đọc xong mới sang nhịp sau**
  Động tác **chạy liền mạch hết nhịp rồi mới dừng** ở đúng tư thế (không khựng nửa chừng): hình nộm chờ `t` chạm số nguyên, mô hình 3D
  do `js/fig3d-bridge.js` tự dừng khi `frac ≥ 0,92`. Tên động tác / câu mô tả trùng nhịp trước thì bỏ cho đỡ lặp. Xem `js/video-voice.js`.

Bên dưới là ③ **Video hướng dẫn**: video YouTube hoặc video của thầy cô; chưa có thì "Video sắp có".

Ảnh trang sách tĩnh và ý chính chỉ nằm ở **mục 1. Sách**.

Hình động trong sách (`bookAnim`) có ở **cả 89/89 bài**.
- Khung được cắt từ ảnh trang SGK theo chú thích "Hình N": đọc chữ bằng tesseract, tách từng người trong chuỗi động tác.
- Hình trò chơi, sơ đồ sân và đội hình tập không được lấy.
- Ở mục 4. Tự tập, các khung này cũng là hình mẫu trước khi tập và trong khung camera.
- Bài trong SGK chỉ có hình trò chơi (luyện tập phối hợp, bổ trợ) dùng chính các hình trò chơi đó. Vẫn bỏ hình trò chơi khởi động đầu bài.

Cột ① của cả 10 bài thể dục dùng hình dựng nhân tạo:
- Lớp 6 nhịp 1–11: hình vector 2.5D, có trục giữa và dấu chân để thấy rõ bước trái ở nhịp 8.
- 9 bài còn lại (lớp 6 nhịp 12–23 và 24–30, lớp 7 cả 3 bài, lớp 8 hai bài, lớp 9 hai bài): **mô hình 3D (Three.js)**.

Mô hình 3D được tô kiểu tranh SGK (màu phẳng, nét viền đậm) bằng `js/fig3d-style.js`.

Mô hình 3D được nhúng từ `figures3d/<mã-bài>.html` và điều khiển qua `js/fig3d-bridge.js`. Nhịp được ghép với ảnh SGK theo tên; nhịp nào SGK không in hình thì ghi rõ. Ghép tệp 3D mới:

```bash
node tools/import-3d-figure.mjs <mã-bài> <tệp-3d.html>
```

Thư viện Three.js 0.147.0 (giấy phép MIT) được lưu sẵn ở `vendor/`, để mạng trường chặn CDN vẫn chạy được.

Thêm hình phía sau (bản vector 2.5D cũ) cho một bài:
1. Nhờ Gemini vẽ theo `tools/gemini-src/HUONG-DAN-GEMINI.md`. Chỉ cần một tệp, góc nhìn phía sau.
2. Ghép vào trang:

```bash
node tools/import-gemini-figure.mjs <mã-bài> <tệp-phía-sau.html>
```

Số tư thế phải bằng số nhịp của bài, để chạy cùng nhịp với ảnh SGK; công cụ báo lỗi nếu lệch. Chỗ nào lệch so với hình SGK thì chỉnh trong `tools/gemini-src/<mã-bài>.fix.json` rồi chạy lại lệnh trên. Không sửa tay các tệp trong `js/figures/`.

### Tác giả, ảnh trường và nhạc nền

- Ảnh sân trường ở nền khối đầu trang và trong thẻ "Đơn vị triển khai" cuối trang chủ: `media/truong/san-truong-1..3.webp`. Thay ảnh thì giữ đúng tên tệp (xem `media/truong/HUONG-DAN.md`).

- Thông tin tác giả nằm ở dải đầu trang, thẻ cuối trang và chân phiếu PDF: Cô Quý Anh, Trường THCS Nguyễn Tất Thành. Sửa trong `index.html` và `js/report-pdf.js`.
- Nhạc nền (`js/music.js`):
  - Tự bật ở lần chạm đầu tiên; tắt khi em bật camera hoặc video tự tập; nút ♪ để bật, tắt.
  - Đang dùng "Workout Music" (prettyjohn1) trong `media/nhac/`. Không có tệp nào thì trang phát giai điệu tự soạn bằng WebAudio.
  - Muốn dùng bài khác, thả một tệp nhạc có quyền sử dụng vào `media/nhac/` (xem `media/nhac/HUONG-DAN.md`). Khi deploy, trang tự dùng tệp đó.

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
