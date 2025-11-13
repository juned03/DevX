import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Policies from './pages/Policies.jsx';
import Claims from './pages/Claims.jsx';
import Customers from './pages/Customers.jsx';
import Underwriting from './pages/Underwriting.jsx';
import Reports from './pages/Reports.jsx';
import NotFound from './pages/NotFound.jsx';

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/customers" element={<Customers />} />
          <Route
            path="/underwriting"
            element={
              <ProtectedRoute roles={["underwriter", "admin"]}>
                <Underwriting />
              </ProtectedRoute>
            }
          />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}


