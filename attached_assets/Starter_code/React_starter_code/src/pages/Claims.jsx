import { useState } from 'react';
import ClaimForm from '../components/ClaimForm.jsx';
import claimsSeed from '../data/claims.json';

export default function Claims() {
  const [claims, setClaims] = useState(claimsSeed);

  return (
    <div className="grid cols-2">
      <ClaimForm onSubmitted={(c)=> setClaims((cs)=>[c, ...cs])} />
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Claims</div>
        <table>
          <thead>
            <tr><th>ID</th><th>Policy</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {claims.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.policyNumber}</td>
                <td>${c.amount}</td>
                <td><span className={`tag ${c.status === 'approved' ? 'ok' : c.status === 'pending' ? 'warn' : 'bad'}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


