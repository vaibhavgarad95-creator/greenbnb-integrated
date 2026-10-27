
import { NextResponse } from "next/server";
import { BookingStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to access the host dashboard." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (user.role !== Role.HOST && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Host access is required." },
        { status: 403 }
      );
    }

    const listings = await prisma.listing.findMany({
      where: user.role === Role.ADMIN ? {} : { hostId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        country: true,
        pricePerNight: true,
        status: true,
        maxGuests: true,
        bookings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            guests: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            guest: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const bookingRequests = listings.flatMap((listing) =>
      listing.bookings.map((booking) => ({
        ...booking,
        listingId: listing.id,
        listingTitle: listing.title,
        listingCity: listing.city,
      }))
    );

    return NextResponse.json({
      host: {
        name: user.name,
        role: user.role,
      },
      summary: {
        totalListings: listings.length,
        pendingRequests: bookingRequests.filter(
          (booking) => booking.status === BookingStatus.PENDING
        ).length,
        confirmedBookings: bookingRequests.filter(
          (booking) => booking.status === BookingStatus.CONFIRMED
        ).length,
      },
      listings: listings.map(({ bookings, ...listing }) => listing),
      bookingRequests,
    });
  } catch (error) {
    console.error("Host dashboard error:", error);

    return NextResponse.json(
      { error: "Unable to load the host dashboard." },
      { status: 500 }
    );
  }
}
