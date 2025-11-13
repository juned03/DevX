import { NextResponse } from 'next/server';
import seed from '@/data/insurancePolicies.json';

export async function GET() {
  return NextResponse.json(seed);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Echo back as created policy (demo)
  return NextResponse.json({ id: Date.now().toString(), ...body }, { status: 201 });
}


