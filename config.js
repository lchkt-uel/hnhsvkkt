// ===== CẤU HÌNH =====
// Dán link Web App của Google Apps Script (kết thúc bằng /exec) vào đây.
// Để trống = chế độ thử: lời chúc chỉ lưu trên trình duyệt của máy đang dùng.
window.APP_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxUdcfFNuDSzaXRXDg9y6Axl9F-Gcs-9HBUgqPzqHjO8K5ANNnRERAzzkc4Z3x5zjsgfQ/exec",

  // Tự làm mới triển lãm sau mỗi bao nhiêu giây (0 = tắt)
  GALLERY_REFRESH_SECONDS: 60,

  // Nhạc nền "Bài ca sinh viên": chép file mp3 vào thư mục assets/ với đúng tên này (để "" nếu không dùng)
  MUSIC_SRC: "assets/bai-ca-sinh-vien.mp3",
  MUSIC_VOLUME: 0.45,

  // Thời gian mỗi lá thư trong chế độ trình chiếu (giây)
  SLIDESHOW_SECONDS: 7
};
