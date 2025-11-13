import { NextResponse } from 'next/server';
import customers from '@/data/customers.json';

export async function GET() {
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: Date.now().toString(), ...body }, { status: 201 });
}


