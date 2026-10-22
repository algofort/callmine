/** Port of App\Models\KycDocument's constants. */

export const KYC_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' };

export const KYC_TYPES = {
    photo_id: 'Government-issued photo ID',
    business_registration: 'Business registration certificate',
    tax_certificate: 'Tax / VAT registration document',
    caller_authorization: 'Caller-ID authorization letter',
};
