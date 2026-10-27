import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    select: {
      title: true,
      city: true,
      pricePerNight: true,
    },
  });

  console.log("\nDATABASE LISTINGS:");
  console.log(JSON.stringify(listings, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });