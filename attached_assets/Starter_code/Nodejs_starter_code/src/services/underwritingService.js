// Simple risk evaluation service for demo purposes
export function evaluateRisk({ age, product, priorClaims }) {
  let risk = (Number(age) || 0) / 10 + (Number(priorClaims) || 0) * 5;
  if (product === 'life') risk += 10;
  if (product === 'home') risk += 5;
  const decision = risk < 10 ? 'approve' : risk < 20 ? 'review' : 'decline';
  return { riskScore: Math.round(risk), decision };
}


