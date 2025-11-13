export default function PolicyCard({ policy }) {
  const statusColor = policy.status === 'active' ? 'ok' : policy.status === 'pending' ? 'warn' : 'bad';
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{policy.policyNumber}</div>
          <div style={{ color: '#9aa3b2', fontSize: 12 }}>{policy.type} • {policy.customerName}</div>
        </div>
        <span className={`tag ${statusColor}`}>{policy.status}</span>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
        <div>Premium: <b>${policy.premium}</b></div>
        <div>Coverage: <b>${policy.coverage}</b></div>
        <div>Start: <b>{policy.startDate}</b></div>
        <div>End: <b>{policy.endDate}</b></div>
      </div>
    </div>
  );
}


