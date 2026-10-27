import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingForm from "./bookingform";

type StayPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StayPage({ params }: StayPageProps) {
  const { slug } = await params;

  if (!slug || slug.trim().length === 0) {
    notFound();
  }

  // View Stay currently passes the database listing ID.
  // Also support a title-based URL for readable links.
  const normalizedTitle = slug.replaceAll("-", " ").trim();

  const listing = await prisma.listing.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [
        { id: slug },
        {
          title: {
            equals: normalizedTitle,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      city: true,
      country: true,
      address: true,
      pricePerNight: true,
      maxGuests: true,
      ecoScore: true,
      propertyType: true,
      houseRules: true,
    },
  });

  // Never expose drafts or hidden listings to public visitors.
  if (!listing) {
    notFound();
  }

  const pricePerNight = Number(listing.pricePerNight);

  const location = [
    listing.address,
    listing.city,
    listing.country,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(", ");

  const propertyType = listing.propertyType
    ? String(listing.propertyType).replaceAll("_", " ")
    : "Sustainable stay";

  return (
    <main className="min-h-screen bg-[#faf9f5] text-[#253b2d]">
      <header className="border-b border-[#e9e9df] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            🌿 GreenBnB
            <span className="ml-2 hidden text-sm font-normal text-[#748071] sm:inline">
              Sustainable stays
            </span>
          </Link>

          <Link
            href="/host/listings"
            className="rounded-full border border-[#d9ded3] px-4 py-2 text-sm font-semibold transition hover:bg-[#edf2e9]"
          >
            ← My Listings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="mb-8">
          <p className="mb-2 text-sm font-semibold capitalize text-[#52765a]">
            {propertyType} · GreenBnB
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {listing.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#667366]">
            {location && (
              <span className="rounded-full bg-white px-4 py-2">
                📍 {location}
              </span>
            )}

            <span className="rounded-full bg-white px-4 py-2">
              👥 Up to {listing.maxGuests} guests
            </span>

            {listing.ecoScore != null && (
              <span className="rounded-full bg-[#edf2e9] px-4 py-2 font-semibold text-[#356344]">
                🌱 Eco score: {listing.ecoScore}/100
              </span>
            )}
          </div>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-3xl border border-[#e4e8de] bg-gradient-to-br from-[#e5eddf] to-[#f2f5e9] sm:min-h-[430px]">
              <div className="text-center">
                <span
                  className="block text-[100px] sm:text-[150px]"
                  role="img"
                  aria-label="Nature-inspired accommodation"
                >
                  🌿
                </span>
                <p className="mt-2 font-semibold text-[#52765a]">
                  Your greener getaway
                </p>
              </div>
            </div>

            <section className="mt-8 rounded-2xl border border-[#e4e8de] bg-white p-6">
              <h2 className="text-2xl font-bold">About this stay</h2>

              <p className="mt-3 leading-7 text-[#667366]">
                Discover {listing.title}
                {location ? ` in ${location}` : ""}, and enjoy a comfortable
                stay with GreenBnB. Check the property details and booking
                information before planning your trip.
              </p>
            </section>

            <section className="mt-6 rounded-2xl border border-[#e4e8de] bg-white p-6">
              <h2 className="text-2xl font-bold">Stay information</h2>

              <div className="mt-4 divide-y divide-[#edf0e8]">
                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-[#667366]">Property type</span>
                  <span className="text-right font-semibold capitalize">
                    {propertyType}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-[#667366]">Maximum guests</span>
                  <span className="font-semibold">
                    {listing.maxGuests}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-[#667366]">Price per night</span>
                  <span className="font-semibold">
                    ₹{pricePerNight.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </section>

            {listing.houseRules && (
              <section className="mt-6 rounded-2xl border border-[#e4e8de] bg-white p-6">
                <h2 className="text-2xl font-bold">House rules</h2>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-[#667366]">
                  {listing.houseRules}
                </p>
              </section>
            )}

            <section className="mt-6 rounded-2xl bg-[#edf2e9] p-6">
              <h2 className="font-bold">Travel a little greener 🌱</h2>
              <p className="mt-2 text-sm leading-6 text-[#667366]">
                Choose a stay that helps you slow down, explore your
                surroundings, and plan your next getaway.
              </p>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <BookingForm
              listingId={listing.id}
              pricePerNight={pricePerNight}
              stayName={listing.title}
              maxGuests={listing.maxGuests}
            />
          </aside>
        </div>
      </div>

      <footer className="mt-12 border-t border-[#e9e9df] bg-white px-5 py-6 text-center text-sm text-[#748071]">
        © {new Date().getFullYear()} GreenBnB · Find your greener getaway.
      </footer>
    </main>
  );
}