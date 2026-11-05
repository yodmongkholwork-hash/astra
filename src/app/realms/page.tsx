import type { Metadata } from "next";
import RealmExperience from "@/components/realms/RealmExperience";

export const metadata: Metadata = {
  title: "ASTRA — The Mystic Realms",
  description: "Beyond the Stars. Beyond Destiny. สำรวจอาณาจักรเวทมนตร์ 3 มิติ แล้วเข้าสู่ห้องพยากรณ์ของ ASTRA",
};

/** Cinematic real-time 3D layer on top of the existing ASTRA rooms. */
export default function RealmsPage() {
  return <RealmExperience />;
}
