
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to view your bookings." },
        { status: 401 }
      );
    }

    // Verify that the logged-in account is actually a guest.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        suspendedAt: true,
      },
    });

    if (!user || user.role !== "GUEST" || user.suspendedAt) {
      return NextResponse.json(
        { error: "Only active guest accounts can view booking history." },
        { status: 403 }
      );
    }

    // Return bookings belonging only to this guest.
    const bookings = await prisma.booking.findMany({
      where: {
        guestId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        guests: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        review: { select: { id: true } },
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
          },
        },
      },
    });

    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        ...booking,
        totalPrice: booking.totalPrice.toString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);

    return NextResponse.json(
      { error: "Unable to load bookings right now." },
      { status: 500 }
    );
  }
}
