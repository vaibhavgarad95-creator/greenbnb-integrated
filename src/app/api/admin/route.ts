import { NextResponse } from "next/server";
import { ListingStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
export const runtime = "nodejs";
async function admin() {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, suspendedAt: true } });
  return user && user.role === Role.ADMIN && !user.suspendedAt ? user : null;
}
export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const [users, listings, bookings, reviewCount] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { id: true, name: true, email: true, role: true, suspendedAt: true, createdAt: true, _count: { select: { bookings: true, listings: true } } } }),
    prisma.listing.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { id: true, title: true, city: true, status: true, host: { select: { name: true, email: true } }, _count: { select: { bookings: true } } } }),
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { id: true, status: true, totalPrice: true, createdAt: true, guest: { select: { name: true, email: true } }, listing: { select: { title: true, hostId: true } } } }),
    prisma.review.count(),
  ]);
  return NextResponse.json({ users, listings, bookings, summary: { users: await prisma.user.count(), listings: await prisma.listing.count(), bookings: await prisma.booking.count(), reviews: reviewCount } });
}
export async function PATCH(request: Request) {
  const actor = await admin();
  if (!actor) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  let body: { type?: unknown; id?: unknown; action?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (typeof body.id !== "string" || typeof body.action !== "string" || typeof body.type !== "string") return NextResponse.json({ error: "type, id and action are required." }, { status: 400 });
  if (body.type === "user" && (body.action === "suspend" || body.action === "restore")) {
    if (body.id === actor.id) return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: body.id }, select: { role: true } });
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.role === Role.ADMIN) return NextResponse.json({ error: "Admin accounts cannot be suspended here." }, { status: 403 });
    await prisma.user.update({ where: { id: body.id }, data: { suspendedAt: body.action === "suspend" ? new Date() : null } });
    await prisma.auditEvent.create({ data: { actorId: actor.id, action: `USER_${body.action.toUpperCase()}`, entity: "User", entityId: body.id } });
    return NextResponse.json({ message: "User updated." });
  }
  if (body.type === "listing" && ["publish", "hide", "draft"].includes(body.action)) {
    const status = body.action === "publish" ? ListingStatus.PUBLISHED : body.action === "hide" ? ListingStatus.HIDDEN : ListingStatus.DRAFT;
    const result = await prisma.listing.updateMany({ where: { id: body.id }, data: { status } });
    if (!result.count) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    await prisma.auditEvent.create({ data: { actorId: actor.id, action: `LISTING_${body.action.toUpperCase()}`, entity: "Listing", entityId: body.id } });
    return NextResponse.json({ message: "Listing updated." });
  }
  return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });
}
