import { useState } from 'react';
import { underwritingApi } from '../services/api.js';

export default function UnderwritingWidget() {
  const [input, setInput] = useState({ age: 35, product: 'auto', priorClaims: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function evaluate() {
    setLoading(true);
    try {
      const res = await underwritingApi.evaluate(input);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Risk Evaluation</div>
      <div className="grid" style={{ gap: 12 }}>
        <div>
          <label>Age</label>
          <input type="number" value={input.age} onChange={(e)=>setInput(v=>({ ...v, age: Number(e.target.value) }))} />
        </div>
        <div>
          <label>Product</label>
          <select value={input.product} onChange={(e)=>setInput(v=>({ ...v, product: e.target.value }))}>
            <option value="auto">Auto</option>
            <option value="home">Home</option>
            <option value="life">Life</option>
          </select>
        </div>
        <div>
          <label>Prior Claims</label>
          <input type="number" value={input.priorClaims} onChange={(e)=>setInput(v=>({ ...v, priorClaims: Number(e.target.value) }))} />
        </div>
        <div>
          <button className="btn" onClick={evaluate} disabled={loading}>{loading ? 'Evaluating...' : 'Evaluate'}</button>
        </div>
      </div>
      {result && (
        <div style={{ marginTop: 12 }}>
          <div>Risk Score: <b>{result.riskScore}</b></div>
          <div>Decision: <b>{result.decision}</b></div>
        </div>
      )}
    </div>
  );
}


