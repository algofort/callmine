import 'server-only';

import prisma from '@/lib/prisma';
import { abort } from '@/lib/http';

/** Client\EmailTemplateController's rules and ownership guard. */

export function messageTemplateRules() {
    return {
        name: ['required', 'string', 'max:255'],
        subject: ['nullable', 'string', 'max:255'],
        html: ['nullable', 'string'],
        design_json: ['nullable', 'string'],
        variables: ['nullable', 'array'],
        is_active: ['nullable', 'boolean'],
    };
}

export function messageTemplateData(data) {
    return {
        name: data.name,
        subject: data.subject ?? null,
        html: data.html ?? null,
        design_json: data.design_json ?? null,
        variables: data.variables ?? null,
        is_active: data.is_active ?? true,
    };
}

export async function findOwnTemplate(id, clientId) {
    const tpl = await prisma.messageTemplate.findUnique({ where: { id: BigInt(id) } });
    if (!tpl) return { error: abort(404) };
    if (String(tpl.client_id) !== String(clientId)) return { error: abort(403) };
    return { tpl };
}
