import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: 'cl-' + Math.floor(Math.random() * 100000), status: 'pending', ...body }, { status: 201 });
}


