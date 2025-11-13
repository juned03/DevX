import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ id: params.id, policyNumber: 'POL-10001', amount: 100, status: 'pending' });
}


