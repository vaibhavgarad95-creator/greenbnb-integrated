

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

type ListingStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

type Listing = {
  id: string;
  title: string;
  description?: string;
  propertyType?: string;
  city: string;
  country: string;
  address?: string;
  pricePerNight: number | string;
  ecoScore: number;
  energyRating: string;
  status: ListingStatus;
  maxGuests: number;
  latitude?: number;
  longitude?: number;
  images?: { id?: string; url: string; alt?: string }[];
  amenities?: { amenity: { name: string } }[];
  createdAt?: string;
};

type SortOption = "newest" | "price-low" | "price-high" | "eco-high" | "name";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatPrice(price: number | string) {
  const value = Number(price);
  return Number.isFinite(value) && value >= 0
    ? currency.format(value)
    : "Price unavailable";
}

function statusClasses(status: ListingStatus) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function normaliseStatus(value: unknown): ListingStatus {
  if (value === "PUBLISHED" || value === "HIDDEN") return value;
  return "DRAFT";
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }
  return fallback;
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const loadListings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/host/listings", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, `Unable to load properties (${response.status}).`)
        );
      }

      const items =
        Array.isArray(data)
          ? data
          : data &&
              typeof data === "object" &&
              "listings" in data &&
              Array.isArray(data.listings)
            ? data.listings
            : data &&
                typeof data === "object" &&
                "data" in data &&
                Array.isArray(data.data)
              ? data.data
              : null;

      if (!items) {
        throw new Error("The listings API returned an unexpected response.");
      }

      const safeListings: Listing[] = items.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ""),
        title: String(item.title ?? "Untitled property"),
        description:
          typeof item.description === "string" ? item.description : "",
        propertyType:
          typeof item.propertyType === "string" ? item.propertyType : "Property",
        city: String(item.city ?? "Unknown city"),
        country: String(item.country ?? ""),
        address: typeof item.address === "string" ? item.address : "",
        pricePerNight:
          typeof item.pricePerNight === "number" ||
          typeof item.pricePerNight === "string"
            ? item.pricePerNight
            : 0,
        ecoScore: Number(item.ecoScore ?? 0),
        energyRating: String(item.energyRating ?? "N/A"),
        status: normaliseStatus(item.status),
        maxGuests: Number(item.maxGuests ?? 1),
        latitude:
          typeof item.latitude === "number" ? item.latitude : undefined,
        longitude:
          typeof item.longitude === "number" ? item.longitude : undefined,
        createdAt:
          typeof item.createdAt === "string" ? item.createdAt : undefined,
        images: Array.isArray(item.images)
          ? item.images.filter(
              (image): image is { url: string; alt?: string } =>
                !!image &&
                typeof image === "object" &&
                "url" in image &&
                typeof image.url === "string"
            )
          : [],
        amenities: Array.isArray(item.amenities)
          ? item.amenities.filter(
              (entry): entry is { amenity: { name: string } } =>
                !!entry &&
                typeof entry === "object" &&
                "amenity" in entry &&
                !!entry.amenity &&
                typeof entry.amenity === "object" &&
                "name" in entry.amenity &&
                typeof entry.amenity.name === "string"
            )
          : [],
      }));

      if (safeListings.some((listing) => !listing.id)) {
        throw new Error("A property was returned without an ID.");
      }

      setListings(safeListings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load your properties."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);
  
  const [busyListingId, setBusyListingId] = useState<string | null>(null);

  const changeListingStatus = async (
    listing: Listing,
    status: ListingStatus
  ) => {
    const action =
      status === "PUBLISHED"
        ? "publish"
        : status === "HIDDEN"
          ? "unpublish"
          : "save as a draft";

    setBusyListingId(listing.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/host/listings/${encodeURIComponent(listing.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, `Unable to ${action} this property.`)
        );
      }

      setListings((current) =>
        current.map((item) =>
          item.id === listing.id ? { ...item, status } : item
        )
      );

      setNotice(
        status === "PUBLISHED"
          ? "Property published successfully."
          : status === "HIDDEN"
            ? "Property unpublished successfully."
            : "Property saved as a draft."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Unable to ${action} this property.`
      );
    } finally {
      setBusyListingId(null);
    }
  };

  const deleteListing = async (listing: Listing) => {
    const confirmed = window.confirm(
      `Delete "${listing.title}" permanently? This action cannot be undone. Listings with booking history cannot be deleted.`
    );

    if (!confirmed) return;

    setBusyListingId(listing.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/host/listings/${encodeURIComponent(listing.id)}`,
        { method: "DELETE" }
      );

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to delete this property.")
        );
      }

      setListings((current) =>
        current.filter((item) => item.id !== listing.id)
      );

      setNotice(`"${listing.title}" was deleted successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete this property."
      );
    } finally {
      setBusyListingId(null);
    }
  };


  const stats = useMemo(() => {
    const total = listings.length;
    const published = listings.filter((item) => item.status === "PUBLISHED").length;
    const drafts = listings.filter((item) => item.status === "DRAFT").length;
    const hidden = listings.filter((item) => item.status === "HIDDEN").length;

    const averageEco = total
      ? Math.round(
          listings.reduce((sum, item) => sum + item.ecoScore, 0) / total
        )
      : 0;

    return { total, published, drafts, hidden, averageEco };
  }, [listings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = listings.filter((listing) => {
      const matchesSearch =
        !query ||
        [
          listing.title,
          listing.city,
          listing.country,
          listing.address ?? "",
          listing.propertyType ?? "",
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "ALL" || listing.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number(a.pricePerNight) - Number(b.pricePerNight);
        case "price-high":
          return Number(b.pricePerNight) - Number(a.pricePerNight);
        case "eco-high":
          return b.ecoScore - a.ecoScore;
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
      }
    });
  }, [listings, search, statusFilter, sortBy]);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-slate-900">
      <header className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-xl text-white">
              🌿
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                GreenBnB
              </span>
              <span className="block text-xs text-slate-500">
                Sustainable stays
              </span>
            </span>
          </Link>

          <Link
            href="/host/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-emerald-950 px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-700/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-lime-400/10 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                Host workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                My Listings
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/80 sm:text-base">
                Manage your stays, maintain your property information, and help
                travellers discover more sustainable places to stay.
              </p>
            </div>

            <Link
              href="/host/listings/new"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3.5 font-bold text-emerald-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              <span className="text-xl">+</span>
              Add New Property
            </Link>
          </div>
        </section>

        {notice && (
          <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {notice}
          </div>
        )}

        {!loading && !error && (
          <section
            aria-label="Property statistics"
            className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5"
          >
            {[
              {
                label: "Total properties",
                value: stats.total,
                icon: "⌂",
                tone: "text-slate-900",
              },
              {
                label: "Published",
                value: stats.published,
                icon: "✓",
                tone: "text-emerald-700",
              },
              {
                label: "Drafts",
                value: stats.drafts,
                icon: "✎",
                tone: "text-amber-700",
              },
              {
                label: "Hidden",
                value: stats.hidden,
                icon: "◉",
                tone: "text-slate-600",
              },
              {
                label: "Average eco score",
                value: `${stats.averageEco}/100`,
                icon: "♧",
                tone: "text-emerald-700",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    {stat.label}
                  </p>
                  <span className={`text-xl ${stat.tone}`} aria-hidden="true">
                    {stat.icon}
                  </span>
                </div>
                <p className={`mt-3 text-2xl font-bold ${stat.tone} sm:text-3xl`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label htmlFor="listing-search" className="sr-only">
                Search properties
              </label>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                ⌕
              </span>
              <input
                id="listing-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by property, city, or address..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div>
                <label htmlFor="status-filter" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Drafts</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>

              <div>
                <label htmlFor="sort-listings" className="sr-only">
                  Sort properties
                </label>
                <select
                  id="sort-listings"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className={inputClass}
                >
                  <option value="newest">Newest first</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="eco-high">Highest eco score</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadListings(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">{refreshing ? "…" : "↻"}</span>
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <p>
              Showing {filteredListings.length} of {listings.length} properties
            </p>
            {(search || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
                className="font-semibold text-emerald-800 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        <section className="mt-6" aria-label="Your properties">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="h-52 bg-slate-200" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="h-4 w-1/2 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center sm:p-12">
              <div className="text-4xl" aria-hidden="true">⚠️</div>
              <h2 className="mt-4 text-xl font-bold">Properties could not load</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadListings()}
                className="mt-5 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"
              >
                Try Again
              </button>
              <p className="mt-4 text-xs text-slate-500">
                If this is an authorization error, sign in with an account
                that has the HOST or ADMIN role.
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center sm:py-20">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                {listings.length ? "⌕" : "🌿"}
              </div>
              <h2 className="mt-5 text-xl font-bold">
                {listings.length ? "No matching properties" : "Your hosting journey starts here"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {listings.length
                  ? "Try another search term or change your filters."
                  : "Create your first property listing and share your sustainable stay with travellers."}
              </p>
              {listings.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-5 rounded-xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  href="/host/listings/new"
                  className="mt-5 inline-flex rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900"
                >
                  Create Your First Property
                </Link>
              )}
            </div>
          ) : (
            <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => {
                const image = listing.images?.[0];

                return (
                  <article
                    key={listing.id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5"
                  >
                    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-100 via-green-50 to-lime-100">
                      {image?.url ? (
                        <img
                          src={image.url}
                          alt={image.alt || listing.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-emerald-800">
                          <span className="text-6xl" aria-hidden="true">🌲</span>
                          <span className="mt-2 text-xs font-semibold uppercase tracking-widest">
                            Sustainable stay
                          </span>
                        </div>
                      )}

                      <span
                        className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ring-1 backdrop-blur ${statusClasses(listing.status)}`}
                      >
                        {listing.status === "PUBLISHED"
                          ? "● Published"
                          : listing.status === "DRAFT"
                            ? "● Draft"
                            : "● Hidden"}
                      </span>

                      <span className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm">
                        ♧ Eco {listing.ecoScore}/100
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                            {listing.propertyType || "Property"}
                          </p>
                          <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900">
                            {listing.title}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            <span aria-hidden="true">⌖ </span>
                            {listing.city}{listing.country ? `, ${listing.country}` : ""}
                          </p>
                        </div>
                      </div>

                      {listing.description && (
                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                          {listing.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">Price per night</p>
                          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-900">
                            {formatPrice(listing.pricePerNight)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Capacity</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            ♙ {listing.maxGuests} guests
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Energy rating</p>
                          <p className="mt-1 font-bold text-slate-800">
                            {listing.energyRating}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Created</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatDate(listing.createdAt)}
                          </p>
                        </div>
                      </div>

                      {listing.amenities && listing.amenities.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {listing.amenities.slice(0, 3).map((entry) => (
                            <span
                              key={entry.amenity.name}
                              className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"
                            >
                              {entry.amenity.name}
                            </span>
                          ))}
                          {listing.amenities.length > 3 && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                              +{listing.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
                        <Link
                          href={`/stays/${encodeURIComponent(listing.id)}`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
                        >
                          View Stay ↗
                        </Link>

                        <Link
                          href={`/host/listings/${encodeURIComponent(listing.id)}/edit`}
                          className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-3 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                        >
                          Edit Property
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs leading-6 text-slate-500">
          <p className="font-semibold text-emerald-900">GreenBnB · Stay greener, travel better.</p>
          <p className="mt-1">
            Keep your property details accurate and your sustainability
            information up to date.
          </p>
        </footer>
      </div>
    </main>
  );
}
