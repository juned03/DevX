import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Basic environment override pattern
const apiBase = (globalThis as any).env?.API_BASE_URL || 'http://localhost:4000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Example API calls for insurance domain
  listPolicies() {
    // Expected backend: GET /api/policies
    return this.http.get<any[]>(`${apiBase}/api/policies`);
  }
  createPolicy(payload: unknown) {
    // Expected backend: POST /api/policies
    return this.http.post(`${apiBase}/api/policies`, payload);
  }
  getClaimById(id: string) {
    // Expected backend: GET /api/claims/:id
    return this.http.get(`${apiBase}/api/claims/${id}`);
  }
  submitClaim(payload: unknown) {
    // Expected backend: POST /api/claims
    return this.http.post(`${apiBase}/api/claims`, payload);
  }
  registerCustomer(payload: unknown) {
    // Expected backend: POST /api/customers
    return this.http.post(`${apiBase}/api/customers`, payload);
  }
  evaluateRisk(payload: unknown) {
    // Expected backend: POST /api/underwriting/evaluate
    return this.http.post(`${apiBase}/api/underwriting/evaluate`, payload);
  }
}


