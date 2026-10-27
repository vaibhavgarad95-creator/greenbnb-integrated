
import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export async function PATCH(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const guestId = await getSessionUserId();

    if (!guestId) {
      return NextResponse.json(
        { error: "Please log in to cancel a booking." },
        { status: 401 }
      );
    }

    const { bookingId } = await params;

    if (!bookingId?.trim()) {
      return NextResponse.json(
        { error: "A valid booking ID is required." },
        { status: 400 }
      );
    }

    // Update only a booking owned by this guest that is still pending.
    const result = await prisma.booking.updateMany({
      where: {
        id: bookingId,
        guestId,
        status: BookingStatus.PENDING,
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    if (result.count === 0) {
      // Do not reveal bookings belonging to other users.
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          guestId,
        },
        select: {
          status: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: `This booking cannot be cancelled because its status is ${booking.status}.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Booking cancelled successfully.",
      bookingId,
      status: BookingStatus.CANCELLED,
    });
  } catch (error) {
    console.error("Booking cancellation error:", error);

    return NextResponse.json(
      { error: "Unable to cancel the booking right now." },
      { status: 500 }
    );
  }
}
