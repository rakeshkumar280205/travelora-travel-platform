import "server-only";

import type { Prisma } from "@prisma/client";

import type { PublicEnquiryInput } from "@/lib/validation/enquiry-schemas";
import { findPublishedPackageBySlug } from "@/server/repositories/package-repository";
import { createEnquiry } from "@/server/repositories/enquiry-repository";

export async function createPublicEnquiry(input: PublicEnquiryInput) {
  let packageId: string | undefined;
  let destination = input.destination;

  if (input.packageSlug) {
    const packageRecord = await findPublishedPackageBySlug(input.packageSlug);
    if (!packageRecord) throw new Error("PACKAGE_NOT_FOUND");
    packageId = packageRecord.id;
    destination = packageRecord.destination;
  }

  const data: Prisma.EnquiryCreateInput = {
    customerName: input.customerName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    message: input.message,
    destination,
    startDate: input.startDate,
    travelMonth: input.travelMonth,
    durationDays: input.durationDays,
    adults: input.adults,
    children: input.children,
    budget: input.budget,
    currency: input.budget === undefined ? undefined : input.currency ?? "INR",
    package: packageId ? { connect: { id: packageId } } : undefined,
  };

  return createEnquiry(data);
}
