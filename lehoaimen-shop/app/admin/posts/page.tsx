import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/auth';
import PostsManagerClient from './PostsManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token || !verifyAdminToken(token)) redirect('/admin');
  return <PostsManagerClient />;
}
