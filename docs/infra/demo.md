# Demo công khai song song với app thật (1 image, 2 container)

Mục tiêu: trên cùng domain `indiework.space` chạy được **hai bản app tách biệt**, cùng
một image GHCR, chỉ khác nhau đúng file env:

| Hostname                              | Phục vụ container | Database          | Dữ liệu                |
| ------------------------------------- | ----------------- | ----------------- | ---------------------- |
| `app.indiework.space`                 | `app`  (:3000)    | `indiework`       | **project thật** của bạn |
| `indiework.space` + `demo.indiework.space` | `demo` (:3001) | `indiework_demo`  | sample data (demo công khai) |

`indiework.space` (apex) là **trang giới thiệu** (landing). Vì apex trỏ vào container
`demo`, bấm **Log in** trên landing là vào thẳng demo — đúng như mong muốn.

## Vì sao cách này an toàn

Toàn bộ app được tham số hoá bằng env: database chọn 100% qua `DATABASE_URL`, đăng nhập
chỉ là một password ký vào cookie. Nên hai container cùng image + khác `.env` = **hai thế
giới tách hẳn**, không phải multi-tenant:

- DB khác nhau → người ngoài nghịch trên demo **không có đường nào chạm tới data thật**.
- `COOKIE_SECRET` khác nhau → session tạo ở demo **không bao giờ** mở được `app.indiework.space`.
- Demo là throwaway: bị nghịch thì [reset](#reset-demo) là sạch.

> Password trên demo (`APP_PASSWORD=demo`) là **public có chủ đích** — nó hiện sẵn trên
> màn login. Lớp bảo vệ thật là DB cô lập + reset định kỳ, không phải password.

## Chuẩn bị 1 lần (trên VPS)

Phần host (Postgres, Docker, Caddy, firewall) dùng lại nguyên
[deploy-vps.md Hướng 2](./deploy-vps.md#hướng-2--postgres-trên-host) và [ci-cd.md](./ci-cd.md).
Chỉ bổ sung:

### 1. Tạo database demo

```bash
sudo -u postgres createdb -O indiework indiework_demo
```

### 2. Tạo `~/indiework/.env.demo`

Copy từ [`.env.demo.example`](../../.env.demo.example), `chmod 600`, **không** vào git.
Bắt buộc khác `.env` ở `DATABASE_URL` (→ `indiework_demo`) và `COOKIE_SECRET`:

```env
DATABASE_URL=postgres://indiework:<pass>@host.docker.internal:5432/indiework_demo
APP_PASSWORD=demo
COOKIE_SECRET=<chuỗi-random-KHÁC-với-.env, >= 32 ký tự>
API_TOKEN=demo-token
DEMO_MODE=true
DEMO_HINT=demo
```

### 3. compose đã có sẵn service `demo`

[`compose.prod.yml`](../../docker/compose.prod.yml) đã khai báo cả `app` lẫn `demo`. Service
`demo` bind `127.0.0.1:3001:3000` và khởi động bằng `migrate → seed-sample → start`
(seed-sample re-runnable, nên mỗi lần restart tự seed lại 4 project demo).

### 4. Reverse proxy (Caddy)

Thêm vào `/etc/caddy/Caddyfile`:

```caddy
app.indiework.space {
    reverse_proxy 127.0.0.1:3000
}

indiework.space, demo.indiework.space {
    reverse_proxy 127.0.0.1:3001
}
```

```bash
systemctl reload caddy
```

Caddy tự xin TLS cho cả ba hostname. (Nginx + certbot cũng được — cùng ý tưởng: ba
`server` block, hai upstream `127.0.0.1:3000` và `:3001`.)

### 5. DNS

A record (cùng IP VPS) cho: apex `indiework.space`, `app`, `demo`.

## Deploy

CI/CD **không đổi** — vẫn build 1 image, push GHCR. Trên VPS:

```bash
cd ~/indiework
docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d    # dựng/cập nhật cả app lẫn demo
```

## Reset demo

Demo cho ghi tự do nên project khách tạo sẽ tồn đọng. [`scripts/reset-demo.sh`](../../scripts/reset-demo.sh)
truncate sạch DB demo rồi seed lại sample data. Hẹn cron (ví dụ 4h sáng mỗi ngày):

```cron
0 4 * * * cd /home/<user>/indiework && ./reset-demo.sh >> reset-demo.log 2>&1
```

> Cần `psql` trên host (gói `postgresql-client`) và file `compose.prod.yml` + `.env.demo`
> + `scripts/reset-demo.sh` nằm cùng `~/indiework`.

## Còn nên làm (chưa kèm trong patch này)

- **Rate-limit** cho `/login`, `/api/v1`, `/mcp` trên demo để chống spam. Demo là một
  process riêng nên một bộ limiter in-memory đơn giản là đủ — hỏi tôi nếu muốn thêm.
- Sau login trên apex, URL vẫn là `indiework.space/app` (không phải `demo.indiework.space`)
  vì login same-origin. Nếu muốn URL "đẹp" đúng `demo.…`, đổi nút Log in trên landing
  thành link tuyệt đối tới `https://demo.indiework.space` (đọc qua env runtime).
