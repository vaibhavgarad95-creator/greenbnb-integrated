
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  guests: number;
  totalPrice: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  listing: {
    title: string;
    city: string;
    country: string;
  };
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [notice, setNotice] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bookings/my", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load bookings.");
      }

      setBookings(data.bookings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function cancelBooking(bookingId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this pending booking?"
    );

    if (!confirmed) return;

    setCancellingId(bookingId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel booking.");
      }

      setNotice("Booking cancelled successfully.");
      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setCancellingId("");
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  const formatPrice = (price: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));

  const statusStyle: Record<Booking["status"], string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-200 text-gray-700",
  };

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-green-800 hover:underline"
        >
          &larr; Back to GreenBnB
        </Link>

        <header className="mb-8 mt-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            Your GreenBnB trips
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-2 text-gray-600">
            View your reservations and booking status in one place.
          </p>
        </header>

        {notice && (
          <p role="status" className="mb-5 rounded-xl bg-green-100 p-4 text-green-800">
            {notice}
          </p>
        )}

        {error && (
          <p role="alert" className="mb-5 rounded-xl bg-red-100 p-4 text-red-800">
            {error}
          </p>
        )}

        {loading && (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            Loading your bookings...
          </p>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">🌿</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              No bookings yet
            </h2>
            <p className="mt-2 text-gray-600">
              Your next nature escape could start here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900"
            >
              Explore stays
            </Link>
          </div>
        )}

        {!loading &&
          bookings.map((booking) => (
            <article
              key={booking.id}
              className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {booking.listing.title}
                  </h2>
                  <p className="mt-1 text-gray-600">
                    📍 {booking.listing.city}, {booking.listing.country}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusStyle[booking.status]}`}
                >
                  {booking.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">Check-in</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatDate(booking.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatDate(booking.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {booking.guests}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-gray-500">Total booking price</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatPrice(booking.totalPrice)}
                  </p>
                </div>
                <p className="break-all text-xs text-gray-500">
                  Booking reference: {booking.id}
                </p>
              </div>

              {booking.status === "PENDING" && (
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => void cancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancellingId === booking.id
                      ? "Cancelling..."
                      : "Cancel booking"}
                  </button>
                </div>
              )}
            </article>
          ))}
      </div>
    </main>
  );
}
