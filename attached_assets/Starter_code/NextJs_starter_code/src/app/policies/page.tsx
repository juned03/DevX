'use client';
import { useEffect, useState } from 'react';
import PolicyCard from '@/components/PolicyCard';
import { policyApi } from '@/services/api';
import seed from '@/data/insurancePolicies.json';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState(seed as any[]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    policyApi.list().then(setPolicies).catch(() => {});
  }, []);

  async function createPolicy() {
    setCreating(true);
    try {
      const created = await policyApi.create({
        policyNumber: 'POL-' + Math.floor(Math.random() * 100000),
        type: 'auto',
        premium: 120.5,
        coverage: 15000,
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        status: 'pending',
        customerName: 'New Customer'
      });
      setPolicies((ps) => [created, ...ps]);
    } catch {
      setPolicies((ps) => [{
        id: String(Date.now()),
        policyNumber: 'POL-' + Math.floor(Math.random() * 100000),
        type: 'auto', customerName: 'New Customer', premium: 120.5, coverage: 15000,
        startDate: '2025-01-01', endDate: '2026-01-01', status: 'pending'
      }, ...ps]);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid cols-2">
      <div style={{ gridColumn: '1/-1' }}>
        <button className="btn" onClick={createPolicy} disabled={creating}>{creating ? 'Creating...' : 'Create Demo Policy'}</button>
      </div>
      {policies.map((p: any) => (
        <PolicyCard key={p.id || p.policyNumber} policy={p} />
      ))}
    </div>
  );
}


