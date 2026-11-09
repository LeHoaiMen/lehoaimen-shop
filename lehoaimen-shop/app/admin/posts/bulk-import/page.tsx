import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/auth';
import BulkImportClient from './BulkImportClient';

export const dynamic = 'force-dynamic';

export default async function BulkImportPage() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token || !verifyAdminToken(token)) redirect('/admin');
  return <BulkImportClient />;
}
