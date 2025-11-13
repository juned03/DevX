'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <nav>
      <div className="inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700 }}>🏦 Insurance Portal</span>
          <Link href="/">Dashboard</Link>
          <Link href="/policies">Policies</Link>
          <Link href="/claims">Claims</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/underwriting">Underwriting</Link>
          <Link href="/reports">Reports</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#9aa3b2', fontSize: 12 }}>Role: {user.role}</span>
          {isAuthenticated ? (
            <button className="btn secondary" onClick={logout}>Logout</button>
          ) : (
            <button className="btn" onClick={() => login('agent')}>Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}


