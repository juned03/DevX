import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.customer.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice Johnson', phone: '+1-555-1111' }
  });
  const policy = await prisma.policy.upsert({
    where: { policyNumber: 'POL-10001' },
    update: {},
    create: {
      policyNumber: 'POL-10001', type: 'auto', premium: 89.5, coverage: 20000,
      startDate: new Date('2025-01-01'), endDate: new Date('2026-01-01'), status: 'active', customerId: alice.id
    }
  });
  await prisma.claim.create({
    data: { policyId: policy.id, amount: 1200.5, description: 'Rear bumper damage', status: 'approved' }
  });
  console.log('Seeded sample data');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });


