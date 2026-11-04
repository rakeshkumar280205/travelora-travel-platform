import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export async function createEnquiry(data: Prisma.EnquiryCreateInput) {
  return prisma.$transaction(async (transaction) => {
    const enquiry = await transaction.enquiry.create({ data });
    await transaction.enquiryActivity.create({
      data: { enquiryId: enquiry.id, type: "CREATED" },
    });
    return enquiry;
  });
}

const listInclude = {
  package: { select: { id: true, slug: true, title: true } },
  assignedConsultant: { select: { id: true, name: true, email: true } },
} as const;

export async function listEnquiries(input: {
  page: number;
  pageSize: number;
  search?: string;
  status?: Prisma.EnquiryWhereInput["status"];
  packageId?: string;
  assignedConsultantId?: string;
  assignedOnlyTo?: string;
}) {
  const where: Prisma.EnquiryWhereInput = {
    ...(input.assignedOnlyTo ? { assignedConsultantId: input.assignedOnlyTo } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.packageId ? { packageId: input.packageId } : {}),
    ...(input.assignedConsultantId ? { assignedConsultantId: input.assignedConsultantId } : {}),
    ...(input.search
      ? {
          OR: [
            { customerName: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            { destination: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.enquiry.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        email: true,
        destination: true,
        status: true,
        adults: true,
        children: true,
        createdAt: true,
        updatedAt: true,
        package: listInclude.package,
        assignedConsultant: listInclude.assignedConsultant,
      },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.enquiry.count({ where }),
  ]);
  return { items, total };
}

export async function findEnquiryById(id: string) {
  return prisma.enquiry.findUnique({
    where: { id },
    include: {
      package: { select: { id: true, slug: true, title: true, destination: true } },
      assignedConsultant: { select: { id: true, name: true, email: true } },
      notes: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      replies: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
      },
      activities: {
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function findConsultant(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "CONSULTANT" },
    select: { id: true, name: true, email: true },
  });
}

export async function listConsultants() {
  return prisma.user.findMany({
    where: { role: "CONSULTANT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function updateEnquiry(
  id: string,
  data: Prisma.EnquiryUpdateInput,
  activity?: Prisma.EnquiryActivityCreateWithoutEnquiryInput,
) {
  return prisma.$transaction(async (transaction) => {
    const enquiry = await transaction.enquiry.update({ where: { id }, data });
    if (activity) {
      await transaction.enquiryActivity.create({
        data: { ...activity, enquiry: { connect: { id } } },
      });
    }
    return enquiry;
  });
}

export async function addEnquiryNote(
  enquiryId: string,
  authorId: string,
  body: string,
) {
  return prisma.$transaction(async (transaction) => {
    const note = await transaction.enquiryNote.create({
      data: { enquiryId, authorId, body },
      include: { author: { select: { id: true, name: true } } },
    });
    await transaction.enquiryActivity.create({
      data: {
        enquiryId,
        actorId: authorId,
        type: "NOTE_ADDED",
      },
    });
    return note;
  });
}

export async function saveEnquiryReply(
  enquiryId: string,
  authorId: string,
  body: string,
) {
  return prisma.$transaction(async (transaction) => {
    const reply = await transaction.enquiryReply.create({
      data: { enquiryId, authorId, body, isDraft: true },
      include: { author: { select: { id: true, name: true } } },
    });
    await transaction.enquiryActivity.create({
      data: {
        enquiryId,
        actorId: authorId,
        type: "REPLY_DRAFT_SAVED",
      },
    });
    return reply;
  });
}
