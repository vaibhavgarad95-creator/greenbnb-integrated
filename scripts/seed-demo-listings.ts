

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hostEmail = "greenbnb.demo.host@example.com";
  const hostPassword = process.env.DEMO_HOST_PASSWORD;

  if (!hostPassword || hostPassword.length < 12) {
    throw new Error(
      "Add DEMO_HOST_PASSWORD (at least 12 characters) to your .env file."
    );
  }

  const passwordHash = await bcrypt.hash(hostPassword, 12);

  const host = await prisma.user.upsert({
    where: { email: hostEmail },
    update: {
      name: "GreenBnB Demo Host",
      role: "HOST",
      passwordHash,
    },
    create: {
      name: "GreenBnB Demo Host",
      email: hostEmail,
      passwordHash,
      role: "HOST",
    },
  });

  const listings = [
    {
      title: "Forest Escape Cabin",
      description:
        "Escape into nature in this peaceful cabin surrounded by greenery near Lonavala.",
      propertyType: "Cabin",
      pricePerNight: 3200,
      latitude: 18.7546,
      longitude: 73.4062,
      address: "Lonavala, Maharashtra",
      city: "Lonavala",
      country: "India",
      ecoScore: 92,
      energyRating: "A",
      maxGuests: 4,
      houseRules: "Keep the property clean and respect nature.",
    },
    {
      title: "Peaceful Hill Retreat",
      description:
        "Relax in a quiet hill retreat with scenic views in Mahabaleshwar.",
      propertyType: "Cottage",
      pricePerNight: 2800,
      latitude: 17.9307,
      longitude: 73.6477,
      address: "Mahabaleshwar, Maharashtra",
      city: "Mahabaleshwar",
      country: "India",
      ecoScore: 88,
      energyRating: "A",
      maxGuests: 4,
      houseRules: "Keep noise low and leave the property tidy.",
    },
    {
      title: "Eco-Friendly Lake House",
      description:
        "Enjoy a relaxing lakeside stay near Mulshi surrounded by nature.",
      propertyType: "Lake House",
      pricePerNight: 4500,
      latitude: 18.5144,
      longitude: 73.507,
      address: "Mulshi, Maharashtra",
      city: "Mulshi",
      country: "India",
      ecoScore: 96,
      energyRating: "A+",
      maxGuests: 6,
      houseRules: "Respect the lake and dispose of waste responsibly.",
    },
  ];

  for (const listing of listings) {
    const existing = await prisma.listing.findFirst({
      where: {
        hostId: host.id,
        title: listing.title,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.listing.update({
        where: { id: existing.id },
        data: listing,
      });
      console.log("Updated:", listing.title);
    } else {
      await prisma.listing.create({
        data: {
          ...listing,
          hostId: host.id,
        },
      });
      console.log("Created:", listing.title);
    }
  }

  console.log("\nDemo host:", host.email);
  console.log("Demo listings are ready.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
