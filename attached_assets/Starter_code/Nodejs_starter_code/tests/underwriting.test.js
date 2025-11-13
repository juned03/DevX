import { evaluateRisk } from '../src/services/underwritingService.js';

test('evaluateRisk returns approve for low risk', () => {
  const result = evaluateRisk({ age: 25, product: 'auto', priorClaims: 0 });
  expect(result.decision).toBe('approve');
});


