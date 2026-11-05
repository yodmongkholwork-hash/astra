import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoomShell from "@/components/rooms/RoomShell";
import { getRoom, ROOMS } from "@/lib/data/rooms";

export function generateStaticParams() {
  return ROOMS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoom(slug);
  return room ? { title: `${room.nameTh} · ${room.name} — ASTRA`, description: room.tagline } : {};
}

export default async function RoomPage({ params }: PageProps<"/rooms/[slug]">) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();
  return <RoomShell slug={room.slug} />;
}
