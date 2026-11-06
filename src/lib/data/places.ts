/**
 * Birthplaces for chart calculation: every Thai province, well-known Thai cities
 * and major cities abroad (latitude/longitude in degrees, IANA time zone).
 * Coordinates are city centres (±0.1°), precise enough for an Ascendant to within
 * a fraction of a degree. "custom" lets the user type coordinates.
 */
export interface Place {
  id: string;
  name: string; // Thai display name
  en: string;
  lat: number;
  lon: number;
  tz: string;
  kind: "province" | "city" | "world";
}

export const PLACES: Place[] = [
  // Thailand — all 77 provinces (provincial seat / city centre)
  { id: "bangkok", name: "กรุงเทพมหานคร", en: "Bangkok", lat: 13.756, lon: 100.502, tz: "Asia/Bangkok", kind: "province" },
  { id: "krabi", name: "กระบี่", en: "Krabi", lat: 8.086, lon: 98.906, tz: "Asia/Bangkok", kind: "province" },
  { id: "kanchanaburi", name: "กาญจนบุรี", en: "Kanchanaburi", lat: 14.004, lon: 99.548, tz: "Asia/Bangkok", kind: "province" },
  { id: "kalasin", name: "กาฬสินธุ์", en: "Kalasin", lat: 16.432, lon: 103.506, tz: "Asia/Bangkok", kind: "province" },
  { id: "kamphaengphet", name: "กำแพงเพชร", en: "Kamphaeng Phet", lat: 16.483, lon: 99.522, tz: "Asia/Bangkok", kind: "province" },
  { id: "khonkaen", name: "ขอนแก่น", en: "Khon Kaen", lat: 16.441, lon: 102.836, tz: "Asia/Bangkok", kind: "province" },
  { id: "chanthaburi", name: "จันทบุรี", en: "Chanthaburi", lat: 12.611, lon: 102.104, tz: "Asia/Bangkok", kind: "province" },
  { id: "chachoengsao", name: "ฉะเชิงเทรา", en: "Chachoengsao", lat: 13.69, lon: 101.072, tz: "Asia/Bangkok", kind: "province" },
  { id: "chonburi", name: "ชลบุรี", en: "Chonburi", lat: 13.361, lon: 100.985, tz: "Asia/Bangkok", kind: "province" },
  { id: "chainat", name: "ชัยนาท", en: "Chai Nat", lat: 15.186, lon: 100.125, tz: "Asia/Bangkok", kind: "province" },
  { id: "chaiyaphum", name: "ชัยภูมิ", en: "Chaiyaphum", lat: 15.806, lon: 102.031, tz: "Asia/Bangkok", kind: "province" },
  { id: "chumphon", name: "ชุมพร", en: "Chumphon", lat: 10.493, lon: 99.18, tz: "Asia/Bangkok", kind: "province" },
  { id: "chiangrai", name: "เชียงราย", en: "Chiang Rai", lat: 19.907, lon: 99.83, tz: "Asia/Bangkok", kind: "province" },
  { id: "chiangmai", name: "เชียงใหม่", en: "Chiang Mai", lat: 18.788, lon: 98.985, tz: "Asia/Bangkok", kind: "province" },
  { id: "trang", name: "ตรัง", en: "Trang", lat: 7.559, lon: 99.611, tz: "Asia/Bangkok", kind: "province" },
  { id: "trat", name: "ตราด", en: "Trat", lat: 12.243, lon: 102.515, tz: "Asia/Bangkok", kind: "province" },
  { id: "tak", name: "ตาก", en: "Tak", lat: 16.883, lon: 99.126, tz: "Asia/Bangkok", kind: "province" },
  { id: "nakhonnayok", name: "นครนายก", en: "Nakhon Nayok", lat: 14.206, lon: 101.213, tz: "Asia/Bangkok", kind: "province" },
  { id: "nakhonpathom", name: "นครปฐม", en: "Nakhon Pathom", lat: 13.82, lon: 100.062, tz: "Asia/Bangkok", kind: "province" },
  { id: "nakhonphanom", name: "นครพนม", en: "Nakhon Phanom", lat: 17.392, lon: 104.769, tz: "Asia/Bangkok", kind: "province" },
  { id: "nakhonratchasima", name: "นครราชสีมา", en: "Nakhon Ratchasima", lat: 14.97, lon: 102.102, tz: "Asia/Bangkok", kind: "province" },
  { id: "nakhonsithammarat", name: "นครศรีธรรมราช", en: "Nakhon Si Thammarat", lat: 8.432, lon: 99.963, tz: "Asia/Bangkok", kind: "province" },
  { id: "nakhonsawan", name: "นครสวรรค์", en: "Nakhon Sawan", lat: 15.704, lon: 100.137, tz: "Asia/Bangkok", kind: "province" },
  { id: "nonthaburi", name: "นนทบุรี", en: "Nonthaburi", lat: 13.862, lon: 100.514, tz: "Asia/Bangkok", kind: "province" },
  { id: "narathiwat", name: "นราธิวาส", en: "Narathiwat", lat: 6.426, lon: 101.823, tz: "Asia/Bangkok", kind: "province" },
  { id: "nan", name: "น่าน", en: "Nan", lat: 18.783, lon: 100.778, tz: "Asia/Bangkok", kind: "province" },
  { id: "buengkan", name: "บึงกาฬ", en: "Bueng Kan", lat: 18.36, lon: 103.646, tz: "Asia/Bangkok", kind: "province" },
  { id: "buriram", name: "บุรีรัมย์", en: "Buriram", lat: 14.993, lon: 103.103, tz: "Asia/Bangkok", kind: "province" },
  { id: "pathumthani", name: "ปทุมธานี", en: "Pathum Thani", lat: 14.02, lon: 100.525, tz: "Asia/Bangkok", kind: "province" },
  { id: "prachuapkhirikhan", name: "ประจวบคีรีขันธ์", en: "Prachuap Khiri Khan", lat: 11.812, lon: 99.797, tz: "Asia/Bangkok", kind: "province" },
  { id: "prachinburi", name: "ปราจีนบุรี", en: "Prachinburi", lat: 14.051, lon: 101.372, tz: "Asia/Bangkok", kind: "province" },
  { id: "pattani", name: "ปัตตานี", en: "Pattani", lat: 6.869, lon: 101.25, tz: "Asia/Bangkok", kind: "province" },
  { id: "ayutthaya", name: "พระนครศรีอยุธยา", en: "Phra Nakhon Si Ayutthaya", lat: 14.353, lon: 100.568, tz: "Asia/Bangkok", kind: "province" },
  { id: "phayao", name: "พะเยา", en: "Phayao", lat: 19.166, lon: 99.902, tz: "Asia/Bangkok", kind: "province" },
  { id: "phangnga", name: "พังงา", en: "Phang Nga", lat: 8.451, lon: 98.526, tz: "Asia/Bangkok", kind: "province" },
  { id: "phatthalung", name: "พัทลุง", en: "Phatthalung", lat: 7.617, lon: 100.078, tz: "Asia/Bangkok", kind: "province" },
  { id: "phichit", name: "พิจิตร", en: "Phichit", lat: 16.442, lon: 100.349, tz: "Asia/Bangkok", kind: "province" },
  { id: "phitsanulok", name: "พิษณุโลก", en: "Phitsanulok", lat: 16.821, lon: 100.265, tz: "Asia/Bangkok", kind: "province" },
  { id: "phetchaburi", name: "เพชรบุรี", en: "Phetchaburi", lat: 13.112, lon: 99.94, tz: "Asia/Bangkok", kind: "province" },
  { id: "phetchabun", name: "เพชรบูรณ์", en: "Phetchabun", lat: 16.419, lon: 101.16, tz: "Asia/Bangkok", kind: "province" },
  { id: "phrae", name: "แพร่", en: "Phrae", lat: 18.146, lon: 100.141, tz: "Asia/Bangkok", kind: "province" },
  { id: "phuket", name: "ภูเก็ต", en: "Phuket", lat: 7.88, lon: 98.392, tz: "Asia/Bangkok", kind: "province" },
  { id: "mahasarakham", name: "มหาสารคาม", en: "Maha Sarakham", lat: 16.184, lon: 103.302, tz: "Asia/Bangkok", kind: "province" },
  { id: "mukdahan", name: "มุกดาหาร", en: "Mukdahan", lat: 16.542, lon: 104.723, tz: "Asia/Bangkok", kind: "province" },
  { id: "maehongson", name: "แม่ฮ่องสอน", en: "Mae Hong Son", lat: 19.302, lon: 97.965, tz: "Asia/Bangkok", kind: "province" },
  { id: "yasothon", name: "ยโสธร", en: "Yasothon", lat: 15.792, lon: 104.145, tz: "Asia/Bangkok", kind: "province" },
  { id: "yala", name: "ยะลา", en: "Yala", lat: 6.541, lon: 101.281, tz: "Asia/Bangkok", kind: "province" },
  { id: "roiet", name: "ร้อยเอ็ด", en: "Roi Et", lat: 16.056, lon: 103.653, tz: "Asia/Bangkok", kind: "province" },
  { id: "ranong", name: "ระนอง", en: "Ranong", lat: 9.961, lon: 98.638, tz: "Asia/Bangkok", kind: "province" },
  { id: "rayong", name: "ระยอง", en: "Rayong", lat: 12.68, lon: 101.257, tz: "Asia/Bangkok", kind: "province" },
  { id: "ratchaburi", name: "ราชบุรี", en: "Ratchaburi", lat: 13.536, lon: 99.817, tz: "Asia/Bangkok", kind: "province" },
  { id: "lopburi", name: "ลพบุรี", en: "Lopburi", lat: 14.799, lon: 100.654, tz: "Asia/Bangkok", kind: "province" },
  { id: "lampang", name: "ลำปาง", en: "Lampang", lat: 18.29, lon: 99.49, tz: "Asia/Bangkok", kind: "province" },
  { id: "lamphun", name: "ลำพูน", en: "Lamphun", lat: 18.574, lon: 99.008, tz: "Asia/Bangkok", kind: "province" },
  { id: "loei", name: "เลย", en: "Loei", lat: 17.486, lon: 101.722, tz: "Asia/Bangkok", kind: "province" },
  { id: "sisaket", name: "ศรีสะเกษ", en: "Sisaket", lat: 15.118, lon: 104.322, tz: "Asia/Bangkok", kind: "province" },
  { id: "sakonnakhon", name: "สกลนคร", en: "Sakon Nakhon", lat: 17.155, lon: 104.14, tz: "Asia/Bangkok", kind: "province" },
  { id: "songkhla", name: "สงขลา", en: "Songkhla", lat: 7.199, lon: 100.595, tz: "Asia/Bangkok", kind: "province" },
  { id: "satun", name: "สตูล", en: "Satun", lat: 6.624, lon: 100.067, tz: "Asia/Bangkok", kind: "province" },
  { id: "samutprakan", name: "สมุทรปราการ", en: "Samut Prakan", lat: 13.599, lon: 100.597, tz: "Asia/Bangkok", kind: "province" },
  { id: "samutsongkhram", name: "สมุทรสงคราม", en: "Samut Songkhram", lat: 13.409, lon: 100.002, tz: "Asia/Bangkok", kind: "province" },
  { id: "samutsakhon", name: "สมุทรสาคร", en: "Samut Sakhon", lat: 13.548, lon: 100.274, tz: "Asia/Bangkok", kind: "province" },
  { id: "sakaeo", name: "สระแก้ว", en: "Sa Kaeo", lat: 13.824, lon: 102.065, tz: "Asia/Bangkok", kind: "province" },
  { id: "saraburi", name: "สระบุรี", en: "Saraburi", lat: 14.528, lon: 100.91, tz: "Asia/Bangkok", kind: "province" },
  { id: "singburi", name: "สิงห์บุรี", en: "Sing Buri", lat: 14.887, lon: 100.402, tz: "Asia/Bangkok", kind: "province" },
  { id: "sukhothai", name: "สุโขทัย", en: "Sukhothai", lat: 17.007, lon: 99.823, tz: "Asia/Bangkok", kind: "province" },
  { id: "suphanburi", name: "สุพรรณบุรี", en: "Suphan Buri", lat: 14.474, lon: 100.122, tz: "Asia/Bangkok", kind: "province" },
  { id: "suratthani", name: "สุราษฎร์ธานี", en: "Surat Thani", lat: 9.14, lon: 99.333, tz: "Asia/Bangkok", kind: "province" },
  { id: "surin", name: "สุรินทร์", en: "Surin", lat: 14.883, lon: 103.494, tz: "Asia/Bangkok", kind: "province" },
  { id: "nongkhai", name: "หนองคาย", en: "Nong Khai", lat: 17.878, lon: 102.742, tz: "Asia/Bangkok", kind: "province" },
  { id: "nongbualamphu", name: "หนองบัวลำภู", en: "Nong Bua Lam Phu", lat: 17.204, lon: 102.441, tz: "Asia/Bangkok", kind: "province" },
  { id: "angthong", name: "อ่างทอง", en: "Ang Thong", lat: 14.589, lon: 100.455, tz: "Asia/Bangkok", kind: "province" },
  { id: "amnatcharoen", name: "อำนาจเจริญ", en: "Amnat Charoen", lat: 15.858, lon: 104.627, tz: "Asia/Bangkok", kind: "province" },
  { id: "udonthani", name: "อุดรธานี", en: "Udon Thani", lat: 17.415, lon: 102.787, tz: "Asia/Bangkok", kind: "province" },
  { id: "uttaradit", name: "อุตรดิตถ์", en: "Uttaradit", lat: 17.626, lon: 100.099, tz: "Asia/Bangkok", kind: "province" },
  { id: "uthaithani", name: "อุทัยธานี", en: "Uthai Thani", lat: 15.379, lon: 100.024, tz: "Asia/Bangkok", kind: "province" },
  { id: "ubonratchathani", name: "อุบลราชธานี", en: "Ubon Ratchathani", lat: 15.244, lon: 104.847, tz: "Asia/Bangkok", kind: "province" },
  // well-known cities that are not province seats
  { id: "pattaya", name: "พัทยา (ชลบุรี)", en: "Pattaya", lat: 12.927, lon: 100.877, tz: "Asia/Bangkok", kind: "city" },
  { id: "huahin", name: "หัวหิน (ประจวบคีรีขันธ์)", en: "Hua Hin", lat: 12.568, lon: 99.958, tz: "Asia/Bangkok", kind: "city" },
  { id: "hatyai", name: "หาดใหญ่ (สงขลา)", en: "Hat Yai", lat: 7.008, lon: 100.474, tz: "Asia/Bangkok", kind: "city" },
  { id: "samui", name: "เกาะสมุย (สุราษฎร์ธานี)", en: "Ko Samui", lat: 9.512, lon: 100.014, tz: "Asia/Bangkok", kind: "city" },
  { id: "maesot", name: "แม่สอด (ตาก)", en: "Mae Sot", lat: 16.713, lon: 98.574, tz: "Asia/Bangkok", kind: "city" },
  // Region & world
  { id: "vientiane", name: "เวียงจันทน์", en: "Vientiane", lat: 17.975, lon: 102.633, tz: "Asia/Vientiane", kind: "world" },
  { id: "phnompenh", name: "พนมเปญ", en: "Phnom Penh", lat: 11.556, lon: 104.928, tz: "Asia/Phnom_Penh", kind: "world" },
  { id: "yangon", name: "ย่างกุ้ง", en: "Yangon", lat: 16.84, lon: 96.173, tz: "Asia/Yangon", kind: "world" },
  { id: "hochiminh", name: "โฮจิมินห์", en: "Ho Chi Minh City", lat: 10.823, lon: 106.63, tz: "Asia/Ho_Chi_Minh", kind: "world" },
  { id: "kualalumpur", name: "กัวลาลัมเปอร์", en: "Kuala Lumpur", lat: 3.139, lon: 101.687, tz: "Asia/Kuala_Lumpur", kind: "world" },
  { id: "singapore", name: "สิงคโปร์", en: "Singapore", lat: 1.352, lon: 103.82, tz: "Asia/Singapore", kind: "world" },
  { id: "hongkong", name: "ฮ่องกง", en: "Hong Kong", lat: 22.319, lon: 114.169, tz: "Asia/Hong_Kong", kind: "world" },
  { id: "beijing", name: "ปักกิ่ง", en: "Beijing", lat: 39.904, lon: 116.407, tz: "Asia/Shanghai", kind: "world" },
  { id: "shanghai", name: "เซี่ยงไฮ้", en: "Shanghai", lat: 31.23, lon: 121.474, tz: "Asia/Shanghai", kind: "world" },
  { id: "taipei", name: "ไทเป", en: "Taipei", lat: 25.033, lon: 121.565, tz: "Asia/Taipei", kind: "world" },
  { id: "tokyo", name: "โตเกียว", en: "Tokyo", lat: 35.676, lon: 139.65, tz: "Asia/Tokyo", kind: "world" },
  { id: "seoul", name: "โซล", en: "Seoul", lat: 37.566, lon: 126.978, tz: "Asia/Seoul", kind: "world" },
  { id: "delhi", name: "นิวเดลี", en: "New Delhi", lat: 28.614, lon: 77.209, tz: "Asia/Kolkata", kind: "world" },
  { id: "dubai", name: "ดูไบ", en: "Dubai", lat: 25.205, lon: 55.271, tz: "Asia/Dubai", kind: "world" },
  { id: "london", name: "ลอนดอน", en: "London", lat: 51.507, lon: -0.128, tz: "Europe/London", kind: "world" },
  { id: "paris", name: "ปารีส", en: "Paris", lat: 48.857, lon: 2.352, tz: "Europe/Paris", kind: "world" },
  { id: "berlin", name: "เบอร์ลิน", en: "Berlin", lat: 52.52, lon: 13.405, tz: "Europe/Berlin", kind: "world" },
  { id: "newyork", name: "นิวยอร์ก", en: "New York", lat: 40.713, lon: -74.006, tz: "America/New_York", kind: "world" },
  { id: "losangeles", name: "ลอสแอนเจลิส", en: "Los Angeles", lat: 34.052, lon: -118.244, tz: "America/Los_Angeles", kind: "world" },
  { id: "sydney", name: "ซิดนีย์", en: "Sydney", lat: -33.869, lon: 151.209, tz: "Australia/Sydney", kind: "world" },
];

export const getPlace = (id: string) => PLACES.find((p) => p.id === id);

/** Find a place by its stored id or by a typed name (Thai or English). */
export function resolvePlace(text: string): Place | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return undefined;
  return PLACES.find((p) => p.id === t || p.name.toLowerCase() === t || p.en.toLowerCase() === t) ?? PLACES.find((p) => p.name.includes(text.trim()) || p.en.toLowerCase().includes(t));
}

/** Places grouped for a <select>: Thai provinces in Thai alphabetical order, then cities, then abroad. */
export function placeGroups() {
  const by = (k: Place["kind"]) => PLACES.filter((p) => p.kind === k).sort((a, b) => a.name.localeCompare(b.name, "th"));
  return [
    { label: "จังหวัดในประเทศไทย (77)", places: by("province") },
    { label: "เมือง / อำเภอสำคัญ", places: by("city") },
    { label: "ต่างประเทศ", places: by("world") },
  ];
}
