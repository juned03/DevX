import { useEffect, useState } from 'react';
import PolicyCard from '../components/PolicyCard.jsx';
import { policyApi } from '../services/api.js';
import policiesSeed from '../data/insurancePolicies.json';

export default function Policies() {
  const [policies, setPolicies] = useState(policiesSeed);
  const [creating, setCreating] = useState(false);

  // Example: load from API if available
  useEffect(() => {
    policyApi.list().then(setPolicies).catch(() => {/* fallback to seed */});
  }, []);

  function createDemoPolicy() {
    setCreating(true);
    policyApi.create({
      type: 'auto',
      customerName: 'New Customer',
      premium: 120.5,
      coverage: 15000
    }).then((p) => setPolicies((ps) => [p, ...ps])).catch(() => {
      // fallback local add
      const p = {
        id: String(Date.now()),
        policyNumber: 'POL-' + Math.floor(Math.random() * 100000),
        type: 'auto',
        customerName: 'New Customer',
        premium: 120.5,
        coverage: 15000,
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        status: 'pending'
      };
      setPolicies((ps) => [p, ...ps]);
    }).finally(() => setCreating(false));
  }

  return (
    <div className="grid cols-2">
      <div style={{ gridColumn: '1/-1' }}>
        <button className="btn" onClick={createDemoPolicy} disabled={creating}>{creating ? 'Creating...' : 'Create Demo Policy'}</button>
      </div>
      {policies.map((p) => <PolicyCard key={p.id || p.policyNumber} policy={p} />)}
    </div>
  );
}


