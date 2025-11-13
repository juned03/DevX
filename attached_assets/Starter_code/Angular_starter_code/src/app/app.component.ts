import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <div class="inner">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-weight:700">🏦 Insurance Portal</span>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
          <a routerLink="/policies" routerLinkActive="active">Policies</a>
          <a routerLink="/claims" routerLinkActive="active">Claims</a>
          <a routerLink="/customers" routerLinkActive="active">Customers</a>
          <a routerLink="/underwriting" routerLinkActive="active">Underwriting</a>
          <a routerLink="/reports" routerLinkActive="active">Reports</a>
        </div>
      </div>
    </nav>
    <main class="container">
      <router-outlet />
    </main>
  `
})
export class AppComponent {}


