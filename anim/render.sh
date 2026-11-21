#!/bin/bash
# 書き出し：本編（字幕焼き込み・音あり）→ 縦型ショート → DaVinci用（字幕なし・音なし）
set -e
cd "$(dirname "$0")"
B="${CHROME:+--browser-executable=$CHROME} --concurrency=2 --log=error"
date +%s > ../out/render_start.txt
npx remotion render build Main ../out/main_1080p.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k $B
npx remotion render build Short ../out/short_9x16.mp4 --codec=h264 --crf=17 --audio-codec=aac --audio-bitrate=320k $B
npx remotion render build Main ../out/main_clean_noaudio.mp4 --codec=h264 --crf=14 --muted --props='{"withAudio":false,"captions":false}' $B
npx remotion still build ThumbA ../out/thumbnail_A.png $B
npx remotion still build ThumbB ../out/thumbnail_B.png $B
npx remotion render build MakingOf ../out/making_of_1080p.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k $B
date +%s > ../out/render_end.txt
echo ALLDONE
