
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  pricePerNight: number | string;
  maxGuests: number;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  ecoScore: number;
  energyRating: string;
  houseRules: string;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN";
  images: { url: string }[];
  amenities: { amenity: { name: string } }[];
};

export default function EditListingPage() {
  const params = useParams<{ listingId: string }>();
  const listingId = params.listingId;
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadListing() {
      try {
        const response = await fetch(
          `/api/host/listings/${encodeURIComponent(listingId)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load listing.");
        }

        if (active) {
          setListing(data.listing);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load listing."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (listingId) loadListing();

    return () => {
      active = false;
    };
  }, [listingId]);

  function updateField(name: keyof Listing, value: string | number) {
    setListing((current) =>
      current ? { ...current, [name]: value } : current
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listing) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);

    const amenities = String(form.get("amenities") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const images = String(form.get("images") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      title: listing.title,
      description: listing.description,
      propertyType: listing.propertyType,
      pricePerNight: Number(listing.pricePerNight),
      maxGuests: Number(listing.maxGuests),
      address: listing.address,
      city: listing.city,
      country: listing.country,
      latitude: Number(listing.latitude),
      longitude: Number(listing.longitude),
      ecoScore: Number(listing.ecoScore),
      energyRating: listing.energyRating,
      houseRules: listing.houseRules,
      status: form.get("status"),
      amenities,
      images,
    };

    try {
      const response = await fetch(
        `/api/host/listings/${encodeURIComponent(listingId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save changes.");
      }

      setSuccess("Listing updated successfully.");

      window.setTimeout(() => {
        router.push("/host/listings");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl p-8">Loading property details...</main>;
  }

  if (!listing) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-red-600">{error || "Listing not found."}</p>
        <Link className="mt-4 inline-block underline" href="/host/listings">
          Back to My Listings
        </Link>
      </main>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/host/listings" className="text-sm text-green-700 hover:underline">
        ← Back to My Listings
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-gray-900">Edit Property</h1>
      <p className="mt-2 text-gray-600">
        Update your property details and save your changes.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-700">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border p-5 sm:p-7">
        <div>
          <label className={labelClass}>Property name</label>
          <input
            className={inputClass}
            value={listing.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
            maxLength={120}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            rows={4}
            value={listing.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
            maxLength={5000}
          />
        </div>

        <div>
          <label className={labelClass}>Property type</label>
          <input
            className={inputClass}
            value={listing.propertyType}
            onChange={(e) => updateField("propertyType", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Price per night (₹)</label>
            <input
              className={inputClass}
              type="number"
              min="1"
              max="10000000"
              step="0.01"
              value={listing.pricePerNight}
              onChange={(e) => updateField("pricePerNight", e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Maximum guests</label>
            <input
              className={inputClass}
              type="number"
              min="1"
              max="50"
              value={listing.maxGuests}
              onChange={(e) => updateField("maxGuests", Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Street address</label>
          <input
            className={inputClass}
            value={listing.address}
            onChange={(e) => updateField("address", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>City</label>
            <input
              className={inputClass}
              value={listing.city}
              onChange={(e) => updateField("city", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              className={inputClass}
              value={listing.country}
              onChange={(e) => updateField("country", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              className={inputClass}
              type="number"
              step="any"
              min="-90"
              max="90"
              value={listing.latitude}
              onChange={(e) => updateField("latitude", Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              className={inputClass}
              type="number"
              step="any"
              min="-180"
              max="180"
              value={listing.longitude}
              onChange={(e) => updateField("longitude", Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Eco score (0–100)</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              max="100"
              value={listing.ecoScore}
              onChange={(e) => updateField("ecoScore", Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Energy rating</label>
            <select
              className={inputClass}
              value={listing.energyRating}
              onChange={(e) => updateField("energyRating", e.target.value)}
            >
              {["A", "B", "C", "D", "E", "F"].map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>House rules</label>
          <textarea
            className={inputClass}
            rows={3}
            value={listing.houseRules}
            onChange={(e) => updateField("houseRules", e.target.value)}
            maxLength={3000}
          />
        </div>

        <div>
          <label className={labelClass}>Amenities (separate with commas)</label>
          <input
            className={inputClass}
            name="amenities"
            defaultValue={listing.amenities.map((a) => a.amenity.name).join(", ")}
          />
        </div>

        <div>
          <label className={labelClass}>Image URLs (one per line)</label>
          <textarea
            className={inputClass}
            name="images"
            rows={4}
            defaultValue={listing.images.map((image) => image.url).join("\n")}
          />
          <p className="mt-1 text-xs text-gray-500">
            Use full HTTP or HTTPS image URLs. Saving replaces the existing image list.
          </p>
        </div>

        <div>
          <label className={labelClass}>Listing status</label>
          <select className={inputClass} name="status" defaultValue={listing.status}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
        >
          {saving ? "Saving changes..." : "Save Changes"}
        </button>
      </form>
    </main>
  );
}
