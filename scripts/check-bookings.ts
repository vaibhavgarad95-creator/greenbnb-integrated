import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      guests: true,
      totalPrice: true,
      status: true,
      listing: { select: { title: true } },
    },
  });

  console.log("LATEST BOOKINGS:");
  console.log(
    JSON.stringify(
      bookings.map((booking) => ({
        ...booking,
        totalPrice: booking.totalPrice.toString(),
      })),
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());