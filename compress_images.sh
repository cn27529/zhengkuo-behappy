#!/bin/bash
# 用法: ./compress_images.sh /path/to/source /path/to/destination [max_width]

SRC_DIR="$1"
DST_DIR="$2"
MAX_WIDTH="$3"   # 可選，例如 1200（不填就不縮圖）

if [[ -z "$SRC_DIR" || -z "$DST_DIR" ]]; then
    echo "用法: $0 /來源資料夾 /輸出資料夾 [最大寬度(可選)]"
    exit 1
fi

mkdir -p "$DST_DIR"

echo "開始轉換 PNG → WebP..."

for img in "$SRC_DIR"/*.png; do
    [[ -e "$img" ]] || continue

    filename=$(basename "$img" .png)
    output="$DST_DIR/$filename.webp"

    if [[ -n "$MAX_WIDTH" ]]; then
        # 有指定縮圖
        ffmpeg -y -i "$img" -vf "scale='min($MAX_WIDTH,iw)':-1" -c:v libwebp -q:v 80 "$output"
        echo "已轉換(含縮圖): $filename.webp"
    else
        # 不縮圖
        ffmpeg -y -i "$img" -c:v libwebp -q:v 80 "$output"
        echo "已轉換: $filename.webp"
    fi
done

echo "全部完成 ✅"