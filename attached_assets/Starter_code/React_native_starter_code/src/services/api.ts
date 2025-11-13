async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const policyApi = {
  list: () => http<any[]>('https://example.com/api/policies'),
  create: (payload: any) => http<any>('https://example.com/api/policies', { method: 'POST', body: JSON.stringify(payload) })
};

export const claimApi = {
  getById: (id: string) => http<any>(`https://example.com/api/claims/${id}`),
  submit: (payload: any) => http<any>('https://example.com/api/claims', { method: 'POST', body: JSON.stringify(payload) })
};

export const customerApi = {
  register: (payload: any) => http<any>('https://example.com/api/customers', { method: 'POST', body: JSON.stringify(payload) })
};

export const underwritingApi = {
  evaluate: (payload: any) => http<any>('https://example.com/api/underwriting/evaluate', { method: 'POST', body: JSON.stringify(payload) })
};


