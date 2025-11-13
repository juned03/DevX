import React, { useEffect, useState } from 'react';
import { ScrollView, View, Button } from 'react-native';
import PolicyCard from '@/components/PolicyCard';
import seed from '@/data/insurancePolicies.json';

export default function Policies() {
  const [policies, setPolicies] = useState<any[]>(seed as any[]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {}, []);

  function createDemoPolicy() {
    setCreating(true);
    setTimeout(() => {
      setPolicies((ps) => [{ id: Date.now().toString(), policyNumber: 'POL-'+Math.floor(Math.random()*100000), type: 'auto', customerName: 'New Customer', premium: 120.5, coverage: 15000, startDate: '2025-01-01', endDate: '2026-01-01', status: 'pending' }, ...ps]);
      setCreating(false);
    }, 500);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginBottom: 12 }}>
        <Button title={creating ? 'Creating...' : 'Create Demo Policy'} onPress={createDemoPolicy} disabled={creating} />
      </View>
      {policies.map((p) => (<PolicyCard key={p.id || p.policyNumber} policy={p} />))}
    </ScrollView>
  );
}


