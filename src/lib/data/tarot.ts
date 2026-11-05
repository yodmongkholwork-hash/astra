/**
 * Full 78-card Rider–Waite–Smith structure.
 * Major Arcana have hand-written meanings; Minor Arcana meanings are composed
 * from suit theme × rank theme (good enough for Demo; the Tarot agent adds nuance).
 */
export interface TarotCard {
  id: number; // 0–77
  name: string;
  nameTh: string;
  symbol: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  numeral: string;
  upright: string;
  reversed: string;
}

const MAJOR: [string, string, string, string, string][] = [
  ["The Fool", "คนเขลา", "☼", "การเริ่มต้นใหม่ ความกล้าที่จะก้าวสู่สิ่งที่ไม่รู้", "ความประมาท การกระโจนโดยไม่คิด"],
  ["The Magician", "นักมายากล", "∞", "พลังแห่งการลงมือ คุณมีเครื่องมือครบแล้ว", "ศักยภาพที่ยังไม่ได้ใช้ ระวังการหลอกลวง"],
  ["The High Priestess", "นักบวชหญิง", "☾", "ญาณหยั่งรู้ ความลับที่ยังไม่เปิดเผย", "ไม่ฟังเสียงภายใน ความลับรั่วไหล"],
  ["The Empress", "จักรพรรดินี", "♀", "ความอุดมสมบูรณ์ การดูแลและเติบโต", "การพึ่งพิงมากเกินไป ละเลยตัวเอง"],
  ["The Emperor", "จักรพรรดิ", "♈", "โครงสร้าง ความมั่นคง ความเป็นผู้นำ", "การควบคุมมากเกินไป ความดื้อรั้น"],
  ["The Hierophant", "สังฆราช", "⚷", "ขนบธรรมเนียม ครูผู้ชี้ทาง", "การตั้งคำถามกับกฎ หาเส้นทางของตัวเอง"],
  ["The Lovers", "คนรัก", "♡", "ความรัก การเลือกที่มาจากหัวใจ", "ความไม่ลงรอย การเลือกที่ขัดกับคุณค่า"],
  ["The Chariot", "รถศึก", "⛭", "ชัยชนะจากความตั้งใจแน่วแน่", "ขาดทิศทาง แรงผลักไปคนละทาง"],
  ["Strength", "พลัง", "♌", "ความเข้มแข็งที่อ่อนโยน ความอดทน", "ความไม่มั่นใจ อารมณ์ครอบงำ"],
  ["The Hermit", "ฤๅษี", "✧", "การมองเข้าไปข้างใน หาคำตอบในความสงบ", "การแยกตัวมากเกินไป ความเหงา"],
  ["Wheel of Fortune", "กงล้อแห่งโชคชะตา", "☸", "จุดเปลี่ยน วัฏจักรที่หมุนมาถึงคุณ", "ช่วงขาลงชั่วคราว ต่อต้านการเปลี่ยนแปลง"],
  ["Justice", "ความยุติธรรม", "⚖", "ความเป็นธรรม ผลของการกระทำ", "ความไม่ยุติธรรม การหลีกเลี่ยงความรับผิดชอบ"],
  ["The Hanged Man", "คนถูกแขวน", "⟁", "มองจากมุมใหม่ ยอมหยุดเพื่อไปต่อ", "การยื้อเวลา เสียสละโดยไร้ผล"],
  ["Death", "ความตาย", "✝", "การสิ้นสุดเพื่อเริ่มใหม่ การเปลี่ยนผ่าน", "การยึดติดกับสิ่งที่ควรปล่อย"],
  ["Temperance", "ความพอดี", "◬", "สมดุล ความพอดี การผสานสองสิ่ง", "ความไม่สมดุล การทำอะไรสุดโต่ง"],
  ["The Devil", "ปีศาจ", "⛧", "พันธนาการที่มองไม่เห็น ความยึดติด", "การปลดปล่อยตัวเอง เริ่มเห็นโซ่ตรวน"],
  ["The Tower", "หอคอย", "ϟ", "การพังทลายของสิ่งที่ไม่มั่นคง ความจริงปรากฏ", "หลีกเลี่ยงหายนะได้หวุดหวิด กลัวการเปลี่ยนแปลง"],
  ["The Star", "ดวงดาว", "★", "ความหวัง การเยียวยา แสงนำทาง", "หมดศรัทธา ท้อแท้ชั่วคราว"],
  ["The Moon", "ดวงจันทร์", "☽", "ความไม่แน่นอน ฝัน และสัญชาตญาณ", "ความสับสนคลี่คลาย ความจริงเริ่มชัด"],
  ["The Sun", "ดวงอาทิตย์", "☉", "ความสุข ความสำเร็จ ความชัดเจน", "ความสุขที่ถูกบดบังชั่วคราว"],
  ["Judgement", "การพิพากษา", "♆", "การตื่นรู้ เสียงเรียกจากภายใน", "การตัดสินตัวเองรุนแรงเกินไป"],
  ["The World", "โลก", "⊕", "ความสมบูรณ์ การเดินทางที่ครบรอบ", "งานที่ยังไม่จบ ขาดอีกก้าวเดียว"],
];

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

const SUITS = [
  { key: "wands", en: "Wands", th: "ไม้เท้า", symbol: "♣", theme: "พลังใจและการลงมือ" },
  { key: "cups", en: "Cups", th: "ถ้วย", symbol: "♥", theme: "ความรักและอารมณ์" },
  { key: "swords", en: "Swords", th: "ดาบ", symbol: "♠", theme: "ความคิดและการตัดสินใจ" },
  { key: "pentacles", en: "Pentacles", th: "เหรียญ", symbol: "♦", theme: "การเงินและความมั่นคง" },
] as const;

const RANKS: [string, string, string, string][] = [
  ["Ace", "เอซ", "จุดเริ่มต้นใหม่ของ", "โอกาสที่หลุดมือในเรื่อง"],
  ["Two", "สอง", "การเลือกและความร่วมมือด้าน", "ความลังเลในเรื่อง"],
  ["Three", "สาม", "การเติบโตของ", "ความล่าช้าใน"],
  ["Four", "สี่", "ความมั่นคงและการพักใน", "ความเฉื่อยชาใน"],
  ["Five", "ห้า", "ความท้าทายและแรงเสียดทานด้าน", "การฟื้นตัวจากความขัดแย้งด้าน"],
  ["Six", "หก", "ความกลมกลืนและการให้ใน", "การติดอยู่กับอดีตในเรื่อง"],
  ["Seven", "เจ็ด", "การทดสอบความเชื่อมั่นด้าน", "การยอมแพ้ก่อนเวลาใน"],
  ["Eight", "แปด", "ความเคลื่อนไหวและความชำนาญใน", "การวนเวียนไม่ไปไหนในเรื่อง"],
  ["Nine", "เก้า", "ความใกล้สำเร็จของ", "ความกังวลเกินเหตุเรื่อง"],
  ["Ten", "สิบ", "บทสรุปและภาระของ", "การปล่อยวางภาระด้าน"],
  ["Page", "เด็กรับใช้", "ข่าวสารและการเรียนรู้ด้าน", "ความไม่พร้อมในเรื่อง"],
  ["Knight", "อัศวิน", "การไล่ตามอย่างมุ่งมั่นใน", "ความใจร้อนในเรื่อง"],
  ["Queen", "ราชินี", "ความเข้าใจลึกซึ้งด้าน", "ความไม่มั่นคงทางใจด้าน"],
  ["King", "ราชา", "ความเป็นผู้นำและความเชี่ยวชาญด้าน", "การใช้อำนาจผิดทางใน"],
];

export const DECK: TarotCard[] = [
  ...MAJOR.map(([name, nameTh, symbol, upright, reversed], i) => ({ id: i, name, nameTh, symbol, arcana: "major" as const, numeral: ROMAN[i], upright, reversed })),
  ...SUITS.flatMap((s, si) =>
    RANKS.map(([rEn, rTh, up, rev], ri) => ({
      id: 22 + si * 14 + ri,
      name: `${rEn} of ${s.en}`,
      nameTh: `${rTh}${s.th}`,
      symbol: s.symbol,
      arcana: "minor" as const,
      suit: s.key,
      numeral: ri < 10 ? String(ri + 1) : rEn[0],
      upright: `${up}${s.theme}`,
      reversed: `${rev}${s.theme}`,
    })),
  ),
];

/** @deprecated kept for older imports */
export const MAJOR_ARCANA = DECK.slice(0, 22);

export interface DrawnCard extends TarotCard {
  isReversed: boolean;
}

export const SPREADS = {
  single: { label: "ไพ่ใบเดียว", positions: ["คำตอบ"] },
  "three-card": { label: "อดีต · ปัจจุบัน · อนาคต", positions: ["อดีต", "ปัจจุบัน", "อนาคต"] },
  "five-card": { label: "เส้นทาง 5 ใบ", positions: ["สถานการณ์", "อุปสรรค", "คำแนะนำ", "สิ่งที่ซ่อน", "ผลลัพธ์"] },
  "celtic-cross": {
    label: "Celtic Cross 10 ใบ",
    positions: ["ปัจจุบัน", "อุปสรรค", "รากฐาน", "อดีต", "เป้าหมาย", "อนาคตใกล้", "ตัวคุณ", "สิ่งแวดล้อม", "ความหวัง/ความกลัว", "ผลลัพธ์"],
  },
} as const;
export type SpreadKey = keyof typeof SPREADS;

/** Fisher–Yates draw without replacement; ~30% chance a card is reversed. */
export function drawCards(n: number, rand: () => number = Math.random, allowReversed = true): DrawnCard[] {
  const deck = [...DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, n).map((c) => ({ ...c, isReversed: allowReversed && rand() < 0.3 }));
}
