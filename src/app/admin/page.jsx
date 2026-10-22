import { redirect } from 'next/navigation';

/** GET /admin — redirect()->route('admin.dashboard') */
export default function Page() {
    redirect('/admin/dashboard');
}
