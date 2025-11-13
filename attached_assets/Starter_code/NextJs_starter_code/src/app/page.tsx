import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="grid cols-2">
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick Links</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn" href="/policies">Policies</Link>
          <Link className="btn" href="/claims">Claims</Link>
          <Link className="btn" href="/customers">Customers</Link>
          <Link className="btn" href="/underwriting">Underwriting</Link>
          <Link className="btn" href="/reports">Reports</Link>
        </div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Welcome</div>
        <p style={{ color: '#9aa3b2' }}>Starter template for an Insurance portal built with Next.js App Router.</p>
      </div>
    </div>
  );
}


