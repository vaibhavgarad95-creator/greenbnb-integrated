-- Applied AFTER the generated init migration (timestamp sorts last).
-- PostgreSQL is the source of truth for data integrity.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Listing"
  ADD CONSTRAINT listing_price_positive CHECK ("pricePerNight" > 0),
  ADD CONSTRAINT listing_eco_range CHECK ("ecoScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT listing_lat_range CHECK ("latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT listing_lng_range CHECK ("longitude" BETWEEN -180 AND 180),
  ADD CONSTRAINT listing_guests_positive CHECK ("maxGuests" > 0);

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_dates_valid CHECK ("endDate" > "startDate"),
  ADD CONSTRAINT booking_total_positive CHECK ("totalPrice" > 0),
  ADD CONSTRAINT booking_guests_positive CHECK ("guests" > 0);

-- Check-in inclusive, check-out exclusive: '[)'. Only PENDING/CONFIRMED block dates.
ALTER TABLE "Booking"
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    "listingId" WITH =,
    daterange("startDate", "endDate", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING', 'CONFIRMED'));

ALTER TABLE "Review"
  ADD CONSTRAINT review_rating_range CHECK ("rating" BETWEEN 1 AND 5);
