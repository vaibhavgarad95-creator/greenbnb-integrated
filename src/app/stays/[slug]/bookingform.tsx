
"use client";

import { useState } from "react";

type BookingFormProps = {
  listingId: string;
  pricePerNight: number;
  stayName: string;
  maxGuests: number;
};

export default function BookingForm({
  listingId,
  pricePerNight,
  stayName,
  maxGuests,
}: BookingFormProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const nights =
    checkIn && checkOut
      ? Math.round(
          (new Date(`${checkOut}T00:00:00`).getTime() -
            new Date(`${checkIn}T00:00:00`).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const validDates = nights > 0 && checkIn >= minDate;
  const total = validDates ? nights * pricePerNight : 0;

  async function handleBooking() {
    setMessage("");
    setSuccess(false);

    if (!validDates) {
      setMessage("Please select valid future check-in and check-out dates.");
      return;
    }

    if (guests < 1 || guests > maxGuests) {
      setMessage(`This property allows up to ${maxGuests} guests.`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setMessage("Please log in to book this stay.");
        } else {
          setMessage(data.error || "Unable to create your booking. Please try again.");
        }
        return;
      }

      setSuccess(true);
      setMessage(
        `Booking request saved! Reference: ${data.booking.id}. Your request is pending confirmation. No payment has been taken.`
      );
    } catch {
      setMessage("Unable to contact the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid #dce5dc",
        borderRadius: 16,
        padding: 24,
        background: "#ffffff",
        color: "#20352a",
        boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
      }}
    >
      <p style={{ color: "#53745c", margin: "0 0 6px" }}>
        Price per night
      </p>

      <h2 style={{ fontSize: 28, margin: "0 0 20px" }}>
        ₹{pricePerNight.toLocaleString("en-IN")}
        <span style={{ fontSize: 14, fontWeight: 400 }}> / night</span>
      </h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleBooking();
        }}
      >
        <label
          htmlFor="checkin"
          style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
        >
          Check-in
        </label>
        <input
          id="checkin"
          type="date"
          min={minDate}
          required
          value={checkIn}
          onChange={(event) => {
            setCheckIn(event.target.value);
            setMessage("");
            setSuccess(false);

            if (checkOut && event.target.value >= checkOut) {
              setCheckOut("");
            }
          }}
          style={inputStyle}
        />

        <label
          htmlFor="checkout"
          style={{ display: "block", margin: "16px 0 6px", fontWeight: 600 }}
        >
          Check-out
        </label>
        <input
          id="checkout"
          type="date"
          min={checkIn || minDate}
          required
          value={checkOut}
          onChange={(event) => {
            setCheckOut(event.target.value);
            setMessage("");
            setSuccess(false);
          }}
          style={inputStyle}
        />

        <label
          htmlFor="guests"
          style={{ display: "block", margin: "16px 0 6px", fontWeight: 600 }}
        >
          Guests (maximum {maxGuests})
        </label>
        <select
          id="guests"
          value={guests}
          onChange={(event) => {
            setGuests(Number(event.target.value));
            setMessage("");
            setSuccess(false);
          }}
          style={inputStyle}
        >
          {Array.from({ length: maxGuests }, (_, index) => index + 1).map(
            (number) => (
              <option key={number} value={number}>
                {number} {number === 1 ? "guest" : "guests"}
              </option>
            )
          )}
        </select>

        {validDates && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              background: "#f0f6ee",
              borderRadius: 10,
            }}
          >
            <p style={{ margin: "0 0 8px" }}>
              ₹{pricePerNight.toLocaleString("en-IN")} × {nights} nights
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              Estimated total: ₹{total.toLocaleString("en-IN")}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64746a" }}>
              Final pricing is calculated by the server.
            </p>
          </div>
        )}

        {message && (
          <p
            role="status"
            aria-live="polite"
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: success ? "#edf7ed" : "#fff0ed",
              color: success ? "#246b45" : "#a12b1b",
              overflowWrap: "anywhere",
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || success}
          style={{
            ...buttonStyle,
            opacity: loading || success ? 0.65 : 1,
            cursor: loading || success ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Saving booking..."
            : success
              ? "Booking request saved"
              : "Continue with booking"}
        </button>

        <p style={{ fontSize: 12, color: "#64746a", textAlign: "center" }}>
          Booking requests require login and host confirmation. No payment is
          taken.
        </p>
      </form>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  border: "1px solid #cbd8cc",
  borderRadius: 8,
  background: "#ffffff",
  color: "#20352a",
  fontSize: 15,
};

const buttonStyle = {
  width: "100%",
  marginTop: 20,
  padding: "13px",
  border: "none",
  borderRadius: 9,
  background: "#246b45",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 600,
};
