
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export default async function GuestBookingsLink() {
  const userId = await getSessionUserId();

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      suspendedAt: true,
    },
  });

  if (!user || user.role !== "GUEST" || user.suspendedAt) {
    return null;
  }

  return (
    <Link
      href="/bookings"
      style={{
        color: "#238052",
        textDecoration: "none",
        fontWeight: 700,
      }}
    >
      My Bookings
    </Link>
  );
}
