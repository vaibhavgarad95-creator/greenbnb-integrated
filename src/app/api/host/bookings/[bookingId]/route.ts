
import { NextResponse } from "next/server";
import { BookingStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to manage bookings." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        suspendedAt: true,
      },
    });

    if (!user || user.suspendedAt) {
      return NextResponse.json(
        { error: "Your account cannot manage bookings." },
        { status: 403 }
      );
    }

    if (user.role !== Role.HOST && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Host access is required." },
        { status: 403 }
      );
    }

    const { bookingId } = await params;

    if (!bookingId?.trim()) {
      return NextResponse.json(
        { error: "A valid booking ID is required." },
        { status: 400 }
      );
    }

    let body: { status?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Please provide a valid JSON request." },
        { status: 400 }
      );
    }

    if (
      body.status !== BookingStatus.CONFIRMED &&
      body.status !== BookingStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: "Status must be CONFIRMED or REJECTED." },
        { status: 400 }
      );
    }

    const result = await prisma.booking.updateMany({
      where: {
        id: bookingId,
        status: BookingStatus.PENDING,
        ...(user.role === Role.ADMIN
          ? {}
          : { listing: { is: { hostId: user.id } } }),
      },
      data: {
        status: body.status,
      },
    });

    if (result.count === 0) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          ...(user.role === Role.ADMIN
            ? {}
            : { listing: { is: { hostId: user.id } } }),
        },
        select: { status: true },
      });

      if (!booking) {
        return NextResponse.json(
          {
            error: "Booking not found or you cannot manage it.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: `This booking is no longer pending. Current status: ${booking.status}.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message:
        body.status === BookingStatus.CONFIRMED
          ? "Booking confirmed successfully."
          : "Booking rejected successfully.",
      bookingId,
      status: body.status,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2004"
    ) {
      return NextResponse.json(
        {
          error:
            "These dates are no longer available. Refresh the dashboard and review the request.",
        },
        { status: 409 }
      );
    }

    console.error("Host booking update error:", error);

    return NextResponse.json(
      { error: "Unable to update this booking right now." },
      { status: 500 }
    );
  }
}
