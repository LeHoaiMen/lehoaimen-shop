import { NextResponse } from 'next/server';
import { getZaloConfig } from '@/lib/zalo';

export const dynamic = 'force-dynamic';
export async function GET() {
  const config = getZaloConfig();
  return NextResponse.json({ enabled: config.enabled, orderEnabled: config.orderEnabled, url: config.url });
}
