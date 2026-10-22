import { NextResponse } from 'next/server';
import { handler } from '@/lib/guards';
import { requireAdminPermissions } from '@/lib/guards-admin';
import { abort } from '@/lib/http';
import { gatewayExists } from '@/lib/services/billing/catalog';
import { gatewayShowPayload } from '@/lib/domain/gateway-config';

/**
 * GET /admin/payment-gateways/{gateway} — ::show() (JSON, fetched by the
 * gateway edit modal).
 */
export const GET = handler(async (request, { params }) => {
    await requireAdminPermissions('manage_payment_gateways');

    const { gateway } = await params;
    if (!gatewayExists(gateway)) return abort(404);

    return NextResponse.json(await gatewayShowPayload(gateway));
});
