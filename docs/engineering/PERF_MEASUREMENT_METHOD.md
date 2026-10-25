# Phương pháp đo hiệu năng P0

Áp dụng spec #3 §17.1–§17.2 và ADR-005/078. S0 cung cấp phương pháp và công cụ đo byte;
chưa có baseline artifact, chưa đặt budget và chưa kết luận form đạt mục tiêu.

1. **Mốc và chỉ số:** T1 = FCP của `entry.html` (shell visible). T2 = step đầu có nội dung thật,
   đo `performance.mark("form:visible")` và element timing. T3 = handler đã gắn, field đầu
   focus/nhập được, không còn chunk bắt buộc đang chờ, đo `performance.mark("form:ready")`.
   Báo riêng T1/T2/T3, FCP/LCP/CLS/INP, request tới T2/T3 và theo nhánh. INP cần kịch bản
   tương tác có định nghĩa; một click chỉ là proxy. Không dùng shell để kết luận form ready.
2. **Profile:** `lab-slow4g-cdp` = Chromium CDP, latency 150 ms, download 1.6 Mbps,
   upload 750 Kbps, CPU slowdown 4x; `lab-unthrottled` không throttle. Ghi rõ version
   Chromium/CDP và profile. Không báo TTFB từ CDP: delay của nó áp sau `responseStart`.
   TTFB cần throttle tầng mạng/proxy riêng. Firefox/WebKit đo unthrottled hoặc qua proxy.
3. **Lặp:** mỗi form × profile × cold/warm: bỏ một lần khởi động, đo 10 lần; báo trung vị,
   min, max và n. Cold dùng browser context mới cho từng lần; warm mở trang mới trong
   context đã prime cache, giữ cùng release. Không trộn kết quả cold và warm.
4. **Byte:** chạy `node tools/perf/src/cli.ts sizes <artifact-dir> --out <report.json>` với
   output ở ngoài thư mục artifact. `measureDir` trả `{files, skippedSymlinks, totals}`;
   từng file có path tương đối `/`, sắp tăng dần và raw/gzip/Brotli. Symlink không được
   theo; entry đặc biệt bị từ chối. Gzip level 9, Brotli quality 11 và size hint bằng raw.
   Totals là tổng các file nén riêng, không phải kích thước archive hay lượng transfer HTTP.
   Tách bootstrap JS, CSS ban đầu, runtime `core` + `entry`, từng group JS/CSS và IR theo
   inventory của `releaseId`. Giữ Node/zlib/Brotli version để so được kết quả.
5. **Sports Motion-none:** phải đồng thời có (a) Chunk Manifest không chứa module Motion,
   (b) tổng byte module Motion trong mọi chunk bằng 0, (c) log mạng Playwright không request
   chunk Motion. Tập module gồm thư viện `motion`, Motion Adapter và `@platform/motion-presets`;
   S2 khóa tập này từ manifest thật. Log mạng đơn lẻ chưa chứng minh module không nằm trong bundle.
6. **Envelope:** lưu tool/version, Chromium version, profile, n, `releaseId`, commit, CPU/RAM/OS,
   thời điểm UTC và nhãn **lab-only** trong `docs/evidence/<phase>/perf/<releaseId>/`.
   CLI ghi version tool, Node/zlib/Brotli, settings và `measuredAt`; metadata còn lại do runner S2
   bổ sung. `measuredAt` thay đổi, còn các size/path giữ nguyên với cùng input và toolchain.
7. **Budget S2:** chạy ba phiên độc lập, mỗi phiên build sạch rồi đo; trình bảng trung vị cho user.
   User chốt budget trước S2 DONE; CI fail khi vượt budget đã chốt (PERF-05). Chưa có số đo thì
   chưa PASS. VG-21: phương pháp có ở S0; baseline và budget vẫn OPEN cho S2.
8. **Build local:** lặp năm lần build sạch theo cách hyperfine, báo trung vị, từng lần và máy đo.
   Ghi rõ thời gian có bao gồm dependency install hay không; không lấy cache build làm clean build.
