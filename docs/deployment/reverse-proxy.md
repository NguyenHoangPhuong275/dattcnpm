# Cấu hình Reverse Proxy an toàn

> Tài liệu bổ trợ cho **Task 1.2 — Proxy Header Hardening**. Mục tiêu: đảm bảo
> IP client mà ứng dụng nhìn thấy (`getClientIp` trong `src/lib/rate-limit.ts`)
> là IP THẬT, không thể bị giả mạo qua header để bypass `WEBHOOK_IP_ALLOWLIST`
> hoặc rate limiter.

## 1. Vì sao quan trọng

Ứng dụng lấy IP client từ header `X-Forwarded-For` (XFF) / `X-Real-IP` vì nó
chạy sau reverse proxy. Nếu proxy **không** kiểm soát các header này, một client
độc hại có thể tự gửi:

```
X-Forwarded-For: 10.0.0.1
```

để giả mạo một IP nằm trong allowlist và thực hiện thao tác webhook nhạy cảm,
hoặc né rate limit.

Cơ chế phòng thủ trong code (`resolveClientIp`):

- Chuỗi XFF được **bóc từ phải sang trái**, loại bỏ các hop là proxy tin cậy.
- Proxy tin cậy = các dải nội bộ mặc định (`127.0.0.0/8`, `10.0.0.0/8`,
  `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1/128`, `fc00::/7`,
  `fe80::/10`) **cộng** các dải khai báo trong biến môi trường
  `TRUSTED_PROXY_CIDRS`.
- IP client thật là entry đầu tiên (tính từ phải) **không** thuộc proxy tin cậy.

Điều kiện để cơ chế này an toàn: **reverse proxy phải ghi đè (overwrite) XFF
bằng remote address của nó**, thay vì để client tự bơm giá trị vào.

## 2. Nginx (bắt buộc ghi đè XFF)

KHÔNG dùng `proxy_add_x_forwarded_for` nếu client là untrusted — nó **nối thêm**
giá trị client gửi vào đầu chuỗi. Hãy **ghi đè** bằng `$remote_addr`:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;

    # Ghi đè (KHÔNG dùng $proxy_add_x_forwarded_for) — chặn giả mạo từ client
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP       $remote_addr;

    proxy_set_header Host             $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Với cấu hình này, chuỗi XFF luôn chỉ có đúng IP kết nối thật → không thể giả mạo.

> Nếu có nhiều tầng Nginx, chỉ tầng ngoài cùng (tiếp xúc Internet) mới ghi đè;
> các tầng nội bộ phía sau dùng `$proxy_add_x_forwarded_for` và phải nằm trong
> dải private (đã được tin mặc định) hoặc khai báo trong `TRUSTED_PROXY_CIDRS`.

## 3. Cloudflare

Cloudflare gửi IP client thật qua header riêng `CF-Connecting-IP` và cũng nối vào
`X-Forwarded-For`. Để tin Cloudflare:

1. Whitelist **chỉ** cho phép traffic đến từ dải IP Cloudflare (firewall/Nginx
   `allow`/`deny`), tránh bị bỏ qua proxy.
2. Khai báo dải IP Cloudflare vào `TRUSTED_PROXY_CIDRS` để `resolveClientIp` bóc
   đúng hop Cloudflare và lấy IP client thật từ XFF.

Lấy dải IP cập nhật tại: <https://www.cloudflare.com/ips/>
(`https://www.cloudflare.com/ips-v4` và `/ips-v6`).

```env
TRUSTED_PROXY_CIDRS=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32
```

> Lưu ý: danh sách trên có thể thay đổi — cập nhật định kỳ từ trang chính thức.

## 4. Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `TRUSTED_PROXY_CIDRS` | rỗng | Dải CIDR proxy tin cậy (ngoài các dải nội bộ mặc định), phân tách bởi dấu phẩy. Rỗng = chỉ tin proxy nội bộ. |
| `WEBHOOK_IP_ALLOWLIST` | rỗng | IP được phép gọi các webhook event nhạy cảm/phá hủy. Trong production, rỗng = chặn (fail-closed). |

Set trong `.env` (xem `.env.example`). Sau khi đổi, **restart** server.

## 5. Checklist kiểm tra sau khi deploy

Sau khi cấu hình proxy, chạy các kiểm tra sau từ một máy **bên ngoài**:

- [ ] **Giả mạo XFF phải thất bại.** Gửi header giả, IP nhìn thấy phải là IP
      thật của bạn (không phải `10.0.0.1`):

  ```bash
  curl -s -X POST https://<domain>/api/webhook \
    -H 'x-webhook-secret: <SECRET_SAI>' \
    -H 'x-forwarded-for: 10.0.0.1' \
    -H 'content-type: application/json' \
    -d '{"event":"db.reset","data":{"confirm":true}}'
  # Kỳ vọng: 401 (sai secret). Nếu dùng secret đúng nhưng IP thật KHÔNG nằm
  # trong WEBHOOK_IP_ALLOWLIST → 403. IP 10.0.0.1 giả mạo KHÔNG được chấp nhận.
  ```

- [ ] **Allowlist hoạt động.** Từ IP nằm trong `WEBHOOK_IP_ALLOWLIST` + secret
      đúng → event nhạy cảm chạy được; từ IP khác → 403.
- [ ] **Rate limit theo đúng IP.** Spam endpoint search/login và xác nhận bị
      chặn theo IP thật (không phải tất cả gộp thành `unknown`).
- [ ] Header `X-Forwarded-For` đến ứng dụng chỉ chứa IP do proxy ghi (kiểm tra
      bằng log tạm hoặc endpoint debug trong môi trường dev).

## 6. Liên quan

- Code: `src/lib/rate-limit.ts` (`getClientIp`, `resolveClientIp`, `ipInCidr`).
- Webhook guard: `src/app/api/webhook/route.ts` (`isIpAllowedForRestrictedEvent`).
- Test: `tests/lib/proxy-ip.test.ts`, `tests/api/webhook/security.test.ts`.
