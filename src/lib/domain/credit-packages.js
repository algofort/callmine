export function creditPackageRules() {
    return {
        name: ['required', 'string', 'max:255'],
        credits: ['required', 'integer', 'min:1'],
        price_cents: ['required', 'integer', 'min:0'],
        currency_code: ['required', 'string', 'max:10'],
        is_popular: ['nullable', 'boolean'],
        is_active: ['nullable', 'boolean'],
        sort_order: ['nullable', 'integer'],
    };
}

export function creditPackageData(data) {
    return {
        name: data.name,
        credits: Number(data.credits),
        price_cents: BigInt(Number(data.price_cents)),
        currency_code: data.currency_code,
        is_popular: data.is_popular ?? false,
        is_active: data.is_active ?? true,
        sort_order: Number(data.sort_order ?? 0),
    };
}
