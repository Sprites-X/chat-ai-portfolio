# Backend: Express + PostgreSQL + Gemini
FROM node:24-alpine

WORKDIR /app

# ติดตั้ง dependency ก่อนคัดลอกโค้ด เพื่อให้ Docker ใช้ cache ชั้นนี้ซ้ำได้เมื่อแก้แค่โค้ด
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# คัดลอกโค้ดทั้งโฟลเดอร์ ไฟล์ที่ไม่ควรติดไป (.env, node_modules, test) กันไว้ใน .dockerignore
COPY . .

ENV NODE_ENV=production
# Render ส่งค่า PORT มาให้เอง ค่านี้ใช้ตอนรันในเครื่อง
ENV PORT=5000
EXPOSE 5000

# รันด้วย user ที่ไม่ใช่ root
USER node

CMD ["node", "index.js"]
