import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PolicyCard from '@/components/PolicyCard';

test('renders policy number and status', () => {
  const { getByText } = render(<PolicyCard policy={{ policyNumber: 'POL-1', type: 'auto', customerName: 'A', premium: 1, coverage: 1, startDate: '2025-01-01', endDate: '2026-01-01', status: 'active' }} />);
  expect(getByText('POL-1')).toBeInTheDocument();
  expect(getByText('active')).toBeInTheDocument();
});


