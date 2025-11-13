import { NextResponse } from 'next/server';

export async function GET() {
  // Demo summary values
  return NextResponse.json({ policyCount: 2, claimCount: 2 });
}


