import { moonPhase, seededRandom } from "@/lib/engines";

/** Demo content for the Daily Omen. Replaced by AI-generated horoscopes in Phase 5. */
const MESSAGES = [
  "พลังแห่งการเริ่มต้นใหม่โอบล้อมคุณ สิ่งที่ลังเลมานานถึงเวลาลงมือ",
  "วันนี้คำพูดของคุณมีน้ำหนัก ใช้มันอย่างอ่อนโยนแล้วจะได้ใจคน",
  "มีข่าวดีเล็ก ๆ ซ่อนอยู่ในเรื่องธรรมดา สังเกตรายละเอียดให้ดี",
  "จังหวะเหมาะสำหรับพักและเติมพลัง อย่าฝืนเร่งสิ่งที่ยังไม่สุก",
  "ความสัมพันธ์เก่ากลับมาทักทาย เปิดใจแต่ไม่ต้องรีบตัดสิน",
  "ดาวแห่งโชคลาภเอียงเข้าหา งานที่ทำด้วยใจจะเห็นผลเร็วกว่าที่คิด",
  "ความฝันเมื่อคืนมีสาร ลองจดสัญลักษณ์ที่จำได้ไว้",
];
const COLORS = [
  { name: "ทองอร่าม", hex: "#e6c47a" },
  { name: "ม่วงอเมทิสต์", hex: "#9b7bff" },
  { name: "ฟ้าคราม", hex: "#5aa0ff" },
  { name: "เขียวหยก", hex: "#3fbf8f" },
  { name: "ชมพูกุหลาบ", hex: "#ff9ec7" },
  { name: "เงินจันทรา", hex: "#d8dcef" },
];

export function dailyOmen(date = new Date()) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; // local date
  const rand = seededRandom(key);
  return {
    date: key,
    message: MESSAGES[Math.floor(rand() * MESSAGES.length)],
    luckyNumber: 1 + Math.floor(rand() * 99),
    color: COLORS[Math.floor(rand() * COLORS.length)],
    energy: 55 + Math.floor(rand() * 45),
    moon: moonPhase(date),
  };
}
