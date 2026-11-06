import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const page = await base44.asServiceRole.entities.PreOrderSale.filter(
      { active: true },
      { sort: '-created_date', limit: 1 }
    );
    const sale = (page?.items || [])[0] || null;
    return Response.json({
      zelle_info: sale?.zelle_info || '',
      cashapp_info: sale?.cashapp_info || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}