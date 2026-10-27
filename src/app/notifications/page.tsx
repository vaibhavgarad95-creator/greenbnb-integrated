import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function NotificationsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, suspendedAt: true } });
  if (!user || user.suspendedAt) redirect("/login");
  const bookings = await prisma.booking.findMany({
    where: user.role === "GUEST" ? { guestId: userId } : user.role === "ADMIN" ? {} : { listing: { hostId: userId } },
    orderBy: { createdAt: "desc" }, take: 50,
    include: { listing: { select: { id: true, title: true } }, guest: { select: { name: true } } },
  });
  const notices = bookings.map(b => ({
    id: b.id, date: b.createdAt, title: user.role === "GUEST"
      ? (b.status === "CONFIRMED" ? "Booking confirmed" : b.status === "REJECTED" ? "Booking request declined" : b.status === "CANCELLED" ? "Booking cancelled" : "Booking request submitted")
      : (b.status === "PENDING" ? "New booking request" : `Booking ${b.status.toLowerCase()}`),
    detail: user.role === "GUEST" ? b.listing.title : `${b.guest.name} · ${b.listing.title}`,
    status: b.status,
  }));
  return <main className="min-h-screen bg-[#f7f8f4] px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/" className="font-semibold text-green-800">← GreenBnB</Link><h1 className="mt-6 text-3xl font-bold">Notifications</h1><p className="mt-2 text-stone-600">Updates derived from your booking activity.</p>
  {notices.length === 0 ? <div className="mt-6 rounded-2xl bg-white p-8 text-stone-600">You're all caught up. Booking updates will appear here.</div> : <div className="mt-6 space-y-3">{notices.map(n => <article key={n.id} className="rounded-xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{n.title}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{n.status}</span></div><p className="mt-1 text-stone-600">{n.detail}</p><p className="mt-2 text-xs text-stone-500">{n.date.toLocaleString("en-IN")}</p></article>)}</div>}</div></main>;
}
