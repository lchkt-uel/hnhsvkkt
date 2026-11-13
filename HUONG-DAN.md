# Web "Thư gửi Hội nghị": hướng dẫn cài đặt

Trang web gồm 2 phần:
- **Thư mục `web/`**: trang tĩnh (HTML/CSS/JS), đăng miễn phí ở đâu cũng được.
- **`apps-script/Code.gs`**: chạy trên Google Drive của bạn. Khi có người bấm **Gửi**, ảnh thư được lưu vào thư mục Drive, lời chúc ghi vào Google Sheet. Phần triển lãm đọc lại từ Sheet đó.

Nếu chưa cấu hình Apps Script, web chạy ở **chế độ thử**: thư chỉ lưu trên trình duyệt của máy đang dùng.

---

## Bước 1: Tạo máy chủ Google Apps Script (khoảng 5 phút)

> Nên dùng **Gmail cá nhân** hoặc tài khoản của Liên Chi Hội. Tài khoản trường (Google Workspace) có thể chặn chia sẻ ảnh công khai, khi đó ảnh trong triển lãm sẽ không hiện được.

1. Vào https://script.google.com → **Dự án mới**.
2. Xóa code mẫu, dán toàn bộ nội dung file `apps-script/Code.gs`, rồi bấm **Lưu**.
3. Chọn hàm **`setup`** ở thanh trên → bấm **Chạy** → cấp quyền (Drive + Sheets).
   Mở **Nhật ký thực thi** sẽ thấy link thư mục Drive và link Google Sheet vừa tạo.
4. Bấm **Triển khai → Tùy chọn triển khai mới**:
   - Loại: **Ứng dụng web**
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
5. Bấm **Triển khai**, rồi sao chép **URL ứng dụng web** (kết thúc bằng `/exec`).
6. Mở `web/config.js`, dán URL vào `APPS_SCRIPT_URL`:
   ```js
   APPS_SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec",
   ```

> Nếu sau này sửa `Code.gs`: **Triển khai → Quản lý triển khai → ✏️ → Phiên bản: Mới**, để URL giữ nguyên.

## Bước 2: Nhạc nền "Bài ca sinh viên"

Chép file nhạc vào `web/assets/` và đặt tên là **`bai-ca-sinh-vien.mp3`** (hoặc đổi `MUSIC_SRC` trong `config.js`).
- Trình duyệt không cho tự phát nhạc có tiếng khi chưa tương tác. Web thử phát ngay khi mở; nếu bị chặn thì nhạc sẽ phát ở lần chạm hoặc bấm đầu tiên.
- Nút đĩa nhạc ở góc phải dưới dùng để bật/tắt. Web nhớ lựa chọn của từng người.
- Chưa có file nhạc thì nút tự ẩn.
- File nhạc nên nhỏ hơn khoảng 5MB (mp3 128kbps) để tải nhanh.

## Bước 3: Đăng web (chọn 1 cách)

- **Netlify Drop (dễ nhất):** vào https://app.netlify.com/drop, kéo thả cả thư mục `web/` vào. Có link ngay, có thể đổi tên miền con.
- **GitHub Pages:** đẩy thư mục `web/` lên một repository → Settings → Pages.
- **Vercel / Cloudflare Pages:** đều được, vì đây là trang tĩnh.

> Không mở trực tiếp `index.html` bằng cách nhấp đúp (file://), vì một số trình duyệt sẽ chặn tải khung thư. Hãy đăng lên một trong các cách trên, hoặc chạy thử trên máy bằng: `python -m http.server --directory web`.

## Quản lý khi đang chạy

- **Gom ảnh để đăng:** mở thư mục Drive → thư mục con **"Ảnh thư"** → chọn tất cả → **Tải xuống** (Drive nén thành file .zip). Ảnh có kích thước 2000×2000px và được đặt tên theo `thời gian - họ tên`.
- **Ẩn một lời chúc** (spam, sai thông tin): mở Google Sheet → bỏ tick cột **Hiển thị**. Triển lãm sẽ ẩn thư đó sau lần làm mới kế tiếp.
- **Sửa chữ trong triển lãm:** sửa trực tiếp ô Họ tên / Chức vụ / Lời chúc trong Sheet. Ảnh đã gửi thì không đổi.
- **Trình chiếu tại hội trường:** vào phần Triển lãm → **Trình chiếu** → nút toàn màn hình. Thư mới gửi trong lúc chiếu sẽ chen lên ngay kèm băng "Thư mới vừa đến".

## Tùy chỉnh nhanh

| Muốn đổi | Sửa ở đâu |
|---|---|
| 50 lời chúc gợi ý | `web/messages.js` |
| Link Apps Script, nhạc, thời gian trình chiếu, tần suất làm mới | `web/config.js` |
| Khung thư (ảnh nền) | `web/assets/frame.jpg` (2000×2000). Nếu đổi bố cục thì cập nhật tọa độ `L` ở đầu `web/app.js` |
| Màu sắc, giao diện | `web/styles.css` (biến màu ở đầu file) |

## Tính năng

- Chọn ảnh hoặc kéo thả ảnh vào. Kéo để di chuyển, cuộn chuột hoặc chụm 2 ngón để phóng to, xoay 2 ngón để xoay; có nút ± thu phóng, xoay 90°, thanh xoay tự do, lật ngang, căn giữa, đặt lại; chỉnh sáng, tương phản, bão hòa; dùng phím mũi tên để căn chỉnh tinh.
- Sửa tên, chức vụ, lời chúc và xem trước ngay. Chữ tự thu nhỏ cho vừa khung, lời chúc được căn đều hai bên.
- Nút Random lời chúc và Kho 50 lời chúc (có ô tìm kiếm).
- Tải ảnh PNG 2000×2000 về máy, hoặc Gửi về Drive.
- Triển lãm: tìm kiếm, sắp xếp Mới nhất / Ngẫu nhiên, xem chi tiết từng thư, trình chiếu toàn màn hình.
- Hiệu ứng thư mới: thẻ bay vào kèm phong bì mở, nhãn MỚI, viền sáng, thông báo "… vừa gửi thư", pháo giấy khi bạn gửi xong.
- Nháp được lưu tự động trên máy, tải lại trang không mất chữ đã gõ.
