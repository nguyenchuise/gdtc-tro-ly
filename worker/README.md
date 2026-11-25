# Worker lưu kết quả tự tập (Google Sheet + Drive)

Worker này nhận kết quả một lần tập từ trang GDTC rồi **gọi thẳng Google API** để ghi một dòng vào
Google Sheet và tạo một thư mục ảnh trong Google Drive. **Khoá không nằm trong repo** — đặt bằng
`wrangler secret`. Mã nguồn: [`gdtc-ket-qua.js`](gdtc-ket-qua.js).

> Vì tài khoản là Gmail thường, Worker dùng **refresh token OAuth của một tài khoản Google thật** (không
> dùng tài khoản dịch vụ — loại đó không tải được ảnh vào Drive của Gmail vì không có hạn mức lưu trữ).
>
> **Dùng đúng tài khoản sở hữu Sheet tổng và thư mục Drive.** Nếu đăng nhập bằng tài khoản khác, hãy mở
> Sheet và thư mục đó → **Chia sẻ** → thêm tài khoản đăng nhập làm **Người chỉnh sửa**.

## Cài một lần

### 1. Bật API trong Google Cloud
1. Vào <https://console.cloud.google.com> → tạo (hoặc chọn) một project.
2. **APIs & Services → Enable APIs** → bật **Google Sheets API** và **Google Drive API**.

### 2. Tạo OAuth client
1. **APIs & Services → OAuth consent screen**: chọn **External**, điền tên app, thêm chính email của cô
   vào mục **Test users**. (Để ở chế độ "Testing" là đủ.)
2. **APIs & Services → Credentials → Create credentials → OAuth client ID** → kiểu **Desktop app**.
3. Chép lại **Client ID** và **Client secret**.

### 3. Lấy refresh token (một lần)
1. Mở <https://developers.google.com/oauthplayground>.
2. Bấm bánh răng (góc phải) → tick **Use your own OAuth credentials** → dán Client ID + Client secret.
3. Ở ô **Input your own scopes** (bên trái), dán hai dòng này rồi **Authorize APIs**:
   ```
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/drive
   ```
4. Đăng nhập bằng **tài khoản sở hữu Sheet/Drive** (xem lưu ý ở đầu) → **Allow**.
5. Bấm **Exchange authorization code for tokens** → chép **Refresh token**.
   > Nếu báo lỗi redirect: trong màn hình OAuth client (bước 2), thêm
   > `https://developers.google.com/oauthplayground` vào **Authorized redirect URIs**, lưu, rồi làm lại.

### 4. Đặt bí mật và biến cho Worker
Trong thư mục `worker/`:
```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
# tuỳ chọn:
npx wrangler secret put ADMIN_TOKEN   # chuỗi tự đặt, để đọc dữ liệu qua GET
npx wrangler secret put APP_TOKEN     # chuỗi tự đặt, chặn người lạ gửi bừa
```
Mở [`wrangler.toml`](wrangler.toml) điền `SHEET_ID` và `DRIVE_FOLDER_ID` (lấy từ URL Sheet/Folder của cô).

### 5. Triển khai
```bash
npx wrangler deploy
```
Chép **địa chỉ Worker** in ra (dạng `https://gdtc-ket-qua.<tài-khoản>.workers.dev`) rồi gửi cho tôi —
tôi gắn vào trang và test.

## Dữ liệu trang gửi lên (POST, `Content-Type: text/plain`)
```json
{
  "sessionId": "YYYYMMDD_HHmmss_TenBai_123",
  "exerciseName": "Tên đầy đủ của bài",
  "bestScore": 92,
  "errors": ["lỗi tư thế 1", "lỗi tư thế 2"],
  "images": [{ "label": "best_score", "base64": "data:image/jpeg;base64,..." }],
  "token": "<APP_TOKEN nếu có đặt>"
}
```
Mỗi lần tập → một thư mục con `sessionId` trong Drive (chứa ảnh) + một dòng trong Sheet
(thời gian, sessionId, tên bài, điểm, lỗi, link thư mục, link từng ảnh).

## Đọc lại dữ liệu
`GET https://…workers.dev/?token=<ADMIN_TOKEN>` → trả về JSON các dòng trong Sheet.
Không có token đúng thì bị từ chối (để học sinh không đọc được dữ liệu của nhau).
