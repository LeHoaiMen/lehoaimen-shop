import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/auth';
import PostForm from './PostForm';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token || !verifyAdminToken(token)) redirect('/admin');
  return <PostForm />;
}
