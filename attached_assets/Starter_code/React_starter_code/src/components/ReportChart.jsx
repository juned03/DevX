import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportChart({ data }) {
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Monthly Claims vs Premiums</div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <Line type="monotone" dataKey="claims" stroke="#ef4444" />
            <Line type="monotone" dataKey="premiums" stroke="#22c55e" />
            <CartesianGrid stroke="#1b2440" />
            <XAxis dataKey="month" stroke="#9aa3b2" />
            <YAxis stroke="#9aa3b2" />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


