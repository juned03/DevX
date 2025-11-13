import axios from 'axios';

// Axios instance configured from Vite env
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  timeout: 8000
});

// Example API calls for insurance domain
export const policyApi = {
  // GET /api/policies -> list all
  async list() {
    const res = await api.get('/api/policies');
    return res.data;
  },
  // POST /api/policies -> create new
  async create(payload) {
    const res = await api.post('/api/policies', payload);
    return res.data;
  }
};

export const claimApi = {
  // GET /api/claims/:id -> get claim by id
  async getById(id) {
    const res = await api.get(`/api/claims/${id}`);
    return res.data;
  },
  // POST /api/claims -> submit claim
  async submit(payload) {
    const res = await api.post('/api/claims', payload);
    return res.data;
  }
};

export const customerApi = {
  async register(payload) {
    const res = await api.post('/api/customers', payload);
    return res.data;
  }
};

export const underwritingApi = {
  // POST /api/underwriting/evaluate -> risk evaluation
  async evaluate(payload) {
    const res = await api.post('/api/underwriting/evaluate', payload);
    return res.data; // { riskScore: number, decision: 'approve'|'review'|'decline' }
  }
};


