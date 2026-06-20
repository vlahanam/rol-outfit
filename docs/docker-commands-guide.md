# Hướng Dẫn Chạy Docker Commands

## Thứ Tự Chạy Lệnh

### 1. Khởi Động Lần Đầu

```bash
# 1. Cấu hình biến môi trường
cp docker/.env.example docker/.env
# Chỉnh sửa docker/.env với thông tin database

# 2. Build và khởi động tất cả services
make rebuild
```

### 2. Restart Docker (Hàng Ngày)

```bash
# Dừng tất cả containers
make down

# Khởi động lại
make up
```

### 3. Xử Lý Lỗi Port Conflict

Nếu gặp lỗi `port is already allocated`:

```bash
# Kiểm tra container nào đang dùng port
docker ps | grep nginx

# Dừng container đang chiếm port
docker stop <container-name>

# Xóa container bị treo (nếu có)
docker rm <container-name>

# Khởi động lại
make up
```

### 4. Rebuild Khi Có Thay Đổi Code

```bash
# Rebuild và force recreate tất cả containers
make rebuild
```

## Danh Sách Lệnh Makefile

| Lệnh | Mô Tả |
|------|-------|
| `make up` | Khởi động tất cả services |
| `make down` | Dừng tất cả services |
| `make rebuild` | Build lại và khởi động (force recreate) |
| `make logs` | Xem logs realtime |
| `make ps` | Xem trạng thái containers |
| `make db-shell` | Truy cập PostgreSQL shell |
| `make backend-shell` | Truy cập backend container |
| `make frontend-shell` | Truy cập frontend container |
| `make seed` | Chạy database seeder |

## Database Commands

```bash
# Truy cập database
make db-shell

# Xem logs database
make db-logs

# Backup database
make db-dump

# Restore database
make db-restore FILE=docker/backup_xxx.sql

# Reset database (XÓA TẤT CẢ DỮ LIỆU)
make db-reset
```

## Frontend Commands

```bash
# Xóa cache và reinstall packages
make frontend-reinstall

# Chỉ xóa cache
make frontend-clear-cache
```

## Truy Cập Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost/api |
| PostgreSQL | localhost:5454 |

## Troubleshooting

### Container không khởi động

```bash
# Xem logs chi tiết
make logs

# Hoặc logs của service cụ thể
docker compose -f docker/docker-compose.yml logs backend
```

### Port 80 bị chiếm

```bash
# Tìm process đang dùng port 80
sudo lsof -i :80

# Hoặc dừng tất cả nginx containers
docker stop $(docker ps -q --filter "ancestor=nginx")
```
