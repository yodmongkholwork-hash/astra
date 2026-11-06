import type { RoomSlug } from "@/lib/data/rooms";

/**
 * ASTRA — The Mystic Realms: the eight territories of the kingdom.
 * World units ≈ metres. The castle sits at the origin; territories ring it.
 * Each location carries three composed camera shots (wide / medium / close).
 */

export type Vec3 = [number, number, number];
export interface Pose {
  pos: Vec3;
  target: Vec3;
}
export type ShotKind = "wide" | "medium" | "close";

export type LocationId =
  | "castle"
  | "tarot"
  | "zodiac"
  | "siam"
  | "elements"
  | "numeria"
  | "dreamveil"
  | "palmistry";

export interface RealmLocation {
  id: LocationId;
  index: string; // "01"
  name: string;
  nameTh: string;
  blurb: string; // Thai, one-two lines
  room: RoomSlug | null; // existing ASTRA room it opens (castle = hub → profile)
  guardian: { name: string; personaId: string; title: string };
  position: Vec3; // ground anchor of the landmark
  color: string; // marker / light accent
  shots: Record<ShotKind, Pose>;
}

/** Helper: compose a shot by orbiting `dist` metres around an anchor. */
function orbit(anchor: Vec3, yawDeg: number, dist: number, height: number, lookUp = 0): Pose {
  const a = (yawDeg * Math.PI) / 180;
  return {
    pos: [anchor[0] + Math.sin(a) * dist, anchor[1] + height, anchor[2] + Math.cos(a) * dist],
    target: [anchor[0], anchor[1] + lookUp, anchor[2]],
  };
}

/** Polar placement around the castle. */
function polar(angleDeg: number, r: number, y = 0): Vec3 {
  const a = (angleDeg * Math.PI) / 180;
  return [Math.sin(a) * r, y, Math.cos(a) * r];
}

const P = {
  castle: [0, 0, 0] as Vec3,
  tarot: polar(-38, 265),
  zodiac: polar(22, 300),
  siam: polar(78, 270),
  elements: polar(135, 290),
  numeria: polar(-150, 265),
  dreamveil: polar(-98, 285),
  palmistry: polar(180, 245),
};

/** yaw of a camera that looks at `p` from the castle side, offset by `o` degrees */
const faceFromCenter = (p: Vec3, o = 0) => (Math.atan2(p[0], p[2]) * 180) / Math.PI + 180 + o;

export const LOCATIONS: RealmLocation[] = [
  {
    id: "castle",
    index: "01",
    name: "Grand Royal Castle",
    nameTh: "พระราชวังหลวงแห่งอัสตรา",
    blurb: "ใจกลางอาณาจักร ปราสาทศิลาดำยอดทองตั้งบนผาสูง ล้อมด้วยเกาะลอยและคูน้ำเรืองแสง",
    room: null,
    guardian: { name: "The Celestial Court", personaId: "madame-luna", title: "สภาผู้พิทักษ์ทั้งเจ็ด" },
    position: P.castle,
    color: "#f2c35b",
    shots: {
      wide: { pos: [170, 150, 260], target: [0, 70, 0] },
      medium: { pos: [95, 95, 130], target: [0, 85, 0] },
      close: { pos: [34, 212, 52], target: [0, 214, 0] },
    },
  },
  {
    id: "tarot",
    index: "02",
    name: "Tarot Sanctuary",
    nameTh: "วิหารไพ่ทาโรต์",
    blurb: "วิหารโบราณที่ไพ่ทองคำลอยวนรอบเปลวเทียน ห้องลับมากมายซ่อนคำตอบของโชคชะตา",
    room: "tarot",
    guardian: { name: "Madame Luna", personaId: "madame-luna", title: "ผู้เฝ้าแสงจันทร์" },
    position: P.tarot,
    color: "#c9a0ff",
    shots: {
      // establishing: plaza, braziers and the floating arcana against the mountains
      wide: orbit(P.tarot, faceFromCenter(P.tarot, -28), 175, 85, 30),
      // environmental: portico, portal doorway and candle-lit tiers
      medium: orbit(P.tarot, faceFromCenter(P.tarot, 12), 78, 22, 20),
      // magical object: the Wheel of Fortune inside the ring of Major Arcana
      close: orbit(P.tarot, faceFromCenter(P.tarot, 4), 40, 66, 66),
    },
  },
  {
    id: "zodiac",
    index: "03",
    name: "Zodiac Citadel",
    nameTh: "ป้อมจักรราศี",
    blurb: "หอดูดาวที่มีกลไกจักรราศีขนาดยักษ์หมุนอยู่กลางฟ้า ดาวเคราะห์โคจรรอบยอดหอ",
    room: "astrology",
    guardian: { name: "Professor Orion", personaId: "professor-orion", title: "นักดาราศาสตร์แห่งเหตุผล" },
    position: P.zodiac,
    color: "#7fb8ff",
    shots: {
      // establishing: terraces, observatory, twin towers and the mechanism in the sky
      wide: orbit(P.zodiac, faceFromCenter(P.zodiac, 25), 240, 125, 70),
      // environmental: tower foot, portal and the sweeping telescope
      medium: orbit(P.zodiac, faceFromCenter(P.zodiac, -12), 118, 46, 40),
      // magical object: the zodiac plaque ring, armillary sun and orbiting planets
      close: orbit(P.zodiac, faceFromCenter(P.zodiac, 8), 58, 118, 116),
    },
  },
  {
    id: "siam",
    index: "04",
    name: "Siam Astral Temple",
    nameTh: "เทวาลัยดาราสยาม",
    blurb: "ปราสาทยอดปรางค์สีทองตามคติไตรภูมิ ลายกนกเรืองแสงบอกตำแหน่งดาวพระเคราะห์ทั้งเก้า",
    room: "thai-astrology",
    guardian: { name: "Ajarn Ratri", personaId: "mystic-raven", title: "อาจารย์ราตรี โหรหลวง" },
    position: P.siam,
    color: "#f2b84b",
    shots: {
      wide: orbit(P.siam, faceFromCenter(P.siam, -25), 150, 80, 25),
      medium: orbit(P.siam, faceFromCenter(P.siam, 20), 72, 34, 30),
      close: orbit(P.siam, faceFromCenter(P.siam, 0), 30, 52, 56),
    },
  },
  {
    id: "elements",
    index: "05",
    name: "Five Elements Empire",
    nameTh: "จักรวรรดิเบญจธาตุ",
    blurb: "พระราชวังสวรรค์ทรงเจดีย์จีน หยินหยางหมุนเหนือลานกว้าง ธาตุทั้งห้าเวียนตามวัฏจักร",
    room: "chinese-astrology",
    guardian: { name: "Master Yin", personaId: "the-truth", title: "ปรมาจารย์หยิน" },
    position: P.elements,
    color: "#ff6b57",
    shots: {
      wide: orbit(P.elements, faceFromCenter(P.elements, 30), 160, 90, 25),
      medium: orbit(P.elements, faceFromCenter(P.elements, -15), 80, 42, 34),
      close: orbit(P.elements, faceFromCenter(P.elements, 0), 34, 66, 70),
    },
  },
  {
    id: "numeria",
    index: "06",
    name: "Numeria Kingdom",
    nameTh: "นครนูเมเรีย",
    blurb: "นครแห่งเสาหินอักขระ ตัวเลขโบราณเรืองแสงลอยวนเป็นสมการของจักรวาล",
    room: "numerology",
    guardian: { name: "Numeria", personaId: "professor-orion", title: "ราชินีแห่งตัวเลข" },
    position: P.numeria,
    color: "#5ff0d8",
    shots: {
      wide: orbit(P.numeria, faceFromCenter(P.numeria, -30), 150, 85, 20),
      medium: orbit(P.numeria, faceFromCenter(P.numeria, 20), 75, 36, 26),
      close: orbit(P.numeria, faceFromCenter(P.numeria, 0), 30, 40, 44),
    },
  },
  {
    id: "dreamveil",
    index: "07",
    name: "Dreamveil Forest",
    nameTh: "พงไพรม่านฝัน",
    blurb: "ป่าลึกที่ต้นไม้เรืองแสงในหมอก แสงล่องลอยนำทางผู้หลงเข้ามาสู่ดินแดนแห่งความฝัน",
    room: "dreams",
    guardian: { name: "Dreamkeeper", personaId: "aurora", title: "ผู้เฝ้าประตูฝัน" },
    position: P.dreamveil,
    color: "#f39bd6",
    shots: {
      wide: orbit(P.dreamveil, faceFromCenter(P.dreamveil, 25), 160, 75, 15),
      medium: orbit(P.dreamveil, faceFromCenter(P.dreamveil, -20), 70, 26, 18),
      close: orbit(P.dreamveil, faceFromCenter(P.dreamveil, 0), 28, 14, 16),
    },
  },
  {
    id: "palmistry",
    index: "08",
    name: "Palmistry Tower",
    nameTh: "หอคอยหัตถ์พยากรณ์",
    blurb: "หอคอยพ่อมดสูงเสียดฟ้า ภายในเก็บคัมภีร์ลายมือโบราณ ฝ่ามือเรืองแสงลอยอยู่บนยอดหอ",
    room: "palmistry",
    guardian: { name: "Palmora", personaId: "little-star", title: "ผู้อ่านเส้นทางบนฝ่ามือ" },
    position: P.palmistry,
    color: "#ffb36b",
    shots: {
      wide: orbit(P.palmistry, faceFromCenter(P.palmistry, -40), 215, 120, 80),
      medium: orbit(P.palmistry, faceFromCenter(P.palmistry, 25), 95, 95, 100),
      close: orbit(P.palmistry, faceFromCenter(P.palmistry, 0), 28, 128, 130),
    },
  },
];

export const getLocation = (id: string) => LOCATIONS.find((l) => l.id === id);
export const locationForRoom = (slug: string) => LOCATIONS.find((l) => l.room === slug);

/** The aerial overview pose — high above the south rim, looking across the whole kingdom. */
export const OVERVIEW: Pose = { pos: [0, 370, 590], target: [0, 0, -50] };

/** Kingdom entrance: above the cloud sea → descend through clouds → glide to the castle → wide establishing shot. */
export const INTRO_PATH: { pos: Vec3[]; target: Vec3[] } = {
  pos: [
    [-120, 620, 900],
    [-60, 470, 700],
    [10, 250, 520],
    [90, 165, 360],
    [170, 150, 260],
  ],
  target: [
    [0, 560, 200],
    [0, 300, 0],
    [0, 110, 0],
    [0, 80, 0],
    [0, 70, 0],
  ],
};
