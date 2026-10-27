import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const listingId = new URL(request.url).searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  const reviews = await prisma.review.findMany({
    where: { hidden: false, booking: { listingId, status: "CONFIRMED" } },
    orderBy: { createdAt: "desc" }, take: 100,
    select: { id: true, rating: true, comment: true, createdAt: true, booking: { select: { guest: { select: { name: true } } } } },
  });
  return NextResponse.json({ reviews });
}
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in to leave a review." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, suspendedAt: true } });
  if (!user || user.role !== "GUEST" || user.suspendedAt) return NextResponse.json({ error: "Guest account required." }, { status: 403 });
  let body: { bookingId?: unknown; rating?: unknown; comment?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const rating = body.rating;
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (typeof body.bookingId !== "string" || !Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5 || comment.length < 3 || comment.length > 1500)
    return NextResponse.json({ error: "Provide a booking ID, a rating from 1–5, and a 3–1500 character comment." }, { status: 400 });
  const booking = await prisma.booking.findFirst({ where: { id: body.bookingId, guestId: userId, status: "CONFIRMED", endDate: { lt: new Date() } }, select: { id: true } });
  if (!booking) return NextResponse.json({ error: "Only completed confirmed stays can be reviewed." }, { status: 403 });
  try {
    const review = await prisma.review.create({ data: { bookingId: booking.id, rating: Number(rating), comment }, select: { id: true, rating: true, comment: true, createdAt: true } });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
      return NextResponse.json({ error: "This booking already has a review." }, { status: 409 });
    console.error("Review creation failed", error);
    return NextResponse.json({ error: "Unable to save review." }, { status: 500 });
  }
}
