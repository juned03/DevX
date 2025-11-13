import ReportChart from '../components/ReportChart.jsx';

const data = [
  { month: 'Jan', claims: 12, premiums: 40 },
  { month: 'Feb', claims: 16, premiums: 42 },
  { month: 'Mar', claims: 10, premiums: 45 },
  { month: 'Apr', claims: 20, premiums: 44 },
  { month: 'May', claims: 18, premiums: 47 },
  { month: 'Jun', claims: 14, premiums: 50 }
];

export default function Reports() {
  return (
    <div className="grid cols-2">
      <ReportChart data={data} />
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Compliance Notes</div>
        <p style={{ color: '#9aa3b2' }}>
          This is a demo report view. Integrate with your analytics backend for real data
          (e.g., exports for solvency reporting or claims loss ratios).
        </p>
      </div>
    </div>
  );
}


