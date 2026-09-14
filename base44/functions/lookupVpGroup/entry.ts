import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const b = await req.json().catch(() => ({} as any));
    const jobTitle = String(b.job_title || "").trim();
    const department = String(b.department || "").trim();
    const firstName = String(b.first_name || "").trim();
    const lastName = String(b.last_name || "").trim();

    if (!jobTitle || !department) {
      return Response.json({ vp_group: null });
    }

    // Try exact match on job_title + processing_unit (department)
    let matches = await base44.asServiceRole.entities.RosterMember.filter({
      job_title: jobTitle,
      processing_unit: department
    }, null, 1);

    if (matches && matches.length > 0) {
      return Response.json({ vp_group: matches[0].vp_group || null });
    }

    // Fallback: normalized case-insensitive match across all roster members
    const norm = (s: string) => (s || "").toLowerCase().trim().replace(/\s+/g, " ");
    const allMembers = await base44.asServiceRole.entities.RosterMember.list(null, 1200);

    // Try job title + department (normalized)
    let match = allMembers.find((m: any) =>
      norm(m.job_title) === norm(jobTitle) && norm(m.processing_unit) === norm(department)
    );

    // If still no match, try name match as a last resort
    if (!match && firstName && lastName) {
      match = allMembers.find((m: any) =>
        norm(m.first_name) === norm(firstName) && norm(m.last_name) === norm(lastName)
      );
    }

    return Response.json({ vp_group: match ? (match.vp_group || null) : null });
  } catch (error: any) {
    return Response.json({ vp_group: null, error: error.message }, { status: 500 });
  }
}