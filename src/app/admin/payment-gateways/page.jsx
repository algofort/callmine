import AdminPaymentGateways from '@/views/Admin/PaymentGateways/Index';
import { renderPage } from '@/lib/render';
import { requireAdminPermissions } from '@/lib/guards-admin';
import { gatewayIndexList } from '@/lib/domain/gateway-config';

export const dynamic = 'force-dynamic';

/** GET /admin/payment-gateways */
export default async function Page() {
    await requireAdminPermissions('view_payment_gateways');

    const gateways = await gatewayIndexList();

    const props = {
        gateways,
        stats: [
            { label: 'Total gateways', value: gateways.length, icon: 'credit-card', accent: 'brand' },
            { label: 'Enabled', value: gateways.filter((g) => g.enabled).length, icon: 'check', accent: 'signal' },
            { label: 'Configured', value: gateways.filter((g) => g.configured).length, icon: 'plug', accent: 'cold' },
        ],
    };

    return renderPage(AdminPaymentGateways, 'Admin/PaymentGateways/Index', props, {
        url: '/admin/payment-gateways',
        isAdminRoute: true,
    });
}
