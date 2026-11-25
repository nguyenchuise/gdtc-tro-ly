# Cách 2 (đơn giản hơn): Google Apps Script thay cho Cloudflare Worker

Cách này **không cần Client ID / Client secret / Refresh token**, nên bỏ qua được toàn bộ phần
OAuth và phần khai Secret trên Cloudflare. Script chạy bằng quyền của chính tài khoản triển khai,
chỉ cần bấm **Cho phép** một lần.

Dùng cách này thì **không cần** worker `gdtc-ket-qua` nữa.

## Các bước

1. Vào <https://script.google.com> → **New project** (hoặc mở dự án sẵn có).
2. Xoá hết code mẫu → dán toàn bộ nội dung [`Code.gs`](Code.gs) → bấm **Lưu** (biểu tượng đĩa mềm).
3. Góc trên bên phải: **Deploy → New deployment**.
4. Bấm bánh răng **Select type → Web app**.
5. Điền:
   - **Execute as**: *Me* (tài khoản của cô)
   - **Who has access**: **Anyone** ← bắt buộc, để trang web gửi được
6. Bấm **Deploy** → Google hỏi quyền lần đầu:
   **Authorize access** → chọn tài khoản → **Advanced** → **Go to … (unsafe)** → **Allow**.
   (Hiện "unsafe" là bình thường vì đây là script của chính cô, chưa đăng ký với Google.)
7. Chép **Web app URL** — dạng `https://script.google.com/macros/s/AKfycb..../exec`

## Tự kiểm tra ngay

Dán URL `.../exec` vào trình duyệt. Thấy dòng này là **đã đúng**:

```json
{"ok":true,"note":"San sang nhan ket qua (POST)."}
```

Nếu báo lỗi hoặc đòi đăng nhập → quay lại bước 5, kiểm tra **Who has access = Anyone**.

## Sau đó

Gửi URL `.../exec` đó cho tôi. Tôi đổi một dòng `RESULT_ENDPOINT` trong `js/result-upload.js`
là trang bắt đầu gửi kết quả về Sheet + Drive.

> Lưu ý: mỗi lần sửa `Code.gs` phải **Deploy → Manage deployments → Edit → Version: New version → Deploy**
> thì bản mới mới có hiệu lực (URL `.../exec` giữ nguyên).

## Mã Sheet và thư mục

Đã ghi sẵn trong `Code.gs`:
- Sheet: `1LAAjFZbhnjNHcLCVVaThXYEDfFBTB5JyI39I4iN-X4I`
- Thư mục Drive: `1-Ci9d3KPkmW6WjWV3GRtJqaqk7y-fUBT`

Đổi Sheet/thư mục khác thì sửa hai dòng đầu của `Code.gs` rồi deploy lại.
