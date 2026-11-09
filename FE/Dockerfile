# Frontend: React (Vite หรือ Create React App) เสิร์ฟด้วย nginx
# แบ่ง 2 ขั้น: ขั้นแรกใช้ Node build เป็นไฟล์ static ขั้นสองเหลือแค่ nginx ทำให้ image เล็ก

# ---------- ขั้น build: แปลงโค้ด React เป็นไฟล์ HTML/JS/CSS ----------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vite build ออกที่ dist/ ส่วน Create React App ออกที่ build/ รองรับทั้งสองแบบ
RUN npm run build && if [ -d dist ]; then mv dist /out; else mv build /out; fi

# ---------- ขั้น run: nginx เสิร์ฟไฟล์ และส่ง /api ต่อไปที่ BE ----------
FROM nginx:alpine

# nginx แทนค่า ${BE_URL} และ ${PORT} ในไฟล์ template ให้เองตอน container เริ่มทำงาน
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /out /usr/share/nginx/html

# Render ส่งค่า PORT มาให้เอง ค่านี้ใช้ตอนรันในเครื่อง
ENV PORT=80
EXPOSE 80
