/** Port of Client\FormController's field types and validation rules. */

export const FIELD_TYPES = ['text', 'email', 'phone', 'textarea', 'select', 'number'];

export const FORM_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };

export function formRules() {
    return {
        name: ['required', 'string', 'max:255'],
        description: ['nullable', 'string', 'max:2000'],
        status: ['nullable', `in:${FORM_STATUS.ACTIVE},${FORM_STATUS.INACTIVE}`],
        fields: ['nullable', 'array'],
    };
}

/** `fields.*.{key,label,type,required,options}` — validated per row. */
export function validateFields(fields) {
    const errors = {};
    (fields ?? []).forEach((field, i) => {
        if (!field?.key || String(field.key).length > 64) {
            errors[`fields.${i}.key`] = ['The field key is required (max 64 characters).'];
        }
        if (!field?.label || String(field.label).length > 255) {
            errors[`fields.${i}.label`] = ['The field label is required (max 255 characters).'];
        }
        if (!FIELD_TYPES.includes(field?.type)) {
            errors[`fields.${i}.type`] = ['The selected field type is invalid.'];
        }
    });
    return Object.keys(errors).length ? errors : null;
}
