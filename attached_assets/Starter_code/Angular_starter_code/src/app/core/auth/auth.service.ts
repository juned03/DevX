import { Injectable, signal } from '@angular/core';

// Minimal auth state with role; replace with real auth integration
@Injectable({ providedIn: 'root' })
export class AuthService {
  private role = signal<string>(this.defaultRole());
  private authed = signal<boolean>(true);

  private defaultRole(): string {
    return (globalThis as any).env?.DEFAULT_ROLE || 'agent';
  }

  isAuthenticated(): boolean { return this.authed(); }
  userRole(): string { return this.role(); }
  login(role: string) { this.role.set(role); this.authed.set(true); }
  logout() { this.authed.set(false); this.role.set('guest'); }
}


