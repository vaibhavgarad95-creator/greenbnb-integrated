
import { NextRequest, NextResponse } from "next/server";
import { ListingStatus, Prisma } from "@prisma/client";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

const VALID_STATUSES = ["DRAFT", "PUBLISHED", "HIDDEN"] as const;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isValidStatus(value: unknown): value is ListingStatus {
  return (
    typeof value === "string" &&
    VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number])
  );
}

async function getAuthorizedListing(listingId: string) {
  const userId = await getSessionUserId();

  if (!userId) {
    return { error: errorResponse("Please sign in first.", 401) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, suspendedAt: true },
  });

  if (!user) {
    return { error: errorResponse("User account not found.", 401) };
  }

  if (user.suspendedAt) {
    return { error: errorResponse("Your account is suspended.", 403) };
  }

  if (user.role !== "HOST" && user.role !== "ADMIN") {
    return {
      error: errorResponse(
        "Only hosts and administrators can manage listings.",
        403
      ),
    };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      images: { orderBy: { position: "asc" } },
      amenities: { include: { amenity: true } },
    },
  });

  if (!listing) {
    return { error: errorResponse("Listing not found.", 404) };
  }

  if (user.role !== "ADMIN" && listing.hostId !== user.id) {
    return {
      error: errorResponse(
        "You cannot manage another host's listing.",
        403
      ),
    };
  }

  return { user, listing };
}

// GET /api/host/listings/:listingId
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { listingId } = await context.params;
    const result = await getAuthorizedListing(listingId);

    if ("error" in result) {
      return result.error;
    }

    return NextResponse.json({ listing: result.listing });
  } catch (error) {
    console.error("GET host listing failed:", error);
    return errorResponse("Unable to load this listing.", 500);
  }
}

// PATCH /api/host/listings/:listingId
// Supports full edits and status-only publish/unpublish actions.
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { listingId } = await context.params;
    const result = await getAuthorizedListing(listingId);

    if ("error" in result) {
      return result.error;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Please provide valid JSON.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid listing details.", 400);
    }

    const input = body as Record<string, unknown>;

    // Allow the UI to publish, unpublish, or save a draft
    // without resubmitting every listing field.
    if (
      Object.keys(input).length === 1 &&
      Object.prototype.hasOwnProperty.call(input, "status")
    ) {
      if (!isValidStatus(input.status)) {
        return errorResponse(
          "Status must be DRAFT, PUBLISHED, or HIDDEN.",
          400
        );
      }

      const listing = await prisma.listing.update({
        where: { id: listingId },
        data: { status: input.status },
        include: {
          images: { orderBy: { position: "asc" } },
          amenities: { include: { amenity: true } },
        },
      });

      return NextResponse.json({
        message:
          input.status === "PUBLISHED"
            ? "Listing published successfully."
            : input.status === "HIDDEN"
              ? "Listing unpublished successfully."
              : "Listing saved as draft.",
        listing,
      });
    }

    const stringFields = [
      "title",
      "description",
      "propertyType",
      "address",
      "city",
      "country",
      "energyRating",
    ] as const;

    for (const field of stringFields) {
      if (
        typeof input[field] !== "string" ||
        input[field].trim().length === 0
      ) {
        return errorResponse(`${field} is required.`, 400);
      }
    }

    const title = (input.title as string).trim();
    const description = (input.description as string).trim();
    const propertyType = (input.propertyType as string).trim();
    const address = (input.address as string).trim();
    const city = (input.city as string).trim();
    const country = (input.country as string).trim();
    const energyRating = (input.energyRating as string)
      .trim()
      .toUpperCase();

    const houseRules =
      typeof input.houseRules === "string" ? input.houseRules.trim() : "";

    if (title.length > 120 || description.length > 5000) {
      return errorResponse("Title or description is too long.", 400);
    }

    if (
      propertyType.length > 80 ||
      address.length > 250 ||
      city.length > 100 ||
      country.length > 100 ||
      houseRules.length > 3000
    ) {
      return errorResponse("One or more fields are too long.", 400);
    }

    const price = input.pricePerNight;

    if (
      (typeof price !== "number" && typeof price !== "string") ||
      (typeof price === "string" && price.trim() === "") ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0 ||
      Number(price) > 10000000
    ) {
      return errorResponse("Enter a valid positive nightly price.", 400);
    }

    const maxGuests = input.maxGuests;

    if (
      typeof maxGuests !== "number" ||
      !Number.isInteger(maxGuests) ||
      maxGuests < 1 ||
      maxGuests > 50
    ) {
      return errorResponse("Maximum guests must be from 1 to 50.", 400);
    }

    const latitude = input.latitude;
    const longitude = input.longitude;

    if (
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return errorResponse("Latitude must be between -90 and 90.", 400);
    }

    if (
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return errorResponse("Longitude must be between -180 and 180.", 400);
    }

    const ecoScore = input.ecoScore;

    if (
      typeof ecoScore !== "number" ||
      !Number.isInteger(ecoScore) ||
      ecoScore < 0 ||
      ecoScore > 100
    ) {
      return errorResponse("Eco score must be from 0 to 100.", 400);
    }

    if (!/^[A-F]$/.test(energyRating)) {
      return errorResponse("Energy rating must be from A to F.", 400);
    }

    if (!isValidStatus(input.status)) {
      return errorResponse(
        "Status must be DRAFT, PUBLISHED, or HIDDEN.",
        400
      );
    }

    const rawAmenities = input.amenities;

    if (
      !Array.isArray(rawAmenities) ||
      rawAmenities.length > 30 ||
      rawAmenities.some(
        (item) =>
          typeof item !== "string" ||
          item.trim().length === 0 ||
          item.trim().length > 80
      )
    ) {
      return errorResponse("Provide a valid list of amenities.", 400);
    }

    const amenityNames = [
      ...new Set(
        (rawAmenities as string[]).map((item) => item.trim())
      ),
    ];

    const rawImages = input.images;

    if (
      !Array.isArray(rawImages) ||
      rawImages.length > 20 ||
      rawImages.some(
        (item) =>
          typeof item !== "string" ||
          item.trim().length === 0 ||
          item.trim().length > 2048 ||
          !/^https?:\/\//i.test(item.trim())
      )
    ) {
      return errorResponse(
        "Provide valid HTTP or HTTPS image URLs.",
        400
      );
    }

    const imageUrls = [
      ...new Set(
        (rawImages as string[]).map((item) => item.trim())
      ),
    ];

    const listing = await prisma.$transaction(async (tx) => {
      const amenities = await Promise.all(
        amenityNames.map((name) =>
          tx.amenity.upsert({
            where: { name },
            create: { name },
            update: {},
            select: { id: true },
          })
        )
      );

      await tx.listingAmenity.deleteMany({
        where: { listingId },
      });

      await tx.listingImage.deleteMany({
        where: { listingId },
      });

      return tx.listing.update({
        where: { id: listingId },
        data: {
          title,
          description,
          propertyType,
          address,
          city,
          country,
          houseRules,
          pricePerNight: new Prisma.Decimal(String(price)),
          maxGuests,
          latitude,
          longitude,
          ecoScore,
          energyRating,
          status: input.status as ListingStatus,
          amenities: {
            create: amenities.map((amenity) => ({
              amenityId: amenity.id,
            })),
          },
          images: {
            create: imageUrls.map((url, index) => ({
              url,
              alt: title,
              position: index,
            })),
          },
        },
        include: {
          images: { orderBy: { position: "asc" } },
          amenities: { include: { amenity: true } },
        },
      });
    });

    return NextResponse.json({
      message: "Listing updated successfully.",
      listing,
    });
  } catch (error) {
    console.error("PATCH host listing failed:", error);
    return errorResponse("Unable to update this listing.", 500);
  }
}

// DELETE /api/host/listings/:listingId
// Preserve booking history: listings with any bookings cannot be deleted.
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { listingId } = await context.params;
    const result = await getAuthorizedListing(listingId);

    if ("error" in result) {
      return result.error;
    }

    await prisma.$transaction(
      async (tx) => {
        const bookingCount = await tx.booking.count({
          where: { listingId },
        });

        if (bookingCount > 0) {
          throw new Error("LISTING_HAS_BOOKINGS");
        }

        await tx.listing.delete({
          where: { id: listingId },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LISTING_HAS_BOOKINGS") {
      return errorResponse(
        "This listing has booking history and cannot be deleted. Unpublish it instead.",
        409
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2034")
    ) {
      return errorResponse(
        "The listing could not be deleted because it has related records or a concurrent change. Refresh and try again.",
        409
      );
    }

    console.error("DELETE host listing failed:", error);
    return errorResponse("Unable to delete this listing.", 500);
  }
}
