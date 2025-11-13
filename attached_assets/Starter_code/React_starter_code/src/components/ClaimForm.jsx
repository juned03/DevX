import { useState } from 'react';
import { claimApi } from '../services/api.js';

export default function ClaimForm({ onSubmitted }) {
  const [form, setForm] = useState({ policyNumber: '', description: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Example API call
      const res = await claimApi.submit({
        policyNumber: form.policyNumber,
        description: form.description,
        amount: Number(form.amount)
      });
      onSubmitted?.(res);
      setForm({ policyNumber: '', description: '', amount: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Submit a Claim</div>
      {error && <div className="tag bad" style={{ marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label>Policy Number</label>
          <input value={form.policyNumber} onChange={(e)=>setForm(f=>({ ...f, policyNumber: e.target.value }))} required />
        </div>
        <div>
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} required />
        </div>
        <div>
          <label>Amount</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e)=>setForm(f=>({ ...f, amount: e.target.value }))} required />
        </div>
        <div>
          <button className="btn" disabled={loading}>{loading ? 'Submitting...' : 'Submit Claim'}</button>
        </div>
      </div>
    </form>
  );
}


