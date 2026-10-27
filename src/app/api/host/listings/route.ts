
import { NextRequest, NextResponse } from "next/server";
import { ListingStatus, Prisma } from "@prisma/client";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getHost() {
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

  return { user };
}

// GET /api/host/listings
// Return listings belonging to the signed-in host.
export async function GET() {
  try {
    const result = await getHost();

    if (result.error) return result.error;

    const listings = await prisma.listing.findMany({
      where:
        result.user.role === "ADMIN"
          ? {}
          : { hostId: result.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" } },
        amenities: { include: { amenity: true } },
        _count: { select: { bookings: true } },
      },
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("GET host listings failed:", error);
    return errorResponse("Unable to load your listings.", 500);
  }
}

// POST /api/host/listings
// Create a listing for the signed-in host.
export async function POST(request: NextRequest) {
  try {
    const result = await getHost();

    if (result.error) return result.error;

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

    const requiredStrings = [
      "title",
      "description",
      "propertyType",
      "address",
      "city",
      "country",
      "energyRating",
    ] as const;

    for (const field of requiredStrings) {
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
    const energyRating = (input.energyRating as string).trim().toUpperCase();
    const houseRules =
      typeof input.houseRules === "string"
        ? input.houseRules.trim()
        : "";

    if (title.length > 120) {
      return errorResponse("Title must be 120 characters or fewer.", 400);
    }

    if (description.length > 5000) {
      return errorResponse("Description must be 5000 characters or fewer.", 400);
    }

    if (
      propertyType.length > 80 ||
      address.length > 250 ||
      city.length > 100 ||
      country.length > 100 ||
      houseRules.length > 3000
    ) {
      return errorResponse("One or more listing fields are too long.", 400);
    }

    const pricePerNight = input.pricePerNight;
    const maxGuests = input.maxGuests;
    const latitude = input.latitude;
    const longitude = input.longitude;
    const ecoScore = input.ecoScore;

    if (
      (typeof pricePerNight !== "number" &&
        typeof pricePerNight !== "string") ||
      !Number.isFinite(Number(pricePerNight)) ||
      Number(pricePerNight) <= 0 ||
      Number(pricePerNight) > 10000000
    ) {
      return errorResponse("Price per night must be a valid positive amount.", 400);
    }

    if (
      typeof maxGuests !== "number" ||
      !Number.isInteger(maxGuests) ||
      maxGuests < 1 ||
      maxGuests > 50
    ) {
      return errorResponse("Maximum guests must be an integer from 1 to 50.", 400);
    }

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

    if (
      typeof ecoScore !== "number" ||
      !Number.isInteger(ecoScore) ||
      ecoScore < 0 ||
      ecoScore > 100
    ) {
      return errorResponse("Eco score must be an integer from 0 to 100.", 400);
    }

    if (!/^[A-F]$/.test(energyRating)) {
      return errorResponse("Energy rating must be a letter from A to F.", 400);
    }

    const requestedStatus = input.status;
    const status: ListingStatus =
      requestedStatus === "DRAFT" ? ListingStatus.DRAFT : ListingStatus.PUBLISHED;

    if (
      requestedStatus !== undefined &&
      requestedStatus !== "DRAFT" &&
      requestedStatus !== "PUBLISHED"
    ) {
      return errorResponse("Status must be DRAFT or PUBLISHED.", 400);
    }

    const rawAmenities = input.amenities;

    if (
      rawAmenities !== undefined &&
      (!Array.isArray(rawAmenities) ||
        rawAmenities.length > 30 ||
        rawAmenities.some(
          (item) =>
            typeof item !== "string" ||
            item.trim().length === 0 ||
            item.trim().length > 80
        ))
    ) {
      return errorResponse("Amenities must be a list of valid names.", 400);
    }

    const amenityNames = [
      ...new Set(
        (Array.isArray(rawAmenities) ? rawAmenities : []).map(
          (item) => (item as string).trim()
        )
      ),
    ];

    const rawImages = input.images;

    if (
      rawImages !== undefined &&
      (!Array.isArray(rawImages) ||
        rawImages.length > 20 ||
        rawImages.some(
          (item) =>
            typeof item !== "string" ||
            item.trim().length === 0 ||
            item.trim().length > 2048 ||
            !/^https?:\/\//i.test(item.trim())
        ))
    ) {
      return errorResponse(
        "Images must be a list of valid HTTP or HTTPS URLs.",
        400
      );
    }

    const imageUrls = [
      ...new Set(
        (Array.isArray(rawImages) ? rawImages : []).map(
          (item) => (item as string).trim()
        )
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

      return tx.listing.create({
        data: {
          hostId: result.user.id,
          title,
          description,
          houseRules,
          propertyType,
          maxGuests,
          pricePerNight: new Prisma.Decimal(String(pricePerNight)),
          latitude,
          longitude,
          address,
          city,
          country,
          ecoScore,
          energyRating,
          status,
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

    return NextResponse.json(
      { message: "Listing created successfully.", listing },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST host listing failed:", error);
    return errorResponse("Unable to create listing.", 500);
  }
}
