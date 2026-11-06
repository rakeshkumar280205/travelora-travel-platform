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

  const publishedPackage = await prisma.package.upsert({
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
      itineraryDays: {
        create: [
          {
            dayNumber: 1,
            title: "Arrival in Cochin & Transfer to Munnar",
            description: "Arrive at Cochin airport. Meet our atelier chauffeur and ascend through misty Western Ghats tea plantations to Munnar.",
          },
          {
            dayNumber: 2,
            title: "Munnar Tea Sanctuary & Eravikulam",
            description: "Private guided morning trail at Eravikulam National Park in search of Nilgiri Tahr, followed by an afternoon tea tasting at a heritage estate.",
          },
          {
            dayNumber: 3,
            title: "Spice Valleys of Thekkady",
            description: "Drive through cardamom hills to Thekkady. Private walking tour of an organic spice farm and sunset boat safari on Lake Periyar.",
          },
          {
            dayNumber: 4,
            title: "Alleppey Houseboat Embarkation",
            description: "Board your private handcrafted kettuvallam in Alleppey. Cruise through serene palm-fringed backwaters with regional chef-prepared dining.",
          },
          {
            dayNumber: 5,
            title: "Vembanad Backwaters & Heritage Resort",
            description: "Disembark after sunrise backwater cruising. Check into a boutique lakeside sanctuary overlooking Lake Vembanad.",
          },
          {
            dayNumber: 6,
            title: "Cochin Historic Quarter & Departure",
            description: "Morning exploration of Fort Kochi spice markets and Chinese fishing nets before chauffeur transfer to Cochin airport.",
          },
        ],
      },
    },
  });

  // Ensure published package has an immutable version snapshot
  const existingVersion = await prisma.packageVersion.findFirst({
    where: { packageId: publishedPackage.id },
  });
  if (!existingVersion) {
    const fullPackage = await prisma.package.findUnique({
      where: { id: publishedPackage.id },
      include: {
        seasonalPrices: { orderBy: { startDate: "asc" } },
        itineraryDays: { orderBy: { dayNumber: "asc" } },
      },
    });

    const version = await prisma.packageVersion.create({
      data: {
        packageId: publishedPackage.id,
        versionNumber: 1,
        snapshot: {
          slug: fullPackage.slug,
          title: fullPackage.title,
          destination: fullPackage.destination,
          durationDays: fullPackage.durationDays,
          category: fullPackage.category,
          hotelCategory: fullPackage.hotelCategory,
          description: fullPackage.description,
          seasonalPrices: fullPackage.seasonalPrices.map((sp) => ({
            id: sp.id,
            seasonName: sp.seasonName,
            startDate: sp.startDate.toISOString(),
            endDate: sp.endDate.toISOString(),
            amount: String(sp.amount),
            currency: sp.currency,
            pricingBasis: sp.pricingBasis,
          })),
          itineraryDays: fullPackage.itineraryDays.map((d) => ({
            id: d.id,
            dayNumber: d.dayNumber,
            title: d.title,
            description: d.description,
          })),
        },
      },
    });
    await prisma.package.update({
      where: { id: publishedPackage.id },
      data: { publishedVersionId: version.id },
    });
  }

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

  // Seed demo published blog post linked to Kerala package
  const existingPost = await prisma.blogPost.findUnique({
    where: { slug: "sustainable-backwaters-of-alleppey" },
  });
  if (!existingPost) {
    const post = await prisma.blogPost.create({
      data: {
        slug: "sustainable-backwaters-of-alleppey",
        title: "A Quiet Odyssey: The Living Backwaters of Alleppey",
        excerpt: "Exploring Kerala's tranquil canal ecosystems through slow travel, heritage kettuvallam cruising, and village stewardship.",
        content: `## The Rhythm of Slow Water\n\nGliding through the palm-fringed canals of Alleppey aboard a handcrafted wooden kettuvallam offers a profound lesson in time and landscape. Long before these vessels accommodated contemplative travellers, they served as the agricultural arteries of the Kuttanad delta.\n\n### Ecological Stewardship\n\nPreserving the delicate equilibrium between local agricultural traditions and mindful hospitality remains at the heart of responsible South India journeys.\n\n- **Solar and Bio-hybrid Vessels**: Modern sustainable houseboats minimize emissions along pristine waterways.\n- **Farm-to-Canal Dining**: Traditional Karimeen and red rice sourced directly from organic village collectives.\n- **Low-Impact Navigation**: Exploring shallow arteries via traditional wooden canoes guided by local rowers.`,
        category: "Destination Dispatch",
        tags: ["Kerala", "Backwaters", "Slow Travel", "Alleppey"],
        seoTitle: "The Living Backwaters of Alleppey | Travelora Journal",
        seoDescription: "An exploration of Kerala's serene backwater ecosystems, slow travel, and responsible kettuvallam cruising with Travelora.",
        status: "PUBLISHED",
        publishedAt: new Date("2026-10-15T09:00:00.000Z"),
        relatedPackageId: publishedPackage.id,
      },
    });

    const postVersion = await prisma.blogPostVersion.create({
      data: {
        postId: post.id,
        versionNumber: 1,
        snapshot: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          tags: post.tags,
        },
      },
    });

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { publishedVersionId: postVersion.id },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
