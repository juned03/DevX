import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <nav>
      <div className="inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700 }}>🏦 Insurance Portal</span>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/policies">Policies</NavLink>
          <NavLink to="/claims">Claims</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/underwriting">Underwriting</NavLink>
          <NavLink to="/reports">Reports</NavLink>
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


