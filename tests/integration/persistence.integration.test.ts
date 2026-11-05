import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createPackage,
  listPublishedPackages,
  listAllPackages,
  publishPackage,
  rollbackPackage,
  toSnapshot,
} from "@/server/repositories/package-repository";
import {
  addEnquiryNote,
  createEnquiry,
  findEnquiryById,
  listEnquiries,
  saveEnquiryReply,
  updateEnquiry,
} from "@/server/repositories/enquiry-repository";
import {
  addNoteForStaff,
  getEnquiryList,
  saveReplyForStaff,
  updateEnquiryForStaff,
} from "@/server/services/enquiry-admin-service";
import { prisma } from "@/server/db/client";

const runId = `integration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `${runId}@example.test`;
const slug = `integration-${runId}`;
const createdPackageIds: string[] = [];
const createdEnquiryIds: string[] = [];
const createdUserIds: string[] = [];

function requireTestDatabase() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error("TEST_DATABASE_URL is required; use npm run test:integration.");
  }

  let parsed: URL;
  try {
    parsed = new URL(testUrl);
  } catch {
    throw new Error("TEST_DATABASE_URL is not a valid URL.");
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("TEST_DATABASE_URL must use the PostgreSQL URL scheme.");
  }

  const originalUrl = process.env.ORIGINAL_DATABASE_URL;
  if (originalUrl && testUrl.trim() === originalUrl.trim()) {
    throw new Error("TEST_DATABASE_URL matches DATABASE_URL.");
  }

  const unsafeText = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  if (/(^|[-_])prod(uction)?($|[-_])|production|live|primary/.test(unsafeText)) {
    throw new Error("TEST_DATABASE_URL appears to target a production database.");
  }
}

describe("PostgreSQL and Prisma persistence", () => {
  beforeAll(async () => {
    requireTestDatabase();
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    try {
      if (createdEnquiryIds.length > 0) {
        await prisma.enquiry.deleteMany({ where: { id: { in: createdEnquiryIds } } });
      }
      if (createdPackageIds.length > 0) {
        await prisma.package.updateMany({
          where: { id: { in: createdPackageIds } },
          data: { publishedVersionId: null },
        });
        await prisma.package.deleteMany({ where: { id: { in: createdPackageIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("connects to the migrated schema and persists draft packages with seasonal prices", async () => {
    const packageRecord = await createPackage({
      slug,
      title: "Integration Kerala Journey",
      destination: "Kerala",
      durationDays: 6,
      description: "Disposable integration fixture.",
      category: "Kerala",
      hotelCategory: "4-star",
      status: "DRAFT",
      seasonalPrices: {
        create: [
          {
            seasonName: "Test season one",
            startDate: new Date("2027-01-01"),
            endDate: new Date("2027-03-31"),
            amount: "32500.00",
            currency: "INR",
            pricingBasis: "Per person; test fixture",
          },
          {
            seasonName: "Test season two",
            startDate: new Date("2027-03-15"),
            endDate: new Date("2027-04-30"),
            amount: "35000.00",
            currency: "INR",
            pricingBasis: "Per person; test fixture",
          },
        ],
      },
      itineraryDays: {
        create: [{ dayNumber: 1, title: "Arrival", description: "Test day." }],
      },
    });
    createdPackageIds.push(packageRecord.id);

    expect(packageRecord.status).toBe("DRAFT");
    expect(packageRecord.seasonalPrices).toHaveLength(2);
    expect(packageRecord.seasonalPrices[0]?.amount.toString()).toBe("32500");
    expect((await listPublishedPackages()).some((item) => item.slug === slug)).toBe(false);
    expect((await listAllPackages()).some((item) => item.id === packageRecord.id)).toBe(true);
  });

  it("persists immutable publish snapshots and rollback snapshots", async () => {
    const packageRecord = await prisma.package.findUniqueOrThrow({
      where: { id: createdPackageIds[0] },
      include: { seasonalPrices: true, itineraryDays: true },
    });
    const firstSnapshot = toSnapshot(packageRecord);
    const firstVersion = await publishPackage(packageRecord.id, null, firstSnapshot);
    const published = await listPublishedPackages();
    expect(published.find((item) => item.slug === slug)?.status).toBe("PUBLISHED");

    const changedSnapshot = { ...firstSnapshot, title: "Integration Kerala Journey Updated" };
    const secondVersion = await publishPackage(packageRecord.id, null, changedSnapshot);
    const rolledBack = await rollbackPackage(packageRecord.id, null, firstSnapshot);

    expect(secondVersion.versionNumber).toBe(firstVersion.versionNumber + 1);
    expect(rolledBack.versionNumber).toBe(secondVersion.versionNumber + 1);
    expect(
      await prisma.packageVersion.count({ where: { packageId: packageRecord.id } }),
    ).toBe(3);
    expect((await listPublishedPackages()).find((item) => item.slug === slug)?.title).toBe(
      firstSnapshot.title,
    );
  });

  it("creates enquiries, records status activity, notes and unsent replies", async () => {
    const admin = await prisma.user.create({
      data: {
        name: "Integration Consultant",
        email,
        passwordHash: "not-used-by-integration",
        role: "CONSULTANT",
      },
    });
    createdUserIds.push(admin.id);
    const enquiry = await createEnquiry({
      customerName: "Integration Traveller",
      email: `${runId}-customer@example.test`,
      destination: "Kerala",
      message: "A disposable integration enquiry.",
      adults: 2,
      children: 1,
      package: { connect: { id: createdPackageIds[0] } },
      assignedConsultant: { connect: { id: admin.id } },
    });
    createdEnquiryIds.push(enquiry.id);

    const updated = await updateEnquiry(
      enquiry.id,
      { status: "IN_PROGRESS" },
      { type: "STATUS_CHANGED", actor: { connect: { id: admin.id } } },
    );
    const note = await addEnquiryNote(enquiry.id, admin.id, "Internal test note.");
    const reply = await saveEnquiryReply(enquiry.id, admin.id, "Unsent test draft.");
    const detail = await findEnquiryById(enquiry.id);
    const assigned = await listEnquiries({
      page: 1,
      pageSize: 20,
      assignedOnlyTo: admin.id,
    });

    expect(updated.status).toBe("IN_PROGRESS");
    expect(note.body).toBe("Internal test note.");
    expect(reply.isDraft).toBe(true);
    expect(detail?.activities.map((item) => item.type)).toEqual([
      "CREATED",
      "STATUS_CHANGED",
      "NOTE_ADDED",
      "REPLY_DRAFT_SAVED",
    ]);
    expect(assigned.items.map((item) => item.id)).toContain(enquiry.id);
  });

  it("enforces assignment and role-based access rules via the enquiry admin service layer", async () => {
    const consultantA = await prisma.user.create({
      data: {
        name: "Consultant A",
        email: `${runId}-consultant-a@example.test`,
        passwordHash: "not-used-by-integration",
        role: "CONSULTANT",
      },
    });
    createdUserIds.push(consultantA.id);

    const consultantB = await prisma.user.create({
      data: {
        name: "Consultant B",
        email: `${runId}-consultant-b@example.test`,
        passwordHash: "not-used-by-integration",
        role: "CONSULTANT",
      },
    });
    createdUserIds.push(consultantB.id);

    const adminUser = await prisma.user.create({
      data: {
        name: "Admin User",
        email: `${runId}-admin@example.test`,
        passwordHash: "not-used-by-integration",
        role: "ADMIN",
      },
    });
    createdUserIds.push(adminUser.id);

    const enquiry = await createEnquiry({
      customerName: "Role Test Traveller",
      email: `${runId}-role-cust@example.test`,
      destination: "Kerala",
      message: "Role permission integration test.",
      adults: 2,
      package: { connect: { id: createdPackageIds[0] } },
      assignedConsultant: { connect: { id: consultantA.id } },
    });
    createdEnquiryIds.push(enquiry.id);

    // Unassigned consultant B cannot add notes or replies
    await expect(
      addNoteForStaff(enquiry.id, consultantB.id, "Unauthorized note", "CONSULTANT"),
    ).rejects.toThrow("FORBIDDEN");

    await expect(
      saveReplyForStaff(enquiry.id, consultantB.id, "Unauthorized reply", "CONSULTANT"),
    ).rejects.toThrow("FORBIDDEN");

    // Unassigned consultant B cannot update enquiry
    await expect(
      updateEnquiryForStaff({
        id: enquiry.id,
        actorId: consultantB.id,
        actorRole: "CONSULTANT",
        status: "IN_PROGRESS",
      }),
    ).rejects.toThrow("FORBIDDEN");

    // Assigned consultant A cannot reassign enquiry
    await expect(
      updateEnquiryForStaff({
        id: enquiry.id,
        actorId: consultantA.id,
        actorRole: "CONSULTANT",
        assignedConsultantId: consultantB.id,
      }),
    ).rejects.toThrow("FORBIDDEN");

    // Invalid status transition is rejected
    await expect(
      updateEnquiryForStaff({
        id: enquiry.id,
        actorId: consultantA.id,
        actorRole: "CONSULTANT",
        status: "CONVERTED",
      }),
    ).rejects.toThrow("INVALID_STATUS_TRANSITION");

    // Assigned consultant A can add notes and save draft replies
    const note = await addNoteForStaff(enquiry.id, consultantA.id, "Authorized consultant note", "CONSULTANT");
    expect(note.body).toBe("Authorized consultant note");

    const reply = await saveReplyForStaff(enquiry.id, consultantA.id, "Authorized draft reply", "CONSULTANT");
    expect(reply.body).toBe("Authorized draft reply");
    expect(reply.isDraft).toBe(true);

    // Admin can reassign enquiry from consultant A to consultant B
    const reassigned = await updateEnquiryForStaff({
      id: enquiry.id,
      actorId: adminUser.id,
      actorRole: "ADMIN",
      assignedConsultantId: consultantB.id,
    });
    expect(reassigned.assignedConsultantId).toBe(consultantB.id);

    // Activity should have recorded ASSIGNED
    const detail = await findEnquiryById(enquiry.id);
    expect(detail?.activities.some((a) => a.type === "ASSIGNED")).toBe(true);

    // Consultant enquiry list filtering: consultant A sees 0, consultant B sees 1
    const listA = await getEnquiryList({ page: 1, pageSize: 20 }, consultantA.id);
    expect(listA.items.some((item) => item.id === enquiry.id)).toBe(false);

    const listB = await getEnquiryList({ page: 1, pageSize: 20 }, consultantB.id);
    expect(listB.items.some((item) => item.id === enquiry.id)).toBe(true);
  });
});
