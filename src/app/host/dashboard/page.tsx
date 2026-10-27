
"use client";

import { useCallback, useEffect, useState } from "react";

type Listing = {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNight: string | number;
  status: string;
  maxGuests: number;
};

type BookingRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCity: string;
  startDate: string;
  endDate: string;
  guests: number;
  totalPrice: string | number;
  status: string;
  createdAt: string;
  guest: { name: string; email: string };
};

type DashboardData = {
  host: { name: string; role: string };
  summary: {
    totalListings: number;
    pendingRequests: number;
    confirmedBookings: number;
  };
  listings: Listing[];
  bookingRequests: BookingRequest[];
};

const money = (amount: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v12h14V9M9 21v-7h6v7" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M10 21v-3h4v3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M3 3v18h18M7 14l4-4 4 3 5-7" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M7 17 17 7M7 7h10v10" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
  }
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
  accent: "green" | "amber" | "blue";
}) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
  };

  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <span className={`rounded-xl p-3 ${styles[accent]}`}>
          <Icon name={icon} size={21} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-stone-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-stone-500">{description}</p>
    </article>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon name="calendar" size={23} />
      </div>
      <h3 className="mt-4 font-semibold text-stone-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
        {description}
      </p>
    </div>
  );
}

export default function HostDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingActionId, setBookingActionId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/host/dashboard", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load dashboard.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBookingAction = async (
    bookingId: string,
    status: "CONFIRMED" | "REJECTED"
  ) => {
    setBookingActionId(bookingId);
    setActionMessage("");
    setActionError("");

    try {
      const response = await fetch(
        `/api/host/bookings/${encodeURIComponent(bookingId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update booking.");
      }

      setActionMessage(
        result.message ||
          (status === "CONFIRMED"
            ? "Booking confirmed successfully."
            : "Booking rejected successfully.")
      );

      await loadDashboard();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the booking."
      );
    } finally {
      setBookingActionId("");
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] p-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          <p className="mt-4 text-sm text-stone-600">
            Preparing your GreenBnB dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] p-6">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-900">
            Dashboard unavailable
          </h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button
            onClick={() => void loadDashboard()}
            className="mt-6 rounded-xl bg-emerald-800 px-5 py-3 font-medium text-white transition hover:bg-emerald-900"
          >
            Try again
          </button>
          <p className="mt-4 text-xs leading-5 text-stone-500">
            Check that you are signed in with an account that has the HOST role.
          </p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-stone-200/80 bg-white px-5 py-7 lg:flex lg:flex-col">
          <a href="/" className="flex items-center gap-3 px-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-800 text-white">
              <Icon name="home" size={23} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                GreenBnB
              </span>
              <span className="text-xs text-stone-500">Host workspace</span>
            </span>
          </a>

          <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Workspace
          </p>

          <nav className="space-y-1">
            <a
              href="/host/dashboard"
              aria-current="page"
              className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-900"
            >
              <Icon name="chart" />
              Overview
            </a>
            <a
              href="#properties"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
            >
              <Icon name="building" />
              My properties
            </a>
            <a
              href="#requests"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
            >
              <Icon name="calendar" />
              Booking requests
              {data.summary.pendingRequests > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {data.summary.pendingRequests}
                </span>
              )}
            </a>
          </nav>

          <div className="mt-auto rounded-2xl bg-[#f2f5ed] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
              <Icon name="users" size={19} />
            </div>
            <p className="mt-3 text-sm font-semibold">A greener stay</p>
            <p className="mt-1 text-xs leading-5 text-stone-600">
              Manage your stays and welcome your next guest.
            </p>
            <a
              href="/"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Explore GreenBnB <Icon name="arrow" size={14} />
            </a>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-8 lg:px-10">
            <a href="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white">
                <Icon name="home" size={19} />
              </span>
              <span className="font-bold">GreenBnB</span>
            </a>
            <div className="hidden text-sm text-stone-500 sm:block">
              Host workspace <span className="mx-2 text-stone-300">/</span>{" "}
              <span className="font-medium text-stone-800">Overview</span>
            </div>
            <a
              href="/"
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 sm:px-4"
            >
              <Icon name="home" size={17} />
              <span>Back to home</span>
            </a>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
            <section className="relative overflow-hidden rounded-3xl bg-[#183e32] px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
              <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-1 -top-14 h-48 w-48 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />

              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                  Your hosting overview
                </span>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome back, {data.host.name}.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                  Your space for managing stays, tracking reservations, and
                  making every guest experience memorable.
                </p>
                <a
                  href="#properties"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
                >
                  View my properties <Icon name="arrow" size={17} />
                </a>
              </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="My listings"
                value={data.summary.totalListings}
                description="Properties in your portfolio"
                icon="building"
                accent="green"
              />
              <StatCard
                title="Pending requests"
                value={data.summary.pendingRequests}
                description="Reservations awaiting a decision"
                icon="clock"
                accent="amber"
              />
              <StatCard
                title="Confirmed bookings"
                value={data.summary.confirmedBookings}
                description="Accepted guest reservations"
                icon="calendar"
                accent="blue"
              />
            </section>

            <section id="properties" className="mt-10 scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                    Your portfolio
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    My properties
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    Keep track of the stays you manage.
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
                  {data.listings.length}{" "}
                  {data.listings.length === 1 ? "property" : "properties"}
                </span>
              </div>

              {data.listings.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    title="Your next great stay starts here"
                    description="Properties assigned to your host account will appear here."
                  />
                </div>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {data.listings.map((listing) => (
                    <article
                      key={listing.id}
                      className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-[#dce8d7] via-[#eaf0e3] to-[#c5d9ca] p-5">
                        <div className="absolute -right-5 -top-10 h-40 w-40 rounded-full border border-white/60" />
                        <div className="absolute -right-1 -top-2 h-28 w-28 rounded-full border border-white/60" />
                        <div className="absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-emerald-950/10 to-transparent" />
                        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/70 text-emerald-900 shadow-sm backdrop-blur">
                          <Icon name="building" size={25} />
                        </span>
                        <span
                          className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                            listing.status === "PUBLISHED"
                              ? "bg-white/90 text-emerald-800"
                              : "bg-white/90 text-stone-700"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-semibold tracking-tight text-stone-900">
                          {listing.title}
                        </h3>
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
                          <Icon name="pin" size={16} />
                          {listing.city}, {listing.country}
                        </p>
                        <div className="my-5 border-t border-stone-100" />
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xl font-semibold text-emerald-900">
                              {money(listing.pricePerNight)}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              per night
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600">
                            <Icon name="users" size={15} />
                            Up to {listing.maxGuests}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section id="requests" className="mt-12 scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                    Guest management
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Booking requests
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    Review reservation details from your guests.
                  </p>
                </div>
                {data.summary.pendingRequests > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
                    {data.summary.pendingRequests} awaiting review
                  </span>
                )}
              </div>

              {actionMessage && (
                <p
                  role="status"
                  className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                  {actionMessage}
                </p>
              )}

              {actionError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
                >
                  {actionError}
                </p>
              )}

              {data.bookingRequests.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    title="No booking requests yet"
                    description="When guests request a stay at one of your properties, their reservation details will appear here."
                  />
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {data.bookingRequests.map((booking) => (
                    <article
                      key={booking.id}
                      className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-stone-900">
                            {booking.listingTitle}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                            <Icon name="pin" size={15} />
                            {booking.listingCity}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            booking.status === "PENDING"
                              ? "bg-amber-50 text-amber-800"
                              : booking.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-800"
                                : booking.status === "REJECTED"
                                  ? "bg-red-50 text-red-800"
                                  : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 rounded-xl bg-[#f8f9f5] p-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs text-stone-500">Guest</p>
                          <p className="mt-1 text-sm font-medium text-stone-800">
                            {booking.guest.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Email</p>
                          <p className="mt-1 break-all text-sm font-medium text-stone-800">
                            {booking.guest.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Guests</p>
                          <p className="mt-1 text-sm font-medium text-stone-800">
                            {booking.guests}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Check-in</p>
                          <p className="mt-1 text-sm font-medium text-stone-800">
                            {formatDate(booking.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Check-out</p>
                          <p className="mt-1 text-sm font-medium text-stone-800">
                            {formatDate(booking.endDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Total price</p>
                          <p className="mt-1 text-sm font-semibold text-emerald-900">
                            {money(booking.totalPrice)}
                          </p>
                        </div>
                      </div>

                      {booking.status === "PENDING" && (
                        <div className="mt-5">
                          <p className="flex items-start gap-2 text-sm leading-6 text-amber-800">
                            <span className="mt-0.5">
                              <Icon name="clock" size={17} />
                            </span>
                            Review this request and choose whether to accept it.
                          </p>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={bookingActionId !== ""}
                              onClick={() =>
                                void handleBookingAction(
                                  booking.id,
                                  "CONFIRMED"
                                )
                              }
                              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {bookingActionId === booking.id
                                ? "Processing..."
                                : "Confirm booking"}
                            </button>

                            <button
                              type="button"
                              disabled={bookingActionId !== ""}
                              onClick={() =>
                                void handleBookingAction(
                                  booking.id,
                                  "REJECTED"
                                )
                              }
                              className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {bookingActionId === booking.id
                                ? "Processing..."
                                : "Reject booking"}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <footer className="mt-14 border-t border-stone-200 py-6 text-center text-xs text-stone-500">
              GreenBnB Host Workspace · Thoughtful stays, greener choices.
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
