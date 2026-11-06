import "./demo-fetch";
import { StrictMode, useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { AstraProvider } from "@/components/providers/AstraProvider";
import Starfield from "@/components/cosmos/Starfield";
import { Constellations, Motes, Nebula } from "@/components/cosmos/Atmosphere";
import SiteHeader from "@/components/universe/SiteHeader";
import Hero from "@/components/universe/Hero";
import Chambers from "@/components/universe/Chambers";
import OracleCourt from "@/components/universe/OracleCourt";
import DailyOmen from "@/components/universe/DailyOmen";
import SiteFooter from "@/components/universe/SiteFooter";
import RoomShell from "@/components/rooms/RoomShell";
import ProfileDashboard from "@/components/profile/ProfileDashboard";
import RealmExperience from "@/components/realms/RealmExperience";
import { getRoom } from "@/lib/data/rooms";
import { getRoute, pathOf, subscribe } from "./shims/router";

function Universe() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1a0f3a_0%,#0a0f2c_45%,#06040d_100%)]">
        <Nebula colors={["#4b1d6e", "#13235e", "#5a1d4f"]} />
        <Starfield />
        <Constellations />
        <Motes count={24} />
      </div>
      <SiteHeader demo />
      <Hero />
      <Chambers />
      <OracleCourt />
      <DailyOmen />
      <SiteFooter />
    </main>
  );
}

function Profile() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1a0f3a_0%,#0a0f2c_45%,#06040d_100%)]">
        <Nebula colors={["#3a1d6e", "#13235e", "#4a1d4f"]} />
        <Starfield density={0.6} />
      </div>
      <SiteHeader demo />
      <ProfileDashboard />
    </main>
  );
}

const TITLES: Record<string, string> = { "/": "ASTRA — Enter the Universe", "/realms": "ASTRA — The Mystic Realms", "/profile": "จักรวาลส่วนตัว — ASTRA" };

function App() {
  const route = useSyncExternalStore(subscribe, getRoute);
  const path = pathOf(route);
  const room = path.startsWith("/rooms/") ? getRoom(path.slice(7)) : null;
  useEffect(() => {
    document.title = room ? `${room.nameTh} — ASTRA` : TITLES[path] ?? "ASTRA";
  }, [path, room]);

  let page;
  if (room) page = <RoomShell key={room.slug} slug={room.slug} />;
  else if (path === "/realms") page = <RealmExperience key={route} />;
  else if (path === "/profile") page = <Profile />;
  else page = <Universe />;
  return <AstraProvider>{page}</AstraProvider>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
