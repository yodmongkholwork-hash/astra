import Starfield from "@/components/cosmos/Starfield";
import { Constellations, Motes, Nebula } from "@/components/cosmos/Atmosphere";
import SiteHeader from "@/components/universe/SiteHeader";
import Hero from "@/components/universe/Hero";
import Chambers from "@/components/universe/Chambers";
import OracleCourt from "@/components/universe/OracleCourt";
import DailyOmen from "@/components/universe/DailyOmen";
import SiteFooter from "@/components/universe/SiteFooter";
import { isDemoMode } from "@/lib/config";

/** Phase 1 — ASTRA Universe */
export default function UniversePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* fixed cosmic backdrop */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1a0f3a_0%,#0a0f2c_45%,#06040d_100%)]">
        <Nebula colors={["#4b1d6e", "#13235e", "#5a1d4f"]} />
        <Starfield />
        <Constellations />
        <Motes count={24} />
      </div>

      <SiteHeader demo={isDemoMode()} />
      <Hero />
      <Chambers />
      <OracleCourt />
      <DailyOmen />
      <SiteFooter />
    </main>
  );
}
