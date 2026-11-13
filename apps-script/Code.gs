/**
 * THƯ GỬI HỘI NGHỊ — máy chủ Google Apps Script
 * - Nhận ảnh thư + lời chúc từ trang web, lưu ảnh vào Google Drive, ghi lời chúc vào Google Sheet
 * - Trả danh sách lời chúc cho phần "Triển lãm lời chúc"
 *
 * Cách dùng: xem HUONG-DAN.md. Lần đầu chạy hàm setup() một lần.
 * Ẩn một lời chúc khỏi triển lãm: bỏ tick ô "Hiển thị" trong Sheet.
 */

const FOLDER_NAME = 'Thư gửi Hội nghị đại biểu Hội Sinh viên Việt Nam Khoa Kinh tế 2025-2028';
const SHEET_TITLE = 'Lời chúc gửi Hội nghị';
const MAX_NAME = 60, MAX_ROLE = 100, MAX_MSG = 800;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const TZ = 'Asia/Ho_Chi_Minh';
const HEADERS = ['Thời gian', 'Họ tên', 'Chức vụ', 'Lời chúc', 'File ID', 'Link ảnh', 'Hiển thị'];

/** Chạy 1 lần để tạo thư mục + Google Sheet */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let folder;
  try { folder = DriveApp.getFolderById(props.getProperty('FOLDER_ID')); } catch (e) { folder = DriveApp.createFolder(FOLDER_NAME); }
  let imgFolder;
  try { imgFolder = DriveApp.getFolderById(props.getProperty('IMG_FOLDER_ID')); } catch (e) { imgFolder = folder.createFolder('Ảnh thư'); }
  let ss;
  try { ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID')); }
  catch (e) {
    ss = SpreadsheetApp.create(SHEET_TITLE);
    DriveApp.getFileById(ss.getId()).moveTo(folder);
  }
  const sh = ss.getSheets()[0];
  sh.setName('Lời chúc');
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#0b2470').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 220); sh.setColumnWidth(4, 480); sh.setColumnWidth(7, 80);
  sh.getRange('D:D').setWrap(true);
  props.setProperties({ FOLDER_ID: folder.getId(), IMG_FOLDER_ID: imgFolder.getId(), SHEET_ID: ss.getId() });
  Logger.log('Thư mục Drive: ' + folder.getUrl());
  Logger.log('Google Sheet: ' + ss.getUrl());
}

function store_() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('SHEET_ID')) setup();
  return {
    imgFolder: DriveApp.getFolderById(p.getProperty('IMG_FOLDER_ID')),
    sheet: SpreadsheetApp.openById(p.getProperty('SHEET_ID')).getSheets()[0],
  };
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // chặn công thức trong Sheet
  return s;
}

/** Nhận thư mới */
function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return out_({ ok: true, id: '' }); // bẫy chống spam bot

    const name = clean_(d.name, MAX_NAME);
    const role = clean_(d.role, MAX_ROLE);
    const message = clean_(d.message, MAX_MSG);
    if (!name || !message) return out_({ ok: false, error: 'Thiếu họ tên hoặc lời chúc' });

    const m = String(d.image || '').match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return out_({ ok: false, error: 'Ảnh không hợp lệ' });
    const bytes = Utilities.base64Decode(m[2]);
    if (bytes.length > MAX_IMAGE_BYTES) return out_({ ok: false, error: 'Ảnh quá lớn' });

    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      const s = store_();
      const stamp = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss');
      const ext = m[1] === 'png' ? 'png' : 'jpg';
      const safeName = name.replace(/^'/, '').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);
      const file = s.imgFolder.createFile(Utilities.newBlob(bytes, 'image/' + m[1], stamp + ' - ' + safeName + '.' + ext));
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { /* tài khoản tổ chức có thể chặn chia sẻ công khai */ }
      s.sheet.appendRow([new Date(), name, role, message, file.getId(), file.getUrl(), true]);
      s.sheet.getRange(s.sheet.getLastRow(), 7).insertCheckboxes().check();
      return out_({ ok: true, id: file.getId() });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

/** Trả danh sách lời chúc cho triển lãm (mới nhất trước) */
function doGet(e) {
  try {
    const sh = store_().sheet;
    const n = sh.getLastRow() - 1;
    const rows = n > 0 ? sh.getRange(2, 1, n, HEADERS.length).getValues() : [];
    const items = rows
      .filter(r => r[4] && r[6] !== false && String(r[6]).toUpperCase() !== 'FALSE')
      .map(r => ({
        time: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
        name: String(r[1]).replace(/^'/, ''),
        role: String(r[2]).replace(/^'/, ''),
        message: String(r[3]).replace(/^'/, ''),
        id: String(r[4]),
      }))
      .reverse();
    return out_({ ok: true, items });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}
