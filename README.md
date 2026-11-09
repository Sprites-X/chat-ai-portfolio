# ByteMind · Chat AI Portfolio

เว็บแอป Portfolio ของกลุ่ม ที่ผู้เยี่ยมชมพูดคุยกับ AI เพื่อถามเรื่องราว ผลงาน และทักษะของกลุ่มและสมาชิกแต่ละคนได้

**Live demo**
- เว็บไซต์: https://<ชื่อ-fe>.onrender.com
- Backend API: https://chat-ai-portfolio-be.onrender.com

> ใช้ Render แบบ Free: หากไม่มีผู้ใช้งาน 15 นาที service จะหลับ การเปิดครั้งแรกต้องรอประมาณ 1 นาที

---

## สมาชิก

| ชื่อ | บทบาท | ทักษะหลัก |
|---|---|---|
| <ชื่อ> | Frontend (Portfolio + Chat UI) | React, ... |
| <ชื่อ> | Backend + AI Integration | Express, PostgreSQL, Gemini API, ... |
| <ชื่อ> | DevOps (Docker, CI/CD, Deployment) | Docker, GitHub Actions, Render, ... |

---

## Features

- **หน้า Portfolio** แนะนำกลุ่ม สมาชิกรายบุคคล ผลงาน และช่องทางติดต่อ
- **Chat UI** หน้าแชตที่แยกข้อความของผู้ใช้และ AI ชัดเจน
- **AI ที่ตอบจากข้อมูล Portfolio** ตอบได้ทั้งคำถามเกี่ยวกับกลุ่มโดยรวมและเกี่ยวกับสมาชิกแต่ละคน
- **ประวัติการสนทนา** เก็บในตาราง `chat_history` บน PostgreSQL
- **CI/CD อัตโนมัติ** push เข้า `main` แล้วระบบ test, build, scan และ deploy ให้เอง

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React |
| Backend | Node.js 24, Express 5 (JavaScript) |
| Database | PostgreSQL บน Neon |
| AI | Google Gemini API (`@google/genai`) |
| Container | Docker, Docker Hub |
| CI/CD | GitHub Actions, Trivy |
| Hosting | Render (Web Service) + Neon (Database) |

## Architecture

```mermaid
flowchart LR
  U[ผู้ใช้] --> FE[FE: React]
  FE -->|POST /api/chat| BE[BE: Express API]
  BE --> DB[(PostgreSQL บน Neon)]
  BE --> AI[Gemini API]
```

FE ส่งข้อความผู้ใช้ไปที่ `POST /api/chat` ของ BE
BE แนบข้อมูล Portfolio เป็น system instruction แล้วส่งคำถามให้ Gemini จากนั้นบันทึกคำถามและคำตอบลงตาราง `chat_history` แล้วส่งคำตอบกลับ

## โครงสร้างโปรเจกต์

```
.
├─ BE/                  # Express API + การเชื่อมต่อ AI
│  ├─ index.js          # server, API, การเชื่อม DB และ Gemini
│  ├─ api.test.js       # test (ไม่ต้องใช้ DB หรือ key)
│  ├─ Dockerfile
│  ├─ .dockerignore     # กัน .env และ node_modules ไม่ให้เข้า image
│  ├─ .env.example
│  └─ package.json
├─ FE/                  # React app
│  ├─ Dockerfile
│  └─ src/
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
git clone <repo-url>
cd <repo-folder>/BE

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

<!-- TODO (FE): วิธีติดตั้งและรัน FE ในเครื่อง และวิธีตั้ง URL ของ BE -->

> ห้าม commit ไฟล์ `BE/.env` ขึ้น repo ไฟล์นี้อยู่ใน `.gitignore` และ `.dockerignore` แล้ว

---

## Environment Variables

**Backend** (`BE/.env` ในเครื่อง หรือหน้า Environment ของ service บน Render)

| ตัวแปร | คำอธิบาย | ตัวอย่าง |
|---|---|---|
| `DATABASE_URL` | connection string ของ PostgreSQL | `postgresql://user:password@host/dbname?sslmode=require` |
| `GEMINI_API_KEY` | Gemini API key | `your_gemini_api_key` |
| `PORT` | พอร์ตของ server (Render ตั้งให้เอง) | `5000` |
| `GEMINI_MODEL` | ชื่อโมเดล Gemini (ไม่ใส่ก็ได้) | `gemini-3.8-flash` |

> หากไม่ได้ตั้ง `GEMINI_API_KEY` บอทจะตอบเป็นข้อความ `[ระบบตอบรับอัตโนมัติ]` แทนคำตอบจาก AI

<!-- TODO (FE): ตัวแปรของ FE เช่น URL ของ BE -->

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
| `400` | ไม่มี `message` หรือเป็นข้อความว่าง | `{ "error": "กรุณาระบุข้อความ" }` |
| `500` | เรียก AI หรือบันทึกฐานข้อมูลไม่สำเร็จ | `{ "error": "เกิดข้อผิดพลาดฝั่ง Server" }` |

## AI ตอบจากข้อมูลอะไร

ข้อมูล Portfolio ของกลุ่มและสมาชิกทุกคนเก็บไว้ในค่าคงที่ `PORTFOLIO_CONTEXT` ใน `BE/index.js`
ทุกครั้งที่มีคำถาม BE จะส่งข้อมูลนี้ให้ Gemini (โมเดล `gemini-3.8-flash`) เป็น `systemInstruction` และกำหนดให้ตอบโดยอ้างอิงข้อมูลนี้เท่านั้น

<!-- TODO (BE): อัปเดตเมื่อเปลี่ยนวิธีเก็บข้อมูล Portfolio -->

ตัวอย่างคำถามที่ถามได้:
- กลุ่มนี้มีจุดเด่นอะไร
- ใครในกลุ่มถนัด Backend
- เล่าผลงานของ <ชื่อสมาชิก> ให้ฟังหน่อย

---

## Testing

```bash
cd BE
npm ci
node --check index.js   # ตรวจ syntax
node --test             # รัน test ทุกไฟล์ *.test.js
```

test เปิด server ด้วย `node index.js` แล้วยิง request เข้าไปจริง ไม่ต้องใช้ฐานข้อมูลหรือ API key เพราะตรวจเฉพาะ response ที่ไม่ไปถึง DB หรือ AI
(test ตั้ง `DATABASE_URL` และ `GEMINI_API_KEY` เป็นค่าว่าง จึงไม่แตะของจริงแม้ในเครื่องจะมี `.env`)

| Test | คาดหวัง |
|---|---|
| `POST /api/chat` ไม่มี `message` | `400` พร้อม `error` |
| `POST /api/chat` `message` ว่าง | `400` |
| `POST /api/chat` ส่ง field ผิดชื่อ | `400` |
| `GET /api/chat` | `404` |

pipeline จะรัน test ให้อัตโนมัติทุกครั้งที่ push

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
| build | `build-be`, `build-fe` | build Docker image แล้ว push `:latest` และ `:<commit SHA>` ขึ้น Docker Hub | push เข้า `main` |
| scan | `scan-be`, `scan-fe` | ตรวจช่องโหว่ด้วย Trivy ไม่ผ่านเมื่อพบ CRITICAL ที่แก้ไขได้แล้ว | push เข้า `main` |
| deploy | `deploy-be`, `deploy-fe` | เรียก Deploy Hook ให้ Render ดึง image ล่าสุด | push เข้า `main` |

แต่ละ job ต่อกันด้วย `needs` หากขั้นใดไม่ผ่าน ขั้นถัดไปจะไม่ทำงาน โค้ดที่มีปัญหาจึงไม่ถูก deploy
สาย BE กับ FE แยกกัน ถ้าฝั่งหนึ่งพัง อีกฝั่งยัง deploy ได้ และถ้ายังไม่มีโฟลเดอร์ `FE/` job ฝั่ง FE จะขึ้นเป็น skipped

**Secrets and variables** (GitHub → Settings → Secrets and variables → Actions)

| ชื่อ | ค่า | ใส่ที่แท็บ |
|---|---|---|
| `DOCKERHUB_USERNAME` | ชื่อบัญชี Docker Hub | Variables |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Secrets |
| `RENDER_DEPLOY_HOOK_BE` | Deploy Hook URL ของ BE | Secrets |
| `RENDER_DEPLOY_HOOK_FE` | Deploy Hook URL ของ FE | Secrets |

ค่าใน Secrets จะถูกซ่อนใน log อัตโนมัติ ผู้ที่ตั้งค่าได้คือเจ้าของ repo หรือผู้ที่เป็น admin หาก repo อยู่ใน organization

ค่า `DATABASE_URL` และ `GEMINI_API_KEY` ไม่ได้อยู่ใน pipeline แต่ตั้งไว้ที่หน้า Environment ของ service บน Render

## Deployment

1. push เข้า `main` ครั้งแรกเพื่อให้ pipeline build image ขึ้น Docker Hub
2. เตรียม connection string ของฐานข้อมูลบน **Neon**
3. สร้าง **Web Service** บน Render จาก image `docker.io/<user>/portfolio-be:latest` (Singapore) แล้วตั้ง `DATABASE_URL`, `GEMINI_API_KEY`
4. ทดสอบด้วย `curl -X POST https://<ชื่อ-be>.onrender.com/api/chat -H "Content-Type: application/json" -d '{"message":"สวัสดี"}'` ต้องได้ `reply` กลับมา
5. สร้าง **Web Service** จาก image `docker.io/<user>/portfolio-fe:latest` (Singapore) แล้วตั้ง URL ของ BE
6. คัดลอก Deploy Hook ของทั้งสอง service (Settings → Deploy Hook) ไปใส่ใน GitHub Secrets
7. จากนั้นทุกครั้งที่ push เข้า `main` เว็บจะอัปเดตเอง

## Troubleshooting

| อาการ | สาเหตุที่พบบ่อย | วิธีแก้ |
|---|---|---|
| บอทตอบ `[ระบบตอบรับอัตโนมัติ] ...` | ไม่ได้ตั้ง `GEMINI_API_KEY` บน Render | ใส่ key ที่หน้า Environment ของ BE |
| แชตได้ `500` | ต่อฐานข้อมูลไม่ได้ หรือ Gemini ตอบ error | ดู Logs ของ BE บน Render แล้วตรวจ `DATABASE_URL` และ key |
| เปิดเว็บครั้งแรกแชตไม่ได้ | BE แบบ Free กำลังหลับ | เปิดลิงก์ BE รอประมาณ 1 นาที (ขึ้น `Cannot GET /` ถือว่าตื่นแล้ว) แล้วรีเฟรชหน้าเว็บ |
| `test-be` ไม่ผ่าน | แก้ response ของ BE แต่ไม่ได้แก้ test | ดู expected/actual ใน log แล้วแก้ test ให้ตรง |
| `docker login: unauthorized` หรือ image ชื่อ `/portfolio-be` | ไม่ได้ตั้ง `DOCKERHUB_USERNAME` ในแท็บ Variables, ชื่อ secret ผิด หรือ token หมดอายุ | ตรวจชื่อและแท็บที่ใส่ แล้วสร้าง token ใหม่ |
| deploy ได้ 401/404 หรือ `no URL specified` | Hook URL ผิด ถูก Regenerate หรือยังไม่ได้ตั้ง secret | คัดลอก URL ใหม่ไปใส่ใน Secrets |
| scan ได้ `UNAUTHORIZED` หรือหา image ไม่เจอ | repo ของ image บน Docker Hub ตั้งเป็น private | ตั้ง repo `portfolio-be` / `portfolio-fe` บน Docker Hub เป็น public |
| build/scan/deploy ขึ้น skipped | push ไป branch อื่น หรือเป็น Pull Request | merge เข้า `main` |
| pipeline เขียวแต่เว็บไม่เปลี่ยน | service บน Render ไม่ได้ชี้ไปที่ `:latest` | ตรวจ image URL ใน Settings ของ service บน Render |
