import { NextResponse, type NextRequest } from "next/server";

/**
 * Unknown room slugs must answer with a real HTTP 404.
 * With Cache Components the room page streams its shell before notFound()
 * runs (and `dynamicParams = false` is not available), so the first hit on a
 * bad slug would otherwise return 200. Keep in sync with src/lib/data/rooms.ts.
 */
const ROOM_SLUGS = new Set(["tarot", "astrology", "thai-astrology", "chinese-astrology", "numerology", "dreams", "palmistry"]);

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !ROOM_SLUGS.has(slug)) {
    // rewrite to a path no route matches → Next renders the not-found page with status 404
    return NextResponse.rewrite(new URL("/__astra-not-found", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/rooms/:slug" };
