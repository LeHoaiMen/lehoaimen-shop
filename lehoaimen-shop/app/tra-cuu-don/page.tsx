import { redirect } from 'next/navigation';

export default async function OrderLookupAliasPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  redirect(id ? `/tra-cuu-don-hang?code=${encodeURIComponent(id)}` : '/tra-cuu-don-hang');
}
