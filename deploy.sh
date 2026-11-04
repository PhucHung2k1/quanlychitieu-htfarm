#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Bắt đầu quá trình Deploy HT FARM..."
echo "=========================================="

# 1. Kéo code mới nhất từ GitHub
echo "📥 [1/4] Kéo mã nguồn mới từ Git..."
git pull origin main

# 2. Build Docker images
echo "🔨 [2/4] Build Docker images..."
docker compose -f docker-compose.prod.yml build

# 3. Khởi động lại containers
echo "🔄 [3/4] Khởi động lại containers..."
docker compose -f docker-compose.prod.yml up -d

# 4. Tự động dọn dẹp cache và image cũ (Giải phóng 100% dung lượng thừa)
echo "🧹 [4/4] Dọn dẹp BuildKit Cache và Image rác..."
docker image prune -f
docker builder prune -af

echo "=========================================="
echo "📊 Kiểm tra dung lượng đĩa thực tế:"
df -h /
echo "=========================================="
echo "✅ Deploy hoàn tất thành công và sạch sẽ!"
