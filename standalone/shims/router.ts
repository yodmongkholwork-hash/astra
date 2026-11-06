// Tiny router used when ASTRA is bundled as a single page (no Next server).
// App paths map to plain hash names so links stay shareable inside an artifact:
//   /            → (empty)        /profile → #profile
//   /realms      → #realms        /realms?focus=tarot → #realms-tarot
//   /rooms/tarot → #room-tarot
// Any other hash (#chambers, #daily …) is an in-page anchor and keeps the current page.
type Listener = () => void;
const listeners = new Set<Listener>();

export function toHash(path: string): string {
  const [p, q] = path.split("?");
  if (p === "/" || p === "") return "";
  if (p === "/profile") return "profile";
  if (p === "/realms") {
    const focus = new URLSearchParams(q ?? "").get("focus");
    return focus ? `realms-${focus}` : "realms";
  }
  const room = p.match(/^\/rooms\/([a-z-]+)$/);
  return room ? `room-${room[1]}` : "";
}

function fromHash(h: string): string | null {
  const n = h.replace(/^#/, "");
  if (n === "") return "/";
  if (n === "profile") return "/profile";
  if (n === "realms") return "/realms";
  const f = n.match(/^realms-([a-z]+)$/);
  if (f) return `/realms?focus=${f[1]}`;
  const r = n.match(/^room-([a-z-]+)$/);
  if (r) return `/rooms/${r[1]}`;
  return null; // in-page anchor
}

let route = (typeof window !== "undefined" && fromHash(window.location.hash)) || "/";

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const next = fromHash(window.location.hash);
    if (next && next !== route) {
      route = next;
      listeners.forEach((l) => l());
    }
  });
}

export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getRoute = () => route;
export const pathOf = (r: string) => r.split("?")[0].split("#")[0] || "/";

export function navigate(href: string, opts: { scroll?: boolean } = {}) {
  const [pathAndQuery, fragment] = href.split("#");
  const target = pathAndQuery || pathOf(route);
  route = target;
  try {
    const h = toHash(target);
    if (window.location.hash.replace(/^#/, "") !== h) window.location.hash = h;
  } catch {
    /* hash not writable in this frame — in-memory routing still works */
  }
  listeners.forEach((l) => l());
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (fragment) document.getElementById(fragment)?.scrollIntoView({ behavior: "smooth" });
      else if (opts.scroll !== false) window.scrollTo(0, 0);
    }),
  );
}
