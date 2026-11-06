/**
 * Birthplaces for chart calculation (latitude/longitude in degrees, IANA time zone).
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
}

export const PLACES: Place[] = [
  // Thailand
  { id: "bangkok", name: "กรุงเทพมหานคร", en: "Bangkok", lat: 13.756, lon: 100.502, tz: "Asia/Bangkok" },
  { id: "nonthaburi", name: "นนทบุรี", en: "Nonthaburi", lat: 13.862, lon: 100.514, tz: "Asia/Bangkok" },
  { id: "pathumthani", name: "ปทุมธานี", en: "Pathum Thani", lat: 14.02, lon: 100.525, tz: "Asia/Bangkok" },
  { id: "samutprakan", name: "สมุทรปราการ", en: "Samut Prakan", lat: 13.599, lon: 100.597, tz: "Asia/Bangkok" },
  { id: "nakhonpathom", name: "นครปฐม", en: "Nakhon Pathom", lat: 13.82, lon: 100.062, tz: "Asia/Bangkok" },
  { id: "ayutthaya", name: "พระนครศรีอยุธยา", en: "Ayutthaya", lat: 14.353, lon: 100.568, tz: "Asia/Bangkok" },
  { id: "chiangmai", name: "เชียงใหม่", en: "Chiang Mai", lat: 18.788, lon: 98.985, tz: "Asia/Bangkok" },
  { id: "chiangrai", name: "เชียงราย", en: "Chiang Rai", lat: 19.907, lon: 99.83, tz: "Asia/Bangkok" },
  { id: "lampang", name: "ลำปาง", en: "Lampang", lat: 18.29, lon: 99.49, tz: "Asia/Bangkok" },
  { id: "phitsanulok", name: "พิษณุโลก", en: "Phitsanulok", lat: 16.821, lon: 100.265, tz: "Asia/Bangkok" },
  { id: "nakhonsawan", name: "นครสวรรค์", en: "Nakhon Sawan", lat: 15.704, lon: 100.137, tz: "Asia/Bangkok" },
  { id: "khonkaen", name: "ขอนแก่น", en: "Khon Kaen", lat: 16.441, lon: 102.836, tz: "Asia/Bangkok" },
  { id: "udonthani", name: "อุดรธานี", en: "Udon Thani", lat: 17.415, lon: 102.787, tz: "Asia/Bangkok" },
  { id: "nakhonratchasima", name: "นครราชสีมา", en: "Nakhon Ratchasima", lat: 14.97, lon: 102.102, tz: "Asia/Bangkok" },
  { id: "ubonratchathani", name: "อุบลราชธานี", en: "Ubon Ratchathani", lat: 15.244, lon: 104.847, tz: "Asia/Bangkok" },
  { id: "chonburi", name: "ชลบุรี", en: "Chonburi", lat: 13.361, lon: 100.985, tz: "Asia/Bangkok" },
  { id: "pattaya", name: "พัทยา", en: "Pattaya", lat: 12.927, lon: 100.877, tz: "Asia/Bangkok" },
  { id: "rayong", name: "ระยอง", en: "Rayong", lat: 12.68, lon: 101.257, tz: "Asia/Bangkok" },
  { id: "kanchanaburi", name: "กาญจนบุรี", en: "Kanchanaburi", lat: 14.004, lon: 99.548, tz: "Asia/Bangkok" },
  { id: "ratchaburi", name: "ราชบุรี", en: "Ratchaburi", lat: 13.536, lon: 99.817, tz: "Asia/Bangkok" },
  { id: "huahin", name: "หัวหิน (ประจวบคีรีขันธ์)", en: "Hua Hin", lat: 12.568, lon: 99.958, tz: "Asia/Bangkok" },
  { id: "suratthani", name: "สุราษฎร์ธานี", en: "Surat Thani", lat: 9.14, lon: 99.333, tz: "Asia/Bangkok" },
  { id: "nakhonsithammarat", name: "นครศรีธรรมราช", en: "Nakhon Si Thammarat", lat: 8.432, lon: 99.963, tz: "Asia/Bangkok" },
  { id: "phuket", name: "ภูเก็ต", en: "Phuket", lat: 7.88, lon: 98.392, tz: "Asia/Bangkok" },
  { id: "krabi", name: "กระบี่", en: "Krabi", lat: 8.086, lon: 98.906, tz: "Asia/Bangkok" },
  { id: "hatyai", name: "หาดใหญ่ (สงขลา)", en: "Hat Yai", lat: 7.008, lon: 100.474, tz: "Asia/Bangkok" },
  { id: "pattani", name: "ปัตตานี", en: "Pattani", lat: 6.869, lon: 101.25, tz: "Asia/Bangkok" },
  // Region & world
  { id: "vientiane", name: "เวียงจันทน์", en: "Vientiane", lat: 17.975, lon: 102.633, tz: "Asia/Vientiane" },
  { id: "phnompenh", name: "พนมเปญ", en: "Phnom Penh", lat: 11.556, lon: 104.928, tz: "Asia/Phnom_Penh" },
  { id: "yangon", name: "ย่างกุ้ง", en: "Yangon", lat: 16.84, lon: 96.173, tz: "Asia/Yangon" },
  { id: "hochiminh", name: "โฮจิมินห์", en: "Ho Chi Minh City", lat: 10.823, lon: 106.63, tz: "Asia/Ho_Chi_Minh" },
  { id: "kualalumpur", name: "กัวลาลัมเปอร์", en: "Kuala Lumpur", lat: 3.139, lon: 101.687, tz: "Asia/Kuala_Lumpur" },
  { id: "singapore", name: "สิงคโปร์", en: "Singapore", lat: 1.352, lon: 103.82, tz: "Asia/Singapore" },
  { id: "hongkong", name: "ฮ่องกง", en: "Hong Kong", lat: 22.319, lon: 114.169, tz: "Asia/Hong_Kong" },
  { id: "beijing", name: "ปักกิ่ง", en: "Beijing", lat: 39.904, lon: 116.407, tz: "Asia/Shanghai" },
  { id: "shanghai", name: "เซี่ยงไฮ้", en: "Shanghai", lat: 31.23, lon: 121.474, tz: "Asia/Shanghai" },
  { id: "taipei", name: "ไทเป", en: "Taipei", lat: 25.033, lon: 121.565, tz: "Asia/Taipei" },
  { id: "tokyo", name: "โตเกียว", en: "Tokyo", lat: 35.676, lon: 139.65, tz: "Asia/Tokyo" },
  { id: "seoul", name: "โซล", en: "Seoul", lat: 37.566, lon: 126.978, tz: "Asia/Seoul" },
  { id: "delhi", name: "นิวเดลี", en: "New Delhi", lat: 28.614, lon: 77.209, tz: "Asia/Kolkata" },
  { id: "dubai", name: "ดูไบ", en: "Dubai", lat: 25.205, lon: 55.271, tz: "Asia/Dubai" },
  { id: "london", name: "ลอนดอน", en: "London", lat: 51.507, lon: -0.128, tz: "Europe/London" },
  { id: "paris", name: "ปารีส", en: "Paris", lat: 48.857, lon: 2.352, tz: "Europe/Paris" },
  { id: "berlin", name: "เบอร์ลิน", en: "Berlin", lat: 52.52, lon: 13.405, tz: "Europe/Berlin" },
  { id: "newyork", name: "นิวยอร์ก", en: "New York", lat: 40.713, lon: -74.006, tz: "America/New_York" },
  { id: "losangeles", name: "ลอสแอนเจลิส", en: "Los Angeles", lat: 34.052, lon: -118.244, tz: "America/Los_Angeles" },
  { id: "sydney", name: "ซิดนีย์", en: "Sydney", lat: -33.869, lon: 151.209, tz: "Australia/Sydney" },
];

export const getPlace = (id: string) => PLACES.find((p) => p.id === id);

/** Find a place by its stored id or by a typed name (Thai or English). */
export function resolvePlace(text: string): Place | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return undefined;
  return PLACES.find((p) => p.id === t || p.name.toLowerCase() === t || p.en.toLowerCase() === t) ?? PLACES.find((p) => p.name.includes(text.trim()) || p.en.toLowerCase().includes(t));
}
