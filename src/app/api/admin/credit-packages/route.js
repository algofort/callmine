import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';
import { creditPackageData, creditPackageRules } from '@/lib/domain/credit-packages';

/** POST /admin/credit-packages */
export const POST = handler(async (request) => {
    const gate = await gateAdminPermissions('admin.credit-packages.store', 'create_plans');
    if (gate.response) return gate.response;

    const data = await validate(await readBody(request), creditPackageRules());

    await prisma.creditPackage.create({
        data: { ...creditPackageData(data), created_at: new Date(), updated_at: new Date() },
    });

    return back({ success: 'Credit package created.' });
});
