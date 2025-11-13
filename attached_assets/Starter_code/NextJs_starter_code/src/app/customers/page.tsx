import customersSeed from '@/data/customers.json';

export default function CustomersPage() {
  const customers = customersSeed as any[];
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Customers</div>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Policies</th></tr></thead>
        <tbody>
          {customers.map((c:any) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{c.policies.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


