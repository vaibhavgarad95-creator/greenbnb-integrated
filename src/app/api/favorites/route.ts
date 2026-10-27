import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, suspendedAt: true } });
  if (!user || user.suspendedAt) return NextResponse.json({ error: "Account unavailable." }, { status: 403 });
  const favorites = await prisma.favorite.findMany({ where: { userId }, include: { listing: { select: { id: true, title: true, city: true, country: true, pricePerNight: true, status: true, images: { orderBy: { position: "asc" }, take: 1 } } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ favorites: favorites.filter(f => f.listing.status === "PUBLISHED") });
}
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { suspendedAt: true } });
  if (!user || user.suspendedAt) return NextResponse.json({ error: "Account unavailable." }, { status: 403 });
  let body: { listingId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (typeof body.listingId !== "string" || !body.listingId.trim()) return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  const listing = await prisma.listing.findFirst({ where: { id: body.listingId, status: "PUBLISHED" }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  const existing = await prisma.favorite.findUnique({ where: { userId_listingId: { userId, listingId: listing.id } } });
  if (existing) {
    await prisma.favorite.delete({ where: { userId_listingId: { userId, listingId: listing.id } } });
    return NextResponse.json({ favorited: false });
  }
  await prisma.favorite.create({ data: { userId, listingId: listing.id } });
  return NextResponse.json({ favorited: true }, { status: 201 });
}
