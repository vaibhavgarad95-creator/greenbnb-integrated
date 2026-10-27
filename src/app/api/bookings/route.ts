
import { NextResponse } from "next/server";
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // Identify the guest from the verified session cookie.
    const guestId = await getSessionUserId();

    if (!guestId) {
      return NextResponse.json(
        { error: "Please log in before booking a stay." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const listingId =
      typeof body.listingId === "string" ? body.listingId.trim() : "";
    const checkIn =
      typeof body.checkIn === "string" ? body.checkIn : "";
    const checkOut =
      typeof body.checkOut === "string" ? body.checkOut : "";
    const guests = Number(body.guests);

    if (!listingId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Please provide a listing and both dates." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(guests) || guests < 1) {
      return NextResponse.json(
        { error: "Guests must be a positive whole number." },
        { status: 400 }
      );
    }

    const isValidDate = (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
      return NextResponse.json(
        { error: "Please provide valid check-in and check-out dates." },
        { status: 400 }
      );
    }

    const startDate = new Date(`${checkIn}T00:00:00.000Z`);
    const endDate = new Date(`${checkOut}T00:00:00.000Z`);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "Check-out must be after check-in." },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (startDate < today) {
      return NextResponse.json(
        { error: "Check-in cannot be in the past." },
        { status: 400 }
      );
    }

    const [guest, listing] = await Promise.all([
      prisma.user.findUnique({
        where: { id: guestId },
        select: { id: true, role: true, suspendedAt: true },
      }),
      prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          pricePerNight: true,
          maxGuests: true,
          status: true,
        },
      }),
    ]);

    if (!guest || guest.suspendedAt) {
      return NextResponse.json(
        { error: "Your account cannot make bookings." },
        { status: 403 }
      );
    }

    if (guest.role !== "GUEST") {
      return NextResponse.json(
        { error: "Only guest accounts can book a stay." },
        { status: 403 }
      );
    }

    if (!listing || listing.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This stay is unavailable." },
        { status: 404 }
      );
    }

    if (guests > listing.maxGuests) {
      return NextResponse.json(
        {
          error: `This stay allows a maximum of ${listing.maxGuests} guests.`,
        },
        { status: 400 }
      );
    }

    const nights = Math.round(
      (endDate.getTime() - startDate.getTime()) / 86_400_000
    );

    const totalPrice = new Prisma.Decimal(listing.pricePerNight).mul(nights);

    // PostgreSQL's existing exclusion constraint protects against
    // overlapping PENDING or CONFIRMED reservations.
    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        startDate,
        endDate,
        guests,
        totalPrice,
        status: BookingStatus.PENDING,
      },
      select: {
        id: true,
        listingId: true,
        startDate: true,
        endDate: true,
        guests: true,
        totalPrice: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message:
          "Booking request saved successfully. Payment has not been processed.",
        booking: {
          ...booking,
          totalPrice: booking.totalPrice.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2004"
    ) {
      return NextResponse.json(
        { error: "These dates are unavailable. Please choose different dates." },
        { status: 409 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "The selected stay or account no longer exists." },
        { status: 400 }
      );
    }

    console.error("Booking creation error:", error);

    return NextResponse.json(
      { error: "Unable to create the booking right now." },
      { status: 500 }
    );
  }
}
