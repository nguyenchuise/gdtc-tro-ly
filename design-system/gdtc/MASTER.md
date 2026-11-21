# Design System Master File — GDTC Trợ lý tập luyện

> **LOGIC:** Khi làm một trang, xem `design-system/gdtc/pages/[tên-trang].md` trước.
> Nếu có, quy tắc trong đó **ghi đè** file này. Nếu không, theo đúng file này.

**Nguồn:** sinh bằng skill ui-ux-pro-max (`"education fitness school accessible" --design-system --density 4 --motion 3`,
nhóm *Educational App*, phong cách *Claymorphism*), rồi **điều chỉnh theo yêu cầu của nhà trường**:
giữ màu xanh lá của trường, giữ font Be Vietnam Pro, nền “Accessible & Ethical”, clay chỉ làm điểm nhấn nhẹ,
chuyển động bằng CSS (không GSAP).
**Cập nhật:** 2026-11-21

**Người dùng:** học sinh THCS 11–15 tuổi (điện thoại là chính) và giáo viên thể dục, có người lớn tuổi.

---

## 1. Màu (token CSS trong `css/app.css`)

| Vai trò | Hex | Biến CSS | Tương phản | Ghi chú |
|---|---|---|---|---|
| Thương hiệu (trang trí, chữ lớn) | `#0f8a5f` | `--brand` | 4.4:1 với trắng | Chỉ dùng cho nền lớn, viền, biểu tượng — **không** cho chữ thường |
| Chính (nút, liên kết, chữ) | `#0b7350` | `--brand-ink` | 5.9:1 với trắng | Nút chính, chữ trên nền trắng |
| Chính đậm | `#075a3e` | `--brand-dark` | 8.3:1 | Hover, tiêu đề |
| Nền nhạt thương hiệu | `#ecf8f2` | `--brand-50` | | Nền chip, thẻ phụ |
| Thành tích | `#c2410c` | `--achieve` | 5.2:1 với trắng | Kỷ lục, kết quả tốt nhất |
| Chữ chính | `#0f1a14` | `--ink` | 17:1 | |
| Chữ phụ | `#5b6a64` | `--muted` | 5.7:1 | Không dùng xám nhạt hơn cho chữ |
| Nền trang | `#f3f6f4` | `--bg` | | Chỉ chế độ sáng |
| Thẻ | `#ffffff` | `--surface` | | |
| Viền | `#d5e0da` | `--line` | | Viền thẻ clay 2px |
| Lỗi | `#c0261a` | `--bad` | 5.6:1 | Luôn kèm chữ/biểu tượng |
| Đạt | `#15803d` | `--ok` | 5.0:1 | Luôn kèm chữ/số |
| Màu theo lớp | 6 `#047857` · 7 `#1d4ed8` · 8 `#6d28d9` · 9 `#c2410c` | `--g6..--g9` | ≥ 5:1 | Luôn kèm chữ “Lớp N” |

**Không** dùng màu làm tín hiệu duy nhất: đạt/chưa đạt luôn có chữ hoặc %.

## 2. Chữ

- **Font:** Be Vietnam Pro (đủ dấu tiếng Việt), dự phòng `system-ui`. *Không* dùng Baloo 2 / Comic Neue.
- **Cỡ gốc (v0.4, phong cách tinh gọn):** `html { font-size: 100% }` → 1rem = **16px**. Mọi cỡ chữ dùng `rem` để phóng to 200% không vỡ.
  (v0.3 dùng 18px nhưng trên điện thoại chữ quá to, che mất gợi ý khi tập với camera → giảm theo góp ý của nhà trường.)
- **Độ đậm:** thân 400, nút/tab/tiêu đề thẻ 600, tiêu đề trang và số lớn 700. Không dùng 800.
- Thân 1rem (16px), line-height 1.55. Phụ ≥ 0.75rem (12px) cho huy hiệu. Câu ngắn < 12 từ.
- Nút vẫn cao ≥ 48px dù chữ nhỏ hơn.

## 3. Khoảng cách (density 4/10 — Standard)

| Token | Giá trị |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |

## 4. Phong cách: Accessible & Ethical + Claymorphism nhẹ

- **Bo góc:** thẻ 20px, nút/ô nhập 16px hoặc tròn hẳn (pill).
- **Viền:** thẻ và nút phụ **2px** `--line` (clay), không dùng 3–4px để tránh nặng nề.
- **Bóng clay (2 lớp, mềm):**
  - `--clay`: `0 2px 0 rgba(15,40,28,.06), 0 10px 24px -8px rgba(15,40,28,.14), inset 0 1px 0 rgba(255,255,255,.9)`
  - `--clay-press`: `0 1px 0 rgba(15,40,28,.06), 0 4px 10px -6px rgba(15,40,28,.18), inset 0 2px 4px rgba(15,40,28,.06)`
- **Nhấn:** đổi bóng sang `--clay-press` trong 150ms, không dịch chuyển bố cục.
- **Không:** kính mờ trên chữ, nền tối, viền dày > 3px, bóng gắt.

## 5. Thành phần

### Nút
- Cao **≥ 48px**, có **biểu tượng SVG + chữ** (không nút chỉ có biểu tượng, không emoji).
- **Mỗi màn hình chỉ 1 nút chính** (`.btn--primary`: nền `--brand-ink`, chữ trắng). Còn lại là nút phụ (viền 2px).
- `cursor: pointer`, focus hiện rõ (viền xanh dương 3px).

### Chip / bộ lọc
- Cao ≥ 48px, chữ rõ; trạng thái chọn = nền `--brand-ink` + `aria-pressed="true"`.

### Thẻ bài tập
- Nền trắng, viền 2px, bóng `--clay`, sọc màu theo lớp bên trái, mũi tên “vào bài”.
- Toàn thẻ là một liên kết; tiêu đề ≤ 2 dòng.

### Ô nhập
- Có **nhãn hiện rõ** phía trên (không chỉ placeholder), chữ hướng dẫn ngay dưới, lỗi ngay cạnh ô.

### Hộp thoại
- Điện thoại: tấm trượt từ dưới lên; laptop: hộp giữa màn hình. Nút **“Đóng”** có chữ. Phím Esc đóng.

## 6. Chuyển động (motion 3/10 — Subtle, CSS thuần)

- Thời lượng 150–300ms, `ease-out` khi xuất hiện, nhanh hơn khi biến mất.
- Thẻ hiện ra: `opacity 0→1, translateY 8px→0`, 220ms, lệch nhau tối đa 6 thẻ.
- Không có hiệu ứng lặp vô hạn để trang trí (chỉ dùng cho “đang tải”, mic “đang nghe”).
- `@media (prefers-reduced-motion: reduce)` → tắt hết.

## 7. Bố cục trang chủ — mẫu “Bento Box Grid” (v0.3)

Tra cứu skill: `"bento grid modern app" --domain style` → **Bento Box Grid** (light mode, accessibility risk: low,
lưới 4→2→1 cột, bo 24px, bóng mềm) kết hợp *Feature-Rich Showcase* của nhóm Educational App; `--variance 7`.

1. **Hero 2 cột:** tiêu đề lớn + câu phụ + ô tìm (nút chính duy nhất “Tìm”) | minh hoạ màn hình chấm điểm
   (khung xương + nhãn % nổi + HUD điểm + huy hiệu “Kỷ lục mới!”). Minh hoạ chỉ hiện từ 900px.
2. **Bento “Bắt đầu nhanh”:** ô lớn “Tự tập với camera” (màu cam thành tích) + 4 ô lớp màu riêng
   (số lớp to, số bài, số bài chấm điểm). Lớp đang chọn có dấu ✓ và viền — không chỉ đổi màu.
3. **Bộ lọc Phần/Chủ đề** (hiện khi chọn lớp) → **danh sách** nhóm Lớp → Phần → Chủ đề, thẻ có hình minh hoạ theo môn.
4. **Điện thoại (< 760px):** thanh điều hướng dưới đáy 3 mục (Trang chủ · Tìm bài · Giáo viên), mỗi mục có biểu tượng + chữ.

Đường tới bài tập: **tối đa 3 lần chạm** (Ô lớp → Thẻ bài → Tab Tự tập).

### Trang Tự tập (bổ sung v0.4)
- Gợi ý sửa tư thế hiện **ngay trên hình camera** (dải tối mờ phía dưới, chữ trắng; xanh khi đang đúng).
- Khi camera chạy: ẩn thẻ mục tiêu, mẹo đặt máy và nút chọn nguồn để hình chiếm trọn màn hình (tối đa 70% chiều cao).

## 8. Không làm (Anti-patterns)

- ❌ Chế độ tối · ❌ Thuật ngữ khó · ❌ Emoji làm biểu tượng · ❌ Nút chỉ có biểu tượng
- ❌ Chữ < 4.5:1 · ❌ Đổi trạng thái tức thì (0ms) · ❌ Hover làm xô lệch bố cục
- ❌ Chỉ dùng màu để báo đạt/chưa đạt · ❌ Placeholder thay cho nhãn

## 9. Kiểm tra trước khi giao (Pre-Delivery)

- [ ] Không emoji làm biểu tượng; biểu tượng SVG cùng một kiểu (nét đặc 24×24)
- [ ] Mọi nút ≥ 48px, có chữ; `cursor: pointer`
- [ ] Mỗi màn hình 1 nút chính
- [ ] Tương phản chữ ≥ 4.5:1; focus nhìn rõ
- [ ] `prefers-reduced-motion` được tôn trọng
- [ ] 375px, 768px, 1024px, 1440px: không cuộn ngang
- [ ] Phóng to chữ 200%: không vỡ bố cục, không cuộn ngang
- [ ] Không nội dung nào bị thanh tiêu đề cố định che
- [ ] `node tools/validate-data.mjs && node tools/test-scoring.mjs` đạt; Lighthouse mobile ≥ 90
