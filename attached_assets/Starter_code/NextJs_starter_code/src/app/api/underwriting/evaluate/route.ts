import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { age, product, priorClaims } = await request.json();
  let risk = (Number(age) || 0) / 10 + (Number(priorClaims) || 0) * 5;
  if (product === 'life') risk += 10;
  if (product === 'home') risk += 5;
  const decision = risk < 10 ? 'approve' : risk < 20 ? 'review' : 'decline';
  return NextResponse.json({ riskScore: Math.round(risk), decision });
}


