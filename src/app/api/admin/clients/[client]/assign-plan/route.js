import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, readBody, validate, validationError } from '@/lib/http';
import { monthlyGrantForPlan } from '@/lib/services/credits';
import { logAdminAudit } from '@/lib/services/audit-log';

/** POST /admin/clients/{client}/assign-plan */
export const POST = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.clients.assign-plan', 'view_clients');
    if (gate.response) return gate.response;

    const { client: id } = await params;
    const client = await prisma.client.findUnique({ where: { id: BigInt(id) } });
    if (!client) return abort(404);

    const data = await validate(await readBody(request), {
        plan_id: ['required', 'integer'],
        billing_cycle: ['required', 'string', 'in:monthly,yearly'],
    });

    const plan = await prisma.plan.findUnique({ where: { id: BigInt(data.plan_id) } });
    if (!plan) return validationError({ plan_id: ['The selected plan id is invalid.'] });

    // One active client subscription at a time.
    await prisma.clientSubscription.updateMany({
        where: { client_id: client.id, status: 'active' },
        data: { status: 'cancelled', ends_at: new Date(), updated_at: new Date() },
    });

    const sub = await prisma.clientSubscription.create({
        data: {
            client_id: client.id,
            plan_id: plan.id,
            billing_cycle: data.billing_cycle,
            starts_at: new Date(),
            status: 'active',
            assigned_by_admin_id: gate.admin.id,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    await monthlyGrantForPlan(client.id).catch(() => {});

    await logAdminAudit(gate.admin, 'client.plan_assigned', 'Client', client.id, {
        plan_id: Number(plan.id),
        plan_name: plan.name,
        billing_cycle: data.billing_cycle,
    });

    return NextResponse.json({
        subscription: {
            id: Number(sub.id),
            plan: { name: plan.name },
            billing_cycle: sub.billing_cycle,
        },
    });
});
