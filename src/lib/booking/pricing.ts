import { Prisma } from "@prisma/client";

/** Decimal-safe total. Price always comes from the DB, never the client. */
export function calculateTotal(pricePerNight: Prisma.Decimal | string | number, nights: number) {
  if (!Number.isInteger(nights) || nights < 1) throw new RangeError("nights must be a positive integer");
  return new Prisma.Decimal(pricePerNight).mul(nights).toDecimalPlaces(2);
}
