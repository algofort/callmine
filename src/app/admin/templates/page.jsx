import { redirect } from 'next/navigation';

/** GET /admin/templates — redirect kept so old bookmarks do not 404. */
export default function Page() {
    redirect('/admin/email-system');
}
