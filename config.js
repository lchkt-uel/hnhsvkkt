// ===== CẤU HÌNH =====
// Dán link Web App của Google Apps Script (kết thúc bằng /exec) vào đây.
// Để trống = chế độ thử: lời chúc chỉ lưu trên trình duyệt của máy đang dùng.
window.APP_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxUdcfFNuDSzaXRXDg9y6Axl9F-Gcs-9HBUgqPzqHjO8K5ANNnRERAzzkc4Z3x5zjsgfQ/exec",

  // Tự làm mới triển lãm sau mỗi bao nhiêu giây (0 = tắt)
  GALLERY_REFRESH_SECONDS: 60,

  // Nhạc nền "Bài ca sinh viên"
  // Cách 1 (đang dùng): phát từ YouTube — dán mã video (phần sau "v=" trong link)
  MUSIC_YOUTUBE_ID: "FI5APBaKVYo",
  MUSIC_START: 0,            // bắt đầu từ giây thứ mấy
  // Cách 2: dùng file mp3 trong assets/ (nếu điền thì ưu tiên hơn YouTube)
  MUSIC_SRC: "",
  MUSIC_VOLUME: 0.45,

  // Thời gian mỗi lá thư trong chế độ trình chiếu (giây)
  SLIDESHOW_SECONDS: 7
};
