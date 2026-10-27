import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function GuestDashboard() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, suspendedAt: true, createdAt: true } });
  if (!user || user.suspendedAt) redirect("/login");
  if (user.role === "HOST" || user.role === "ADMIN") redirect(user.role === "ADMIN" ? "/admin" : "/host/dashboard");
  const [bookings, favorites, reviews] = await Promise.all([
    prisma.booking.findMany({ where: { guestId: userId }, orderBy: { createdAt: "desc" }, take: 5, include: { listing: { select: { id: true, title: true, city: true, country: true } } } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.review.count({ where: { booking: { guestId: userId } } }),
  ]);
  const stat = (label: string, value: number) => <div className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-3xl font-bold text-green-900">{value}</p></div>;
  return <main className="min-h-screen bg-[#f7f8f4] px-4 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/" className="font-semibold text-green-800">← GreenBnB</Link>
    <header className="my-7 rounded-3xl bg-gradient-to-br from-emerald-100 to-amber-50 p-8"><p className="text-sm font-bold tracking-widest text-green-800">YOUR ACCOUNT</p><h1 className="mt-2 text-3xl font-bold">Welcome, {user.name}</h1><p className="mt-2 text-stone-600">{user.email}</p><p className="mt-1 text-sm text-stone-500">Member since {user.createdAt.toLocaleDateString("en-IN")}</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/bookings" className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white">My bookings</Link><Link href="/explore" className="rounded-lg border border-green-800 px-4 py-2 font-semibold text-green-900">Explore stays</Link><Link href="/favorites" className="rounded-lg border border-green-800 px-4 py-2 font-semibold text-green-900">Saved stays</Link><Link href="/notifications" className="rounded-lg border border-green-800 px-4 py-2 font-semibold text-green-900">Notifications</Link></div></header>
    <div className="grid gap-4 sm:grid-cols-3">{stat("Total bookings", await prisma.booking.count({ where: { guestId: userId } }))}{stat("Saved stays", favorites)}{stat("Reviews written", reviews)}</div>
    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-bold">Recent bookings</h2><Link href="/bookings" className="font-semibold text-green-800">View all →</Link></div>
    {bookings.length === 0 ? <div className="rounded-2xl bg-white p-8 text-stone-600">You have no bookings yet. <Link href="/explore" className="font-semibold text-green-800 underline">Find a stay</Link>.</div> : <div className="space-y-3">{bookings.map(b => <article key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-5"><div><h3 className="font-bold">{b.listing.title}</h3><p className="text-sm text-stone-500">{b.listing.city}, {b.listing.country} · {b.startDate.toLocaleDateString("en-IN")} – {b.endDate.toLocaleDateString("en-IN")}</p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold">{b.status}</span></article>)}</div>}</section>
  </div></main>;
}
