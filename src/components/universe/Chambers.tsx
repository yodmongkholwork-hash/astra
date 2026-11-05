import { ROOMS } from "@/lib/data/rooms";
import RoomPortal from "./RoomPortal";
import { SectionTitle } from "./OracleCourt";
import { Mist } from "@/components/cosmos/Atmosphere";

/** The seven doorways of the Universe. */
export default function Chambers() {
  return (
    <section id="chambers" className="relative scroll-mt-20 px-4 py-24 md:py-32">
      {/* faint celestial ring behind the doors */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/10 animate-spin-slower">
        <div className="absolute inset-16 rounded-full border border-dashed border-lilac/10" />
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/70 shadow-[0_0_14px_#e6c47a]" />
      </div>
      <Mist className="bottom-0 h-56" opacity={0.8} />

      <div className="relative mx-auto max-w-6xl">
        <SectionTitle eyebrow="The Seven Chambers" title="ประตูเจ็ดบานแห่งจักรวาล" sub="แตะที่ประตูเพื่อเดินทางเข้าสู่ห้อง แต่ละห้องมีศาสตร์ บรรยากาศ และผู้พิทักษ์เป็นของตัวเอง" />
        <div className="mt-16 flex flex-wrap justify-center gap-y-14">
          {ROOMS.map((room, i) => (
            <div key={room.slug} className="w-1/2 px-3 sm:w-1/3 sm:px-5 lg:w-1/4">
              <RoomPortal room={room} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
