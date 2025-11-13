import UnderwritingWidget from '../components/UnderwritingWidget.jsx';

export default function Underwriting() {
  return (
    <div className="grid cols-2">
      <UnderwritingWidget />
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Guidelines</div>
        <ul>
          <li>Auto: higher prior claims increases risk score</li>
          <li>Home: property age and location are key factors</li>
          <li>Life: age is primary factor for base risk</li>
        </ul>
      </div>
    </div>
  );
}


