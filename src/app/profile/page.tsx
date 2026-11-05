import type { Metadata } from "next";
import Starfield from "@/components/cosmos/Starfield";
import { Nebula } from "@/components/cosmos/Atmosphere";
import SiteHeader from "@/components/universe/SiteHeader";
import ProfileDashboard from "@/components/profile/ProfileDashboard";
import { isDemoMode } from "@/lib/config";

export const metadata: Metadata = { title: "จักรวาลส่วนตัว — ASTRA" };

/** Phase 6 — User Profile, Personal Dashboard, Daily Horoscope and reading history. */
export default function ProfilePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1a0f3a_0%,#0a0f2c_45%,#06040d_100%)]">
        <Nebula colors={["#3a1d6e", "#13235e", "#4a1d4f"]} />
        <Starfield density={0.6} />
      </div>
      <SiteHeader demo={isDemoMode()} />
      <ProfileDashboard />
    </main>
  );
}
