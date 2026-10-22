import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { abort, back, readBody, validate, validationError } from '@/lib/http';
import { gatewayExists, gatewayFields } from '@/lib/services/billing/catalog';
import { persistGateway } from '@/lib/domain/gateway-config';

/** PUT /admin/payment-gateways/{gateway} — ::update() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.payment-gateways.update', 'manage_payment_gateways');
    if (gate.response) return gate.response;

    const { gateway } = await params;
    if (!gatewayExists(gateway)) return abort(404);

    const rules = {
        test_mode: ['required', 'boolean'],
        enabled: ['required', 'boolean'],
    };
    for (const f of gatewayFields(gateway)) {
        rules[`test_${f.key}`] = ['nullable', 'string', 'max:1024'];
        rules[`live_${f.key}`] = ['nullable', 'string', 'max:1024'];
    }

    const data = await validate(await readBody(request), rules);

    const result = await persistGateway(gateway, data);
    if (result.error) return validationError(result.error);

    return back({ success: 'Payment gateway saved.' });
});
