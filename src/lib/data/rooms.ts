/**
 * ASTRA — Room registry.
 * Every divination discipline is a "room". Adding a new discipline means adding
 * one entry here (+ a scene component + a calculation engine). The database
 * mirrors this list in the `disciplines` table so new rooms need no migration.
 */

export type RoomSlug =
  | "tarot"
  | "astrology"
  | "thai-astrology"
  | "chinese-astrology"
  | "numerology"
  | "dreams"
  | "palmistry";

export interface Room {
  slug: RoomSlug;
  name: string; // English display name
  nameTh: string; // Thai display name
  glyph: string; // single symbol used across UI
  tagline: string; // Thai, one line
  description: string; // Thai, two lines on the room page
  residentId: string; // default persona of the room
  /** palette used by portal, transition and room background */
  palette: { from: string; via: string; to: string; glow: string };
  features: string[]; // what the room will offer (Thai)
  phase: string; // which phase makes it fully functional
}

export const ROOMS: Room[] = [
  {
    slug: "tarot",
    name: "The Tarot Sanctum",
    nameTh: "ห้องไพ่ทาโรต์",
    glyph: "✦",
    tagline: "ไพ่ 78 ใบลอยรอคำถามของคุณ",
    description:
      "ไพ่ลอยอยู่กลางแสงเทียนสีทอง เลือกใบที่ดึงดูดใจ แล้วพลิกเพื่อฟังเรื่องราวที่จักรวาลวางไว้ให้คุณ",
    residentId: "madame-luna",
    palette: { from: "#2a0f45", via: "#4b1d6e", to: "#0b0620", glow: "#e6c47a" },
    features: ["เลือกจำนวนไพ่ 1 / 3 / 5 / 10 ใบ", "Spread: อดีต-ปัจจุบัน-อนาคต, Celtic Cross", "ไพ่ตั้งตรงและกลับหัว"],
    phase: "Phase 4",
  },
  {
    slug: "astrology",
    name: "The Celestial Observatory",
    nameTh: "ห้องโหราศาสตร์ตะวันตก",
    glyph: "☉",
    tagline: "วงล้อจักรราศีหมุนตามดวงดาวที่คุณเกิด",
    description:
      "หอดูดาวที่ดาวเคราะห์ทั้งสิบโคจรรอบวงล้อจักรราศี กรอกวัน เวลา และสถานที่เกิดเพื่อสร้างแผนผังดวงกำเนิด",
    residentId: "professor-orion",
    palette: { from: "#0b1a45", via: "#1d2f6e", to: "#050817", glow: "#9cc6ff" },
    features: ["คำนวณ Sun / Moon / Rising", "แผนผังดวงกำเนิด 12 เรือน", "มุมสัมพันธ์ของดาว (Aspects)"],
    phase: "Phase 2",
  },
  {
    slug: "thai-astrology",
    name: "The Golden Pavilion",
    nameTh: "ห้องโหราศาสตร์ไทย",
    glyph: "๙",
    tagline: "ผังดวงไทยใต้หลังคาศาลาทอง",
    description:
      "ศาลาไทยร่วมสมัยที่ลายกนกเรืองแสงทอง ผังราศีจักรแสดงตำแหน่งดาวทั้งเก้าตามคัมภีร์โหราศาสตร์ไทย",
    residentId: "mystic-raven",
    palette: { from: "#3a1406", via: "#6b2a0e", to: "#120502", glow: "#f2c35b" },
    features: ["ผังราศีจักรและลัคนา", "ดาวพระเคราะห์ ๑-๙ และ ๐", "ทักษาและเรือนชะตา"],
    phase: "Phase 2",
  },
  {
    slug: "chinese-astrology",
    name: "The Jade Hall",
    nameTh: "ห้องดวงจีน",
    glyph: "☯",
    tagline: "หยินหยาง ธาตุทั้งห้า และสี่เสาแห่งโชคชะตา",
    description:
      "หอหยกที่หยินและหยางหมุนวนอย่างสมดุล ค้นหานักษัตร ธาตุประจำตัว และผังปาจื้อ (BaZi) สี่เสาแห่งชีวิต",
    residentId: "the-truth",
    palette: { from: "#062a22", via: "#0f4a3a", to: "#020c0a", glow: "#e05a4a" },
    features: ["นักษัตรและธาตุประจำปีเกิด", "ผังปาจื้อ 4 เสา (ปี เดือน วัน ยาม)", "สมดุลธาตุทั้งห้า"],
    phase: "Phase 2",
  },
  {
    slug: "numerology",
    name: "The Hall of Numbers",
    nameTh: "ห้องเลขศาสตร์",
    glyph: "∞",
    tagline: "ตัวเลขเรืองแสงที่ซ่อนรหัสชีวิต",
    description:
      "ตัวเลขหนึ่งถึงเก้าลอยเรืองแสงรอบวงล้อพลัง ถอดรหัสเลขวันเกิด ชื่อ และตัวเลขที่คุณให้ความสนใจ",
    residentId: "professor-orion",
    palette: { from: "#1a1040", via: "#2e1f72", to: "#07051a", glow: "#7af0e0" },
    features: ["Life Path Number", "วิเคราะห์เบอร์โทรศัพท์ / ทะเบียนรถ", "เลขมงคลประจำวัน"],
    phase: "Phase 2",
  },
  {
    slug: "dreams",
    name: "The Dreaming Mist",
    nameTh: "ห้องทำนายฝัน",
    glyph: "☾",
    tagline: "หมอกแห่งความฝันที่สัญลักษณ์ล่องลอย",
    description:
      "ดินแดนระหว่างหลับและตื่น เล่าความฝันของคุณให้สายหมอกฟัง แล้วสัญลักษณ์ที่ซ่อนอยู่จะค่อย ๆ ปรากฏ",
    residentId: "aurora",
    palette: { from: "#2b1a4f", via: "#5a3d8a", to: "#0d0a1f", glow: "#f6b7d8" },
    features: ["สมุดบันทึกความฝัน", "ถอดสัญลักษณ์ในฝัน", "ติดตามรูปแบบความฝันซ้ำ"],
    phase: "Phase 2",
  },
  {
    slug: "palmistry",
    name: "The Palm Atelier",
    nameTh: "ห้องดูลายมือ",
    glyph: "✋",
    tagline: "เส้นบนฝ่ามือคือแผนที่ที่ติดตัวคุณมา",
    description:
      "สตูดิโอแสงเทียนที่ฝ่ามือเรืองแสงรอให้คุณสำรวจ แตะที่เส้นชีวิต เส้นสมอง และเส้นหัวใจเพื่ออ่านความหมาย",
    residentId: "little-star",
    palette: { from: "#3d1030", via: "#6b1f4f", to: "#14040f", glow: "#ffcf8a" },
    features: ["ฝ่ามือ Interactive", "เส้นชีวิต / สมอง / หัวใจ / โชคชะตา", "อัปโหลดภาพฝ่ามือ (อนาคต)"],
    phase: "Phase 2",
  },
];

export const getRoom = (slug: string) => ROOMS.find((r) => r.slug === slug);
