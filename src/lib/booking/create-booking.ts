import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nightsBetween, parseDateOnly, todayUtc } from "./dates";
import { calculateTotal } from "./pricing";

export const bookingInput = z.object({
  listingId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  guests: z.number().int().min(1).default(1),
});

export class BookingError extends Error {
  constructor(public status: 400 | 403 | 404 | 409, public code: string, message: string) {
    super(message);
  }
}

const OVERLAP_CONSTRAINT = "bookings_no_overlap";

function isOverlapViolation(e: unknown): boolean {
  // Postgres exclusion_violation = SQLSTATE 23P01. Prisma surfaces it differently by
  // version, so match on code/message; covered by the integration test.
  const text = e instanceof Error ? e.message : String(e);
  const meta = JSON.stringify((e as { meta?: unknown })?.meta ?? {});
  return text.includes(OVERLAP_CONSTRAINT) || text.includes("23P01") || meta.includes("23P01");
}

/**
 * guestId comes from the authenticated session, never the request body.
 * Overlap protection is the DB exclusion constraint; the pre-check only gives
 * friendlier errors and is NOT relied on for correctness.
 */
export async function createBooking(args: {
  guestId: string;
  input: unknown;
  idempotencyKey?: string;
  maxNights: number;
  now?: Date;
}) {
  const input = bookingInput.parse(args.input);
  const start = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);
  if (!start || !end) throw new BookingError(400, "INVALID_DATE", "Dates must be YYYY-MM-DD.");
  if (start < todayUtc(args.now)) throw new BookingError(400, "PAST_DATE", "Check-in cannot be in the past.");
  if (end <= start) throw new BookingError(400, "INVALID_RANGE", "Check-out must be after check-in.");
  const nights = nightsBetween(start, end);
  if (nights > args.maxNights) throw new BookingError(400, "STAY_TOO_LONG", `Maximum stay is ${args.maxNights} nights.`);

  const listing = await prisma.listing.findFirst({ where: { id: input.listingId, status: "PUBLISHED" } });
  if (!listing) throw new BookingError(404, "LISTING_NOT_FOUND", "Listing not found.");
  if (listing.hostId === args.guestId) throw new BookingError(403, "OWN_LISTING", "You cannot book your own listing.");
  if (input.guests > listing.maxGuests) throw new BookingError(400, "TOO_MANY_GUESTS", "Too many guests for this listing.");

  if (args.idempotencyKey) {
    const prior = await prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId: args.guestId, key: args.idempotencyKey } },
    });
    if (prior?.bookingId) {
      const existing = await prisma.booking.findUnique({ where: { id: prior.bookingId } });
      if (existing) return { booking: existing, replayed: true };
    }
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          listingId: listing.id,
          guestId: args.guestId,
          startDate: start,
          endDate: end,
          guests: input.guests,
          totalPrice: calculateTotal(listing.pricePerNight, nights),
          status: "PENDING",
        },
      });
      if (args.idempotencyKey) {
        await tx.idempotencyKey.create({ data: { userId: args.guestId, key: args.idempotencyKey, bookingId: b.id } });
      }
      return b;
    });
    return { booking, replayed: false };
  } catch (e) {
    if (isOverlapViolation(e)) throw new BookingError(409, "DATES_UNAVAILABLE", "Those dates are no longer available.");
    // Concurrent retry with same idempotency key: unique violation on (userId,key)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && args.idempotencyKey) {
      const prior = await prisma.idempotencyKey.findUnique({
        where: { userId_key: { userId: args.guestId, key: args.idempotencyKey } },
      });
      const existing = prior?.bookingId ? await prisma.booking.findUnique({ where: { id: prior.bookingId } }) : null;
      if (existing) return { booking: existing, replayed: true };
    }
    throw e;
  }
}
