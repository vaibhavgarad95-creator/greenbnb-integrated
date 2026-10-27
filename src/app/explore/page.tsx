import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SaveStayButton from "@/app/components/SaveStayButton";

type SearchParams = Promise<{ q?: string; city?: string; min?: string; max?: string; guests?: string; eco?: string }>;

export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const city = (params.city ?? "").trim().slice(0, 100);
  const min = Number(params.min);
  const max = Number(params.max);
  const guests = Number(params.guests);
  const eco = params.eco === "1";
  const listings = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }, { city: { contains: q, mode: "insensitive" as const } }, { country: { contains: q, mode: "insensitive" as const } }] } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
      ...(Number.isFinite(min) && params.min ? { pricePerNight: { gte: min } } : {}),
      ...(Number.isFinite(max) && params.max ? { pricePerNight: { lte: max } } : {}),
      ...(Number.isInteger(guests) && guests > 0 ? { maxGuests: { gte: guests } } : {}),
      ...(eco ? { ecoScore: { gte: 70 } } : {}),
    },
    orderBy: [{ ecoScore: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { images: { orderBy: { position: "asc" }, take: 1 }, amenities: { include: { amenity: true } }, _count: { select: { bookings: true } } },
  });
  return <main className="min-h-screen bg-[#f7f8f4] px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/" className="font-semibold text-green-800">← GreenBnB</Link>
      <header className="my-7"><p className="text-sm font-bold tracking-widest text-green-700">FIND YOUR NEXT ESCAPE</p><h1 className="mt-2 text-4xl font-bold text-stone-900">Explore sustainable stays</h1><p className="mt-2 text-stone-600">Search real published listings and filter by budget, location, guests, and eco score.</p></header>
      <form className="mb-8 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Keyword" className="rounded-lg border p-3 lg:col-span-2" />
        <input name="city" defaultValue={city} placeholder="City" className="rounded-lg border p-3" />
        <input name="min" defaultValue={params.min} type="number" min="0" placeholder="Min ₹/night" className="rounded-lg border p-3" />
        <input name="max" defaultValue={params.max} type="number" min="0" placeholder="Max ₹/night" className="rounded-lg border p-3" />
        <input name="guests" defaultValue={params.guests} type="number" min="1" max="50" placeholder="Guests" className="rounded-lg border p-3" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="eco" value="1" defaultChecked={eco} /> Eco score 70+</label>
        <button className="rounded-lg bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 lg:col-span-2">Search stays</button>
        <Link href="/explore" className="self-center text-center text-sm font-semibold text-green-800">Clear filters</Link>
      </form>
      <p className="mb-4 text-sm text-stone-600">{listings.length} stay(s) found</p>
      {listings.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center"><h2 className="text-xl font-bold">No stays match those filters</h2><p className="mt-2 text-stone-600">Try a different location or a wider budget.</p></div> :
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {item.images[0] ? <img src={item.images[0].url} alt={item.images[0].alt || item.title} className="h-48 w-full object-cover" /> : <div className="grid h-48 place-items-center bg-emerald-50 text-6xl">🌿</div>}
        <div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{item.title}</h2><span className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">Eco {item.ecoScore}</span></div>
        <p className="mt-1 text-sm text-stone-600">📍 {item.city}, {item.country}</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">{item.amenities.slice(0,4).map(a => <span key={a.amenityId} className="rounded-full bg-stone-100 px-2 py-1 text-xs">{a.amenity.name}</span>)}</div>
        <p className="mt-4 text-xl font-bold text-green-900">₹{Number(item.pricePerNight).toLocaleString("en-IN")} <span className="text-sm font-normal text-stone-500">/ night</span></p>
        <Link href={`/stays/${item.id}`} className="mt-4 block rounded-lg bg-green-800 px-4 py-3 text-center font-semibold text-white">View stay →</Link><SaveStayButton listingId={item.id} /></div>
      </article>)}</div>}
    </div>
  </main>;
}
