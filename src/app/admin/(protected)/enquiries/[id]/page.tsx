import { notFound, redirect } from "next/navigation";

import { EnquiryDetail } from "@/components/admin/enquiry-detail";
import { getStaffSession } from "@/server/services/authorization";
import { getEnquiryConsultants, getEnquiryDetail } from "@/server/services/enquiry-admin-service";

export const instant = false;

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session) redirect("/admin/signin");
  if (session.user.role === "EDITOR") return <p className="text-sm text-charcoal/60">You do not have access to enquiries.</p>;
  const { id } = await params;
  const enquiry = await getEnquiryDetail(id);
  if (!enquiry) notFound();
  if (session.user.role === "CONSULTANT" && enquiry.assignedConsultantId !== session.user.id) {
    return <p className="text-sm text-charcoal/60">You do not have access to this enquiry.</p>;
  }
  const serialized = JSON.parse(JSON.stringify(enquiry)) as unknown as Parameters<typeof EnquiryDetail>[0]["enquiry"];
  const consultants = session.user.role === "ADMIN" ? await getEnquiryConsultants() : [];
  return <EnquiryDetail enquiry={serialized} consultants={consultants} canAssign={session.user.role === "ADMIN"} canUseAi />;
}
