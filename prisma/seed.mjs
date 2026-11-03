import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

if (!["development", "test"].includes(process.env.NODE_ENV || "development")) {
  throw new Error("The development seed can only run in development or test.");
}

const seedEnv = z
  .object({
    SEED_ADMIN_EMAIL: z.string().email(),
    SEED_ADMIN_PASSWORD: z.string().min(12),
  })
  .parse({
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
  });

const { SEED_ADMIN_EMAIL: adminEmail, SEED_ADMIN_PASSWORD: adminPassword } =
  seedEnv;

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { name: "Travelora Admin", passwordHash, role: "ADMIN" },
    create: {
      name: "Travelora Admin",
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.package.upsert({
    where: { slug: "PKG-KL-07" },
    update: {},
    create: {
      slug: "PKG-KL-07",
      title: "Munnar, Thekkady and Alleppey Houseboat",
      destination: "Kerala",
      durationDays: 6,
      description:
        "A six-day Kerala journey across Munnar, Thekkady and Alleppey, including a houseboat experience. Published package pricing is indicative and GST treatment is to be confirmed; it is not a verified final quotation.",
      category: "Kerala",
      hotelCategory: "4-star",
      status: "PUBLISHED",
      seasonalPrices: {
        create: [
          {
            seasonName: "Peak October-March",
            startDate: new Date("2026-10-01T00:00:00.000Z"),
            endDate: new Date("2027-03-31T23:59:59.999Z"),
            amount: 32500,
            currency: "INR",
            pricingBasis:
              "Per person; indicative package price; GST treatment to be confirmed",
          },
          {
            seasonName: "Monsoon June-September",
            startDate: new Date("2026-06-01T00:00:00.000Z"),
            endDate: new Date("2026-09-30T23:59:59.999Z"),
            amount: 24900,
            currency: "INR",
            pricingBasis:
              "Per person; indicative package price; GST treatment to be confirmed",
          },
        ],
      },
    },
  });

  await prisma.package.upsert({
    where: { slug: "PKG-SI-12" },
    update: {},
    create: {
      slug: "PKG-SI-12",
      title: "Madurai, Rameswaram and Kanyakumari",
      destination: "Tamil Nadu",
      durationDays: 5,
      description:
        "A five-day South India pilgrimage and heritage journey. Draft pricing is indicative and GST treatment is to be confirmed; it is not a verified final quotation.",
      category: "South India",
      hotelCategory: "3-star",
      status: "DRAFT",
      seasonalPrices: {
        create: {
          seasonName: "All year",
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2099-12-31T23:59:59.999Z"),
          amount: 18750,
          currency: "INR",
          pricingBasis:
            "Per person; indicative draft package price; GST treatment to be confirmed",
        },
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
