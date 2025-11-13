// Simple fetch-based client targeting Next API routes
async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, cache: 'no-store', ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const policyApi = {
  list: () => http<any[]>('/api/policies'),
  create: (payload: any) => http<any>('/api/policies', { method: 'POST', body: JSON.stringify(payload) })
};

export const claimApi = {
  getById: (id: string) => http<any>(`/api/claims/${id}`),
  submit: (payload: any) => http<any>('/api/claims', { method: 'POST', body: JSON.stringify(payload) })
};

export const customerApi = {
  register: (payload: any) => http<any>('/api/customers', { method: 'POST', body: JSON.stringify(payload) })
};

export const underwritingApi = {
  evaluate: (payload: any) => http<any>('/api/underwriting/evaluate', { method: 'POST', body: JSON.stringify(payload) })
};


