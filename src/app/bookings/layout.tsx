
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

export default async function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      suspendedAt: true,
    },
  });

  if (!user || user.role !== "GUEST" || user.suspendedAt) {
    redirect("/");
  }

  return <>{children}</>;
}
