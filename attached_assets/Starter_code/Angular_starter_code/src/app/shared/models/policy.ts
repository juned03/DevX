export interface Policy {
  id: string;
  policyNumber: string;
  type: 'auto' | 'home' | 'life';
  customerName: string;
  premium: number;
  coverage: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'lapsed';
}


