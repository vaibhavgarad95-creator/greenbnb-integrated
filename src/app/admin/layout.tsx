import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
export const runtime = "nodejs";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const id = await getSessionUserId();
  if (!id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true, suspendedAt: true } });
  if (!user || user.role !== "ADMIN" || user.suspendedAt) redirect("/");
  return <>{children}</>;
}
