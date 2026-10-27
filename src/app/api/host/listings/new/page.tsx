
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewListingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    propertyType: "Cabin",
    pricePerNight: "3200",
    maxGuests: "2",
    address: "",
    city: "",
    country: "India",
    latitude: "18.754",
    longitude: "73.406",
    ecoScore: "80",
    energyRating: "A",
    houseRules: "",
    amenities: "Wi-Fi, Free parking, Nature views",
    images: "",
    status: "PUBLISHED",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/host/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          propertyType: form.propertyType,
          pricePerNight: Number(form.pricePerNight),
          maxGuests: Number(form.maxGuests),
          address: form.address.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          ecoScore: Number(form.ecoScore),
          energyRating: form.energyRating,
          houseRules: form.houseRules.trim(),
          amenities: form.amenities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          images: form.images
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          status: form.status,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not create listing."
        );
      }

      setSuccess("Your property was created successfully!");

      setTimeout(() => {
        router.push("/host/dashboard");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100";

  const labelClass =
    "block text-sm font-medium text-gray-700";

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/host/dashboard")}
          className="mb-6 text-sm font-medium text-green-800 hover:underline"
        >
          ← Back to Host Dashboard
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            GreenBnB Host
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Add a new property
          </h1>
          <p className="mt-2 text-gray-600">
            Share your sustainable stay with travellers.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              Basic information
            </h2>

            <div>
              <label className={labelClass}>
                Property name *
              </label>
              <input
                className={inputClass}
                required
                minLength={3}
                maxLength={100}
                value={form.title}
                onChange={(e) =>
                  updateField("title", e.target.value)
                }
                placeholder="e.g. Forest Escape Cabin"
              />
            </div>

            <div>
              <label className={labelClass}>
                Description *
              </label>
              <textarea
                className={inputClass}
                required
                minLength={10}
                rows={4}
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                placeholder="Describe your property and what makes it special..."
              />
            </div>

            <div>
              <label className={labelClass}>
                Property type *
              </label>
              <select
                className={inputClass}
                value={form.propertyType}
                onChange={(e) =>
                  updateField("propertyType", e.target.value)
                }
              >
                <option>Cabin</option>
                <option>Villa</option>
                <option>Apartment</option>
                <option>Cottage</option>
                <option>Farmhouse</option>
                <option>Treehouse</option>
                <option>Eco Lodge</option>
                <option>Homestay</option>
              </select>
            </div>
          </section>

          <hr className="border-gray-200" />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              Pricing and capacity
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Price per night (₹) *
                </label>
                <input
                  className={inputClass}
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={form.pricePerNight}
                  onChange={(e) =>
                    updateField("pricePerNight", e.target.value)
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Maximum guests *
                </label>
                <input
                  className={inputClass}
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={form.maxGuests}
                  onChange={(e) =>
                    updateField("maxGuests", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              Location
            </h2>

            <div>
              <label className={labelClass}>
                Street address *
              </label>
              <input
                className={inputClass}
                required
                value={form.address}
                onChange={(e) =>
                  updateField("address", e.target.value)
                }
                placeholder="Property address"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>City *</label>
                <input
                  className={inputClass}
                  required
                  value={form.city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                  placeholder="e.g. Lonavala"
                />
              </div>

              <div>
                <label className={labelClass}>Country *</label>
                <input
                  className={inputClass}
                  required
                  value={form.country}
                  onChange={(e) =>
                    updateField("country", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Latitude *
                </label>
                <input
                  className={inputClass}
                  type="number"
                  required
                  min="-90"
                  max="90"
                  step="any"
                  value={form.latitude}
                  onChange={(e) =>
                    updateField("latitude", e.target.value)
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Longitude *
                </label>
                <input
                  className={inputClass}
                  type="number"
                  required
                  min="-180"
                  max="180"
                  step="any"
                  value={form.longitude}
                  onChange={(e) =>
                    updateField("longitude", e.target.value)
                  }
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Enter the actual coordinates of your property.
              The default coordinates are only sample values.
            </p>
          </section>

          <hr className="border-gray-200" />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              Sustainability
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Eco score (0–100) *
                </label>
                <input
                  className={inputClass}
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={form.ecoScore}
                  onChange={(e) =>
                    updateField("ecoScore", e.target.value)
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Energy rating *
                </label>
                <select
                  className={inputClass}
                  value={form.energyRating}
                  onChange={(e) =>
                    updateField("energyRating", e.target.value)
                  }
                >
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                  <option>D</option>
                  <option>E</option>
                  <option>F</option>
                  <option>G</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Use a score and rating that you can reasonably
              support with the property's sustainability features.
            </p>

            <div>
              <label className={labelClass}>
                Amenities
              </label>
              <input
                className={inputClass}
                value={form.amenities}
                onChange={(e) =>
                  updateField("amenities", e.target.value)
                }
                placeholder="Wi-Fi, Free parking, Garden"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate amenities with commas.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                House rules
              </label>
              <textarea
                className={inputClass}
                rows={3}
                value={form.houseRules}
                onChange={(e) =>
                  updateField("houseRules", e.target.value)
                }
                placeholder="Check-in times, smoking policy, quiet hours..."
              />
            </div>
          </section>

          <hr className="border-gray-200" />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              Property images
            </h2>

            <div>
              <label className={labelClass}>
                Image URLs
              </label>
              <textarea
                className={inputClass}
                rows={3}
                value={form.images}
                onChange={(e) =>
                  updateField("images", e.target.value)
                }
                placeholder={"https://example.com/property.jpg\nhttps://example.com/room.jpg"}
              />
              <p className="mt-1 text-xs text-gray-500">
                Add one HTTP or HTTPS image URL per line.
                Direct file uploads are not included yet.
              </p>
            </div>
          </section>

          <section>
            <label className={labelClass}>
              Listing status
            </label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value)
              }
            >
              <option value="PUBLISHED">
                Published — make it available
              </option>
              <option value="DRAFT">
                Draft — save for later
              </option>
            </select>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving property..." : "Create Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}
