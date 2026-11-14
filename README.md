# ByteMind · Chat AI Portfolio

เว็บแอป Portfolio ของกลุ่ม ที่ผู้เยี่ยมชมพูดคุยกับ AI เพื่อถามเรื่องราว ผลงาน และทักษะของกลุ่มและสมาชิกแต่ละคนได้

**Live demo**
- เว็บไซต์: https://chat-ai-portfolio-fe.onrender.com
- Backend API: https://chat-ai-portfolio-be.onrender.com

> ใช้ Render แบบ Free: หากไม่มีผู้ใช้งาน 15 นาที service จะหลับ การเปิดครั้งแรกต้องรอประมาณ 1 นาที ระหว่างนั้นหน้าแชตจะส่งข้อความซ้ำให้เองจนกว่า BE จะตื่น

---

## สมาชิก

| ชื่อ | บทบาท | ทักษะหลัก | ติดต่อ |
|---|---|---|---|
| วรรณพร แก้วหาวงศ์ | Frontend (Portfolio + Chat UI) | React, JavaScript, HTML/CSS, UI/UX, Component Design | wannaporn.kaeo@bumail.net |
| ณัฐนิชา ภูสิงห์ | Backend + AI Integration | Node.js, Express, Gemini API Integration, Automated Testing (node:test), RESTful API Design, Git/GitHub | natnicha.phoo@bumail.net |
| พงศกร ศรีทอง | DevOps (Docker, CI/CD, Deployment) | Docker, Nginx, GitHub Actions (CI/CD), Trivy, Render, Unit Test | phongsakon.sith@bumail.net |

---

## Features

- **หน้า Portfolio** แนะนำกลุ่ม สมาชิกรายบุคคล ผลงาน และช่องทางติดต่อ
- **Chat UI** หน้าแชตที่แยกข้อความของผู้ใช้และ AI ชัดเจน แสดงคำตอบแบบ Markdown มีปุ่มคำถามตัวอย่างและปุ่มล้างแชต
- **รองรับตอน BE หลับ** ถ้า BE ยังไม่ตื่น หน้าแชตจะส่งข้อความซ้ำทุก 10 วินาที นานสุดราว 1 นาที
- **AI ที่ตอบจากข้อมูล Portfolio** ตอบได้ทั้งคำถามเกี่ยวกับกลุ่มโดยรวมและเกี่ยวกับสมาชิกแต่ละคน
- **ประวัติการสนทนา** เก็บในตาราง `chat_history` บน PostgreSQL
- **CI/CD อัตโนมัติ** push เข้า `main` แล้วระบบ test, build, scan และ deploy ให้เอง

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19 + Vite, axios, react-markdown, lucide-react เสิร์ฟด้วย Nginx |
| Backend | Node.js 24, Express 5 (JavaScript) |
| Database | PostgreSQL บน Neon |
| AI | Google Gemini API (`@google/genai`) |
| Container | Docker, Docker Hub |
| CI/CD | GitHub Actions, Trivy |
| Hosting | Render (Web Service) + Neon (Database) |

## Architecture

```mermaid
flowchart LR
  U[ผู้ใช้] --> FE[FE: React + Nginx]
  FE -->|/api/chat| BE[BE: Express API]
  BE --> DB[(PostgreSQL บน Neon)]
  BE --> AI[Gemini API]
```

หน้าเว็บส่งข้อความไปที่ `/api/chat` ของ FE เอง แล้ว Nginx ใน container ของ FE ส่งต่อไปที่ BE ตามค่า `BE_URL` จึงไม่ติด CORS
BE แนบข้อมูล Portfolio เป็น system instruction แล้วส่งคำถามให้ Gemini จากนั้นบันทึกคำถามและคำตอบลงตาราง `chat_history` แล้วส่งคำตอบกลับ

## โครงสร้างโปรเจกต์

```
.
├─ BE/                  # Express API + การเชื่อมต่อ AI
│  ├─ index.js          # server, API, การเชื่อม DB และ Gemini
│  ├─ server.test.js    # test เปิด server จริงแล้วยิง request (ไม่ต้องใช้ DB หรือ key)
│  ├─ api.test.js       # test เรียก app โดยตรง
│  ├─ Dockerfile
│  ├─ .dockerignore     # กัน .env และ node_modules ไม่ให้เข้า image
│  ├─ .env.example
│  └─ package.json
├─ FE/                  # React app (Vite)
│  ├─ src/              # App.jsx = หน้า Portfolio และ Chat UI
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ package.json
│  ├─ Dockerfile        # build ด้วย Node แล้วเสิร์ฟด้วย nginx
│  ├─ .dockerignore
│  └─ nginx/
│     └─ default.conf.template  # ส่ง /api ต่อไปที่ BE ตามค่า BE_URL
├─ .github/workflows/
│  └─ ci-cd.yml         # pipeline CI/CD
└─ README.md
```

---

## เริ่มต้นใช้งาน (รันในเครื่อง)

### สิ่งที่ต้องมี

- Node.js 24
- PostgreSQL (ใช้ connection string ของ Neon หรือ Postgres ในเครื่องก็ได้)
- Gemini API key จาก https://aistudio.google.com/apikey

### Backend

```bash
git clone https://github.com/Sprites-X/chat-ai-portfolio.git
cd chat-ai-portfolio/BE

# สร้างไฟล์ env จากตัวอย่าง แล้วใส่ค่าจริง
cp .env.example .env

npm ci
node index.js
```

BE จะรันที่ `http://localhost:5000` และสร้างตาราง `chat_history` ให้เองตอนเริ่มทำงาน

ลองยิง API:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"กลุ่มนี้มีจุดเด่นอะไร"}'
```

### Frontend

```bash
cd chat-ai-portfolio/FE
npm ci
npm run dev
```

เปิดเว็บที่ `http://localhost:5173`

หน้าเว็บเรียก BE ด้วย path สั้น `/api/chat` เสมอ ถ้าจะลองแชตตอนรันในเครื่อง ให้เพิ่มค่านี้ใน `vite.config.js` เพื่อให้ dev server ส่งต่อไปที่ BE:

```js
server: {
  proxy: {
    '/api': { target: 'https://chat-ai-portfolio-be.onrender.com', changeOrigin: true },
  },
},
```

บน Render หน้าที่นี้เป็นของ nginx ใน image ของ FE ซึ่งส่ง `/api/*` ต่อไปที่ `BE_URL`

> ห้าม commit ไฟล์ `BE/.env` ขึ้น repo ไฟล์นี้อยู่ใน `.gitignore` และ `.dockerignore` แล้ว

---

## Environment Variables

**Backend** (`BE/.env` ในเครื่อง หรือหน้า Environment ของ service บน Render)

| ตัวแปร | คำอธิบาย | ตัวอย่าง |
|---|---|---|
| `DATABASE_URL` | connection string ของ PostgreSQL | `postgresql://user:password@host/dbname?sslmode=require` |
| `GEMINI_API_KEY` | Gemini API key | `your_gemini_api_key` |
| `PORT` | พอร์ตของ server (Render ตั้งให้เอง) | `5000` |
| `GEMINI_MODEL` | โมเดล Gemini ตัวแรกที่ลองใช้ (ไม่ใส่ก็ได้) ถ้าไม่ว่างจะสลับไปโมเดลสำรองเอง | `gemini-3.8-flash` |

> หากไม่ได้ตั้ง `GEMINI_API_KEY` หรือ Gemini ตอบ error ที่ไม่ใช่เรื่องไม่ว่าง (เช่น key ผิด) บอทจะตอบเป็นข้อความ `[ระบบตอบรับอัตโนมัติ]` แทนคำตอบจาก AI

**Frontend** (หน้า Environment ของ service FE บน Render)

| ตัวแปร | คำอธิบาย | ตัวอย่าง |
|---|---|---|
| `BE_URL` | URL ของ BE ขึ้นต้นด้วย `https://` และ**ห้ามมี `/` ท้าย** | `https://chat-ai-portfolio-be.onrender.com` |
| `PORT` | พอร์ตของ nginx (Render ตั้งให้เอง) | `80` |

## API

| Method | Path | คำอธิบาย |
|---|---|---|
| `POST` | `/api/chat` | ส่งข้อความให้ AI ตอบ |

**`POST /api/chat`**

Request:

```json
{ "message": "ใครในกลุ่มถนัด Backend" }
```

Response `200`:

```json
{ "reply": "ข้อความคำตอบจาก AI" }
```

| สถานะ | เมื่อไร | Body |
|---|---|---|
| `400` | ไม่มี `message`, เป็นข้อความว่างหรือมีแต่ช่องว่าง, ไม่ใช่ข้อความ หรือไม่ได้ส่งมาเป็น JSON | `{ "error": "Message is required" }` |
| `400` | `message` ยาวเกิน 1,000 ตัวอักษร (ช่องพิมพ์ในหน้าเว็บก็จำกัดไว้ที่ 1,000) | `{ "error": "ข้อความยาวเกินไป (สูงสุด 1000 ตัวอักษร)" }` |
| `503` | Gemini ไม่ว่างทุกโมเดล (ตอบ 429/500/503) | `{ "error": "AI มีผู้ใช้งานเยอะ ลองใหม่อีกครั้งนะ" }` |

## AI ตอบจากข้อมูลอะไร

ข้อมูล Portfolio ของกลุ่มและสมาชิกทุกคนเก็บไว้ในค่าคงที่ `PORTFOLIO_CONTEXT` ใน `BE/index.js`
ทุกครั้งที่มีคำถาม BE จะส่งข้อมูลนี้ให้ Gemini เป็น `systemInstruction` และกำหนดให้ตอบโดยอ้างอิงข้อมูลนี้เท่านั้น

**สลับโมเดลอัตโนมัติ** (`askGemini` ใน `BE/index.js`) BE ลองโมเดลตามลำดับนี้ ถ้าโมเดลไหนตอบ `429`, `500` หรือ `503` จะลองตัวถัดไปทันที

1. ค่า `GEMINI_MODEL` (ค่าเริ่มต้น `gemini-3.8-flash`)
2. `gemini-3.5-flash-lite`
3. `gemini-3.8-flash`

ถ้าไม่ว่างทุกโมเดล BE ตอบ `503` ส่วน error อื่น เช่น key ผิด จะไม่ลองซ้ำ

ตัวอย่างคำถามที่ถามได้:
- จุดเด่นของโปรเจกต์นี้คืออะไร
- ใครดูแลส่วน DevOps และ CI/CD Pipeline
- ใครในกลุ่มถนัด Backend
- เล่าผลงานของวรรณพรให้ฟังหน่อย
- ติดต่อทีมได้ทางไหน

---

## Testing

```bash
cd BE
npm ci
node --check index.js   # ตรวจ syntax
node --test             # รัน test ทุกไฟล์ *.test.js
```

test ทุกข้อไม่ต้องใช้ฐานข้อมูลหรือ API key: กรณี error ไม่ไปถึง DB หรือ AI ส่วนกรณีปกติ ไม่มี key บอทจะตอบข้อความสำรอง และถ้าบันทึก DB ไม่ได้ BE ก็ยังตอบตามปกติ
- `server.test.js` เปิด server ด้วย `node index.js` แล้วยิง request เข้าไปจริง โดยตั้ง `DATABASE_URL` และ `GEMINI_API_KEY` เป็นค่าว่าง จึงไม่แตะของจริงแม้ในเครื่องจะมี `.env`
- `api.test.js` เรียก `app` ที่ `index.js` export ออกมา แล้วเปิดบนพอร์ตสุ่ม (server จริงเปิดเฉพาะตอนรัน `node index.js` โดยตรง)

| ไฟล์ | Test | คาดหวัง |
|---|---|---|
| `server.test.js` | `POST /api/chat` ไม่มี `message` | `400` พร้อม `error` |
| `server.test.js` | `POST /api/chat` `message` ว่าง | `400` |
| `server.test.js` | `POST /api/chat` ส่ง field ผิดชื่อ | `400` |
| `server.test.js` | `POST /api/chat` `message` มีแต่ช่องว่าง | `400` |
| `server.test.js` | `POST /api/chat` `message` เป็นตัวเลข | `400` |
| `server.test.js` | `POST /api/chat` `message` ยาวเกิน 1,000 ตัวอักษร | `400` และ `error` บอกขีดจำกัด |
| `server.test.js` | `POST /api/chat` body ไม่ใช่ JSON | `400` (ไม่ใช่ `500`) |
| `server.test.js` | `POST /api/chat` ข้อความปกติ | `200` พร้อม `reply` |
| `server.test.js` | `GET /api/chat` | `404` |
| `api.test.js` | `POST /api/chat` ไม่มี `message` | `400` และ `error` = `Message is required` |

ผลที่ถูกต้องคือ `tests 10`, `pass 10`

ฝั่ง FE ตรวจด้วยการ build ถ้า build ผ่าน แปลว่า React compile ได้ไม่มี error

```bash
cd FE
npm ci
npm run build
```

pipeline จะรันทั้งสองฝั่งให้อัตโนมัติทุกครั้งที่ push

---

## CI/CD

pipeline ใช้ GitHub Actions อยู่ในไฟล์ `.github/workflows/ci-cd.yml` ทำงานทุกครั้งที่ push และทุก Pull Request เข้า `main` ดูผลได้ที่แท็บ **Actions** ของ repo

```mermaid
flowchart LR
  P[git push] --> T[test] --> B[build] --> S[scan] --> D[deploy]
```

| ขั้น | Job | ทำอะไร | ทำงานเมื่อ |
|---|---|---|---|
| test | `test-be`, `test-fe` | ตรวจ syntax, test และ build ของ BE/FE | ทุก branch และ Pull Request |
| build | `build-be`, `build-fe` | build Docker image แล้ว push `:latest` และ `:<commit SHA>` ขึ้น Docker Hub | push เข้า `main` และโค้ดฝั่งนั้นเปลี่ยน |
| scan | `scan-be`, `scan-fe` | ตรวจช่องโหว่ด้วย Trivy ไม่ผ่านเมื่อพบ CRITICAL ที่แก้ไขได้แล้ว | หลัง build ผ่าน |
| deploy | `deploy-be`, `deploy-fe` | เรียก Deploy Hook ให้ Render ดึง image ล่าสุด | หลัง scan ผ่าน |

แต่ละ job ต่อกันด้วย `needs` หากขั้นใดไม่ผ่าน ขั้นถัดไปจะไม่ทำงาน โค้ดที่มีปัญหาจึงไม่ถูก deploy
สาย BE กับ FE แยกกัน ถ้าฝั่งหนึ่งพัง อีกฝั่งยัง deploy ได้ และถ้ายังไม่มีโฟลเดอร์ `FE/` job ฝั่ง FE จะขึ้นเป็น skipped

job `detect` เทียบไฟล์ที่ push แต่ละครั้งแก้ แล้ว build/deploy **เฉพาะฝั่งที่โค้ดเปลี่ยน**
- แก้ไฟล์ใน `BE/` → build และ deploy แค่ BE
- แก้ไฟล์ใน `FE/` → build และ deploy แค่ FE
- แก้ `.github/workflows/` → build ทั้งสองฝั่ง
- แก้แค่ไฟล์ `.md` → รัน test อย่างเดียว ไม่ build ไม่ deploy

test ยังรันทุกครั้ง ถ้าต้องการ deploy ใหม่ทั้งหมดโดยไม่แก้โค้ด ให้กด **Run workflow** ในแท็บ Actions

**Secrets and variables** (GitHub → Settings → Secrets and variables → Actions)

| ชื่อ | ค่า | ใส่ที่แท็บ |
|---|---|---|
| `DOCKERHUB_USERNAME` | ชื่อบัญชี Docker Hub | Variables |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Secrets |
| `RENDER_DEPLOY_HOOK_BE` | Deploy Hook URL ของ BE | Secrets |
| `RENDER_DEPLOY_HOOK_FE` | Deploy Hook URL ของ FE | Secrets |

ค่าใน Secrets จะถูกซ่อนใน log อัตโนมัติ ผู้ที่ตั้งค่าได้คือเจ้าของ repo หรือผู้ที่เป็น admin หาก repo อยู่ใน organization

ค่า `DATABASE_URL` และ `GEMINI_API_KEY` ไม่ได้อยู่ใน pipeline แต่ตั้งไว้ที่หน้า Environment ของ service บน Render

**การป้องกัน branch `main`** (Settings → Rules → Rulesets → `protect-main`)

- ต้องแก้ผ่าน Pull Request เท่านั้น push ตรงเข้า `main` จะถูกปฏิเสธ
- ต้องผ่าน status check `test-be` ก่อนถึงจะกด Merge ได้
- ห้าม force push และห้ามลบ `main`

**ขั้นตอนส่งงานเข้า `main`**

```bash
git checkout main
git pull
git checkout -b <ชื่อ-branch>
# แก้โค้ด
git add .
git commit -m "อธิบายสิ่งที่แก้"
git push -u origin <ชื่อ-branch>
```

แล้วเปิด Pull Request เข้า `main` บน GitHub ตรวจแท็บ **Files changed** ว่าแก้ถูกไฟล์ รอ check เขียวแล้วกด Merge

## Deployment

1. push เข้า `main` ครั้งแรกเพื่อให้ pipeline build image ขึ้น Docker Hub
2. เตรียม connection string ของฐานข้อมูลบน **Neon**
3. สร้าง **Web Service** บน Render จาก image `docker.io/spritessx/portfolio-be:latest` (Singapore) แล้วตั้ง `DATABASE_URL`, `GEMINI_API_KEY`
4. ทดสอบด้วย `curl -X POST https://chat-ai-portfolio-be.onrender.com/api/chat -H "Content-Type: application/json" -d '{"message":"สวัสดี"}'` ต้องได้ `reply` กลับมา
5. สร้าง **Web Service** จาก image `docker.io/spritessx/portfolio-fe:latest` (Singapore) แล้วตั้ง `BE_URL` = `https://chat-ai-portfolio-be.onrender.com` (ไม่มี `/` ท้าย)
6. คัดลอก Deploy Hook ของทั้งสอง service (Settings → Deploy Hook) ไปใส่ใน GitHub Secrets
7. จากนั้นทุกครั้งที่ push เข้า `main` เว็บจะอัปเดตเอง

## Troubleshooting

| อาการ | สาเหตุที่พบบ่อย | วิธีแก้ |
|---|---|---|
| บอทตอบ `[ระบบตอบรับอัตโนมัติ] ...` | ไม่ได้ตั้ง `GEMINI_API_KEY` บน Render หรือ key ผิด/ถูกลบ | ดู Logs ของ BE แล้วใส่ key ที่ถูกต้องในหน้า Environment |
| แชตได้ `503` "AI มีผู้ใช้งานเยอะ" | Gemini ไม่ว่างทุกโมเดล | รอสักครู่แล้วส่งใหม่ หรือเปลี่ยน `GEMINI_MODEL` บน Render |
| แชตตอบได้แต่ประวัติไม่ถูกบันทึก | ต่อฐานข้อมูลไม่ได้ | ดู Logs ของ BE หา `Error saving chat history` แล้วตรวจ `DATABASE_URL` |
| รันในเครื่องกับ Postgres ของตัวเองแล้วต่อ DB ไม่ได้ (`does not support SSL`) | BE ต่อฐานข้อมูลด้วย SSL และตรวจใบรับรองเสมอ แต่ Postgres ในเครื่องมักไม่ได้เปิด SSL | เติม `?sslmode=disable` ท้าย `DATABASE_URL` เฉพาะในเครื่อง (Neon ใช้ `?sslmode=require` ตามเดิม) |
| FE ไม่ขึ้นเลย log ขึ้น `unknown "be_url" variable` | ไม่ได้ตั้ง `BE_URL` ที่ service FE | ใส่ `BE_URL` ในหน้า Environment |
| FE ไม่ขึ้นเลย log ขึ้น `invalid URL prefix` | `BE_URL` ไม่มี `https://` นำหน้า | ใส่ `https://` นำหน้า |
| แชตได้ 404 แต่เปิดหน้าเว็บได้ | `BE_URL` มี `/` ท้าย ทำให้ path `/api` หายไประหว่างส่งต่อ | ลบ `/` ท้าย `BE_URL` |
| ข้อความแรกรอนาน หรือขึ้นว่า "ระบบหลังบ้านใช้เวลาปลุกนานกว่าปกติ" | BE แบบ Free กำลังหลับ (หน้าแชตลองส่งซ้ำให้แล้วราว 1 นาที) | เปิดลิงก์ BE รอจนขึ้น `Cannot GET /` ซึ่งแปลว่าตื่นแล้ว จากนั้นส่งข้อความใหม่ |
| push เข้า `main` แล้วขึ้น `GH013: Repository rule violations` | `main` ป้องกันด้วย Ruleset ต้องผ่าน Pull Request | แตก branch แล้วเปิด PR ตามขั้นตอนในหัวข้อ CI/CD |
| `test-be` ไม่ผ่าน | แก้ response ของ BE แต่ไม่ได้แก้ test | ดู expected/actual ใน log แล้วแก้ test ให้ตรง |
| `docker login: unauthorized` หรือ image ชื่อ `/portfolio-be` | ไม่ได้ตั้ง `DOCKERHUB_USERNAME` ในแท็บ Variables, ชื่อ secret ผิด หรือ token หมดอายุ | ตรวจชื่อและแท็บที่ใส่ แล้วสร้าง token ใหม่ |
| deploy ได้ 401/404 หรือ `no URL specified` | Hook URL ผิด ถูก Regenerate หรือยังไม่ได้ตั้ง secret | คัดลอก URL ใหม่ไปใส่ใน Secrets |
| scan ได้ `UNAUTHORIZED` หรือหา image ไม่เจอ | repo ของ image บน Docker Hub ตั้งเป็น private | ตั้ง repo `portfolio-be` / `portfolio-fe` บน Docker Hub เป็น public |
| build/scan/deploy ขึ้น skipped | push ไป branch อื่น, เป็น Pull Request หรือ commit นั้นไม่ได้แก้โค้ดฝั่งนั้น (เช่น แก้แค่ `.md`) | merge เข้า `main` หรือกด Run workflow ในแท็บ Actions เพื่อ deploy ใหม่ทั้งหมด |
| pipeline เขียวแต่เว็บไม่เปลี่ยน | service บน Render ไม่ได้ชี้ไปที่ `:latest` | ตรวจ image URL ใน Settings ของ service บน Render |
