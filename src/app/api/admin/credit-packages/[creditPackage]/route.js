import prisma from '@/lib/prisma';
import { handler } from '@/lib/guards';
import { gateAdminPermissions } from '@/lib/guards-admin';
import { back, readBody, validate } from '@/lib/http';
import { creditPackageData, creditPackageRules } from '@/lib/domain/credit-packages';

/** PUT /admin/credit-packages/{creditPackage} — ::update() */
export const PUT = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.credit-packages.update', 'update_plans');
    if (gate.response) return gate.response;

    const { creditPackage: id } = await params;
    const data = await validate(await readBody(request), creditPackageRules());

    await prisma.creditPackage.update({
        where: { id: BigInt(id) },
        data: { ...creditPackageData(data), updated_at: new Date() },
    });

    return back({ success: 'Credit package updated.' });
});

/** DELETE /admin/credit-packages/{creditPackage} — ::destroy() */
export const DELETE = handler(async (request, { params }) => {
    const gate = await gateAdminPermissions('admin.credit-packages.destroy', 'delete_plans');
    if (gate.response) return gate.response;

    const { creditPackage: id } = await params;
    await prisma.creditPackage.delete({ where: { id: BigInt(id) } }).catch(() => {});

    return back({ success: 'Credit package deleted.' });
});
