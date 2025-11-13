import { Link } from 'react-router-dom';
import ReportChart from '../components/ReportChart.jsx';

const chartData = [
  { month: 'Jan', claims: 12, premiums: 40 },
  { month: 'Feb', claims: 16, premiums: 42 },
  { month: 'Mar', claims: 10, premiums: 45 },
  { month: 'Apr', claims: 20, premiums: 44 },
  { month: 'May', claims: 18, premiums: 47 },
  { month: 'Jun', claims: 14, premiums: 50 }
];

export default function Dashboard() {
  return (
    <div className="grid cols-2">
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick Links</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn" to="/policies">View Policies</Link>
          <Link className="btn" to="/claims">Manage Claims</Link>
          <Link className="btn" to="/customers">Customers</Link>
          <Link className="btn" to="/underwriting">Underwriting</Link>
          <Link className="btn" to="/reports">Reports</Link>
        </div>
      </div>
      <ReportChart data={chartData} />
    </div>
  );
}


