import { NextRequest, NextResponse } from 'next/server';
import { clearCustomerSession, getCustomer } from '@/lib/customer-auth';
export async function GET(request: NextRequest) {
  const customer = getCustomer(request);
  return customer ? NextResponse.json({ customer }) : NextResponse.json({ customer: null }, { status: 401 });
}
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearCustomerSession(request, response);
  return response;
}
