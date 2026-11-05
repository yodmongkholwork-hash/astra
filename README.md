# ✦ ASTRA — The Fortune Teller Universe

> **Enter the Universe. Discover Your Destiny.**

ASTRA คือจักรวาลดูดวงออนไลน์ ผู้ใช้เดินผ่าน "ประตูเจ็ดบาน" เข้าสู่ห้องแห่งศาสตร์พยากรณ์ พบหมอดู AI 6 บุคลิก และโต้ตอบกับสภาพแวดล้อมในแต่ละห้อง ระบบรันได้ทันทีใน **Demo Mode** โดยไม่ต้องมี API key หรือฐานข้อมูล

---

## เริ่มใช้งาน (3 ขั้นตอน)

ต้องใช้ **Node.js 20.9+** (แนะนำ 22)

```bash
npm install
cp .env.example .env.local   # ปล่อยว่างไว้ได้ = Demo Mode
npm run dev                  # เปิด http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

คำสั่งตรวจสอบ: `npm run lint` · `npm run typecheck`

---

## สถานะแต่ละ Phase

| Phase | งาน | สถานะ |
|---|---|---|
| 1 | หน้าแรก ASTRA Universe: ท้องฟ้าดาว (Canvas), กลุ่มดาว, เนบิวลา, ลูกแก้ว, ไพ่ลอย, ประตูห้องเปิดได้ | ✅ เสร็จ |
| 2 | 7 ห้อง + ระบบเดินทาง (veil transition แบบวงแสงจากจุดที่คลิก + ประตูแยกออกเมื่อมาถึง) + แถบกระโดดข้ามห้อง | ✅ เสร็จ |
| 3 | หมอดู AI 6 ตัว (Avatar SVG มี idle animation: หายใจ กะพริบตา ออร่า) + ระบบเลือก Persona | ✅ เสร็จ |
| 4 | Tarot ใช้งานจริง: ไพ่ครบ 78 ใบ, ไพ่กลับหัว, 4 รูปแบบการวาง (1 / 3 / 5 / Celtic Cross 10) | ✅ เสร็จ |
| 5 | AI Chat ผ่าน Server API → Claude, แยก Agent ตามศาสตร์ × บุคลิก, Demo Mode | ✅ เสร็จ (ต้องใส่ key เพื่อเปิดโหมดจริง) |
| 6 | Profile, Personal Dashboard, Daily Horoscope, ประวัติการทำนาย, Supabase schema + Auth | ✅ localStorage ใช้ได้ทันที · Supabase พร้อมเชื่อม |
| 7 | Responsive, Reduced Motion, Security headers, validation, rate limit | ✅ ผ่าน build/lint · ทดสอบ desktop 1440px และ mobile 390px |

---

## โครงสร้างโปรเจกต์

```
src/
├─ app/
│  ├─ page.tsx                 # Phase 1 — ASTRA Universe (หน้าแรก)
│  ├─ rooms/[slug]/page.tsx    # 7 ห้อง (prerender แบบ static)
│  ├─ profile/page.tsx         # โปรไฟล์ + Dashboard + ประวัติ
│  ├─ api/oracle/route.ts      # Server-side bridge → Claude API (key ไม่ออกสู่ browser)
│  ├─ layout.tsx · globals.css # design tokens (ม่วง/น้ำเงินเที่ยงคืน/ดำ/ทอง)
├─ components/
│  ├─ cosmos/      Starfield (canvas) · Atmosphere (nebula, mist, motes, constellations) · CrystalOrb
│  ├─ universe/    Hero · Chambers · RoomPortal (ประตู) · OracleCourt · DailyOmen · SiteHeader
│  ├─ rooms/       RoomShell (ฉาก+ประตูเปิด+แถบนำทาง) · RoomContext · RoomEmblem
│  │  └─ scenes/   TarotScene · AstrologyScene · ThaiAstrologyScene · ChineseAstrologyScene
│  │                NumerologyScene · DreamScene · PalmistryScene   ← 1 component ต่อห้อง
│  ├─ personas/    PersonaAvatar (ภาพประกอบ SVG ของหมอดูแต่ละตัว)
│  ├─ chat/        OracleChat (หน้าต่างสนทนาแยกตาม persona)
│  ├─ profile/     ProfileDashboard
│  └─ providers/   AstraProvider (persona ที่เลือก + ระบบ travel ระหว่างห้อง)
├─ lib/
│  ├─ engines/     ⚙️ Calculation Engine (pure functions — ไม่เรียก AI)
│  ├─ agents/      🤖 AI Interpretation (system prompt = Base + ศาสตร์ + บุคลิก + ผลคำนวณ)
│  ├─ data/        rooms · personas · tarot (78 ใบ) · omens  ← ข้อมูลตัวอย่าง
│  ├─ supabase/    browser client
│  ├─ store.ts     บันทึกโปรไฟล์/ประวัติ (localStorage + sync Supabase เมื่อ login)
│  └─ config.ts    server-only config + isDemoMode()
supabase/schema.sql             # ตาราง + RLS
```

### แยก Calculation Engine ออกจาก AI Interpretation

```
[ห้อง/ฉาก] → engines (คำนวณ deterministic) → ReadingPayload { title, summary, facts }
           → ผู้ใช้กด "ให้หมอดูตีความ" → POST /api/oracle
           → agents.buildSystemPrompt(ศาสตร์ × บุคลิก × facts) → Claude → คำทำนาย
```

AI ได้รับ `facts` เป็นข้อมูลที่ "ห้ามแต่งเพิ่ม" ทำให้ผลคำนวณ (ไพ่ที่ได้ เลข ราศี เสาปาจื้อ) ตรวจสอบซ้ำได้เสมอ

| Engine | ทำอะไร | ความแม่นยำ |
|---|---|---|
| `drawCards` | สับไพ่ Fisher–Yates 78 ใบ + กลับหัว 30% | จริง |
| `lifePathNumber`, `numberEnergy` | เลขเส้นทางชีวิต (เก็บเลขมาสเตอร์ 11/22/33), รากเลขของเบอร์/ทะเบียน | จริง |
| `sunSign` | ราศีอาทิตย์แบบสากล (tropical) | จริง |
| `bazi` | ผังปาจื้อ 4 เสา (ปี-เดือน-วัน-ยาม) + สมดุลธาตุ | เสาวัน/ยามแม่นยำ · ปี/เดือนใช้วันสารทจีนแบบประมาณ (±1 วันช่วงเปลี่ยนสารท) |
| `thaiChart` | วันเกิด/ดาวประจำวัน (รวมพุธกลางคืน=ราหู), อาทิตย์สถิตราศี (นิรายนะ), ลัคนาแบบประมาณ | สูตรประมาณ |
| `moonPhase` | ข้างขึ้น/ข้างแรม | ±1 วัน |

---

## การตั้งค่า (.env.local)

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `ANTHROPIC_API_KEY` | key ของ Claude — **อ่านฝั่ง server เท่านั้น** ห้ามใส่ prefix `NEXT_PUBLIC_` |
| `ANTHROPIC_MODEL` | (ไม่บังคับ) เปลี่ยนรุ่นโมเดล ค่าเริ่มต้น `claude-sonnet-5-5` |
| `ASTRA_DEMO_MODE` | `true` = บังคับ Demo Mode แม้มี key |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | เปิดการ login (magic link) และซิงก์ประวัติขึ้นฐานข้อมูล |

**Demo Mode** ทำงานเมื่อไม่มี `ANTHROPIC_API_KEY` — หมอดูตอบด้วยข้อความตัวอย่างที่อิงผลคำนวณจริงและบุคลิกของแต่ละตัว ป้าย `DEMO` / `LIVE · Claude` แสดงในหน้าต่างแชท

### เชื่อม Supabase
1. สร้างโปรเจกต์ที่ supabase.com
2. เปิด SQL Editor แล้วรัน `supabase/schema.sql`
3. Authentication → URL Configuration: เพิ่ม `http://localhost:3000/profile` ใน Redirect URLs
4. ใส่ URL + anon key ใน `.env.local` แล้วรีสตาร์ท — หน้า "จักรวาลของฉัน" จะมีช่อง login

ตารางหลัก: `disciplines` (เพิ่มศาสตร์ใหม่ = เพิ่มแถว ไม่ต้อง migrate), `personas`, `profiles`, `readings` (`engine_result` jsonb + `interpretation`), `chat_sessions`, `chat_messages`, `daily_horoscopes` — ทุกตารางข้อมูลผู้ใช้เปิด Row Level Security แบบเจ้าของเท่านั้น

---

## เพิ่มศาสตร์ใหม่ (ตัวอย่าง: ไพ่ยิปซี)
1. `src/lib/data/rooms.ts` — เพิ่ม slug + palette + resident persona
2. `src/lib/engines/` — เพิ่มฟังก์ชันคำนวณ
3. `src/components/rooms/scenes/` — สร้าง Scene แล้วลงทะเบียนใน `SCENES` ของ `RoomShell.tsx` และเรียก `useShareReading()` เพื่อส่งผลให้หมอดู
4. `src/lib/agents/index.ts` — เพิ่มคำอธิบายศาสตร์ใน `DISCIPLINES`
5. `insert into disciplines …` ใน Supabase

## เพิ่มหมอดู AI
เพิ่ม object ใน `src/lib/data/personas.ts` (ชื่อ บุคลิก น้ำเสียง greeting systemPrompt สี) และเพิ่มรูปแบบภาพใน `PersonaAvatar.tsx` + ประโยคเปิด/ปิดของ Demo ใน `agents`

---

## Performance & Accessibility
- ท้องฟ้าดาวเป็น `<canvas>` เดียว หยุดวาดเมื่อแท็บถูกซ่อน และลดจำนวนดาวบนมือถือ
- แอนิเมชันตกแต่งส่วนใหญ่เป็น CSS (GPU) — Framer Motion ใช้เฉพาะ interaction (ประตู ไพ่ transition)
- ฉากแต่ละห้อง code-split ด้วย `next/dynamic` — โหลดเฉพาะห้องที่เข้า
- `prefers-reduced-motion`: หยุดแอนิเมชันตกแต่ง, transition เปลี่ยนเป็น fade สั้น, ไม่มีประตูเลื่อน
- ปุ่ม/ไพ่/เส้นลายมือกดด้วยคีย์บอร์ดได้ มี `aria-label` ภาษาไทย

## Security
- Claude API key อยู่ใน `src/lib/config.ts` ที่ import `server-only` — build จะล้มถ้ามีคนเผลอ import ฝั่ง client
- `/api/oracle` ตรวจ input (ห้องที่รู้จัก, จำกัด 20 ข้อความ × 2,000 ตัวอักษร, payload ≤ 6KB), rate-limit 20 ครั้ง/นาที/IP, timeout 45 วินาที, ไม่ส่ง error ภายในกลับไปที่ browser
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- System prompt กำหนดกรอบ: เพื่อความบันเทิง/สะท้อนตนเอง, ไม่ให้คำแนะนำการแพทย์/กฎหมาย/การเงิน, และแนะนำสายด่วนสุขภาพจิต 1323 หากผู้ใช้อยู่ในภาวะวิกฤต

---

## ส่วนที่ต้องเชื่อมต่อเพิ่มเติม (Roadmap)
- [ ] **Ephemeris engine** สำหรับ Moon / Rising / 12 เรือน / Aspects (แนะนำ `astronomy-engine` หรือ Swiss Ephemeris ฝั่ง server) + geocoding สถานที่เกิด → lat/lng/timezone
- [ ] **สมผุสดาวไทย** (สุริยยาตร์) แทนตำแหน่งดาวตัวอย่างในห้องโหราศาสตร์ไทย (ตอนนี้คำนวณจริงเฉพาะอาทิตย์และลัคนาแบบประมาณ)
- [ ] **ตารางสารทจีนจริง** (节气) สำหรับเสาปี/เดือนของ BaZi
- [ ] **Vision Agent** สำหรับอัปโหลดภาพฝ่ามือ (UI วางไว้แล้วในห้องดูลายมือ — ส่งภาพไป Claude ผ่าน API route ใหม่)
- [ ] Streaming response (SSE) ในแชท
- [ ] บันทึก `chat_sessions/chat_messages` ลง Supabase (ตารางพร้อมแล้ว — ตอนนี้บันทึกเฉพาะ `readings`)
- [ ] Daily Horoscope ที่สร้างโดย AI รายวัน (cron → `daily_horoscopes`)
- [ ] Rate limit แบบกระจาย (Upstash/Supabase) เมื่อ deploy หลาย instance
- [ ] Lottie / React Three Fiber: ยังไม่ได้ติดตั้ง เพราะแอนิเมชันปัจจุบันทำด้วย CSS/SVG/Canvas ได้เบากว่า — เพิ่มได้เฉพาะจุดที่ต้องการ 3D จริง (เช่น ลูกแก้วหมุนแบบ refraction)

> คำทำนายใน ASTRA มีไว้เพื่อความบันเทิงและการสะท้อนตนเอง
