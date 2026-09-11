import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { deleteDemoData, generateDemoData } from '../../shared/demoData.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const deleted = await deleteDemoData(base44.asServiceRole);
    const created = await generateDemoData(base44.asServiceRole, user);

    await base44.asServiceRole.entities.CustodyLog.create({
      decedent_id: 'SYSTEM', decedent_unique_id: 'SYSTEM', action_type: 'note_added',
      performed_by: user.full_name || user.email, performed_by_role: 'admin',
      timestamp: new Date().toISOString(),
      notes: `Demo data reset completed. Deleted ${Object.values(deleted).reduce((a, b) => a + b, 0)} records, created ${created.total} records.`,
      verification_method: 'digital_signature', location: 'System', is_demo_data: false,
    });

    return Response.json({ success: true, deleted, created: created.created, totalCreated: created.total, resetBy: user.full_name || user.email, resetAt: new Date().toISOString() });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      await base44.asServiceRole.entities.CustodyLog.create({
        decedent_id: 'SYSTEM', decedent_unique_id: 'SYSTEM', action_type: 'alert_raised',
        performed_by: user?.full_name || user?.email || 'Unknown', performed_by_role: 'admin',
        timestamp: new Date().toISOString(), notes: `Demo data reset FAILED: ${error.message}`,
        is_flagged: true, flag_reason: 'Demo reset failure', is_demo_data: false,
      });
    } catch (e) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}