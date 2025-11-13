import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="grid cols-2">
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">Quick Links</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn" routerLink="/policies">Policies</a>
          <a class="btn" routerLink="/claims">Claims</a>
          <a class="btn" routerLink="/customers">Customers</a>
          <a class="btn" routerLink="/underwriting">Underwriting</a>
          <a class="btn" routerLink="/reports">Reports</a>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">Welcome</div>
        <p style="color:#9aa3b2">Starter template for an Insurance portal built with Angular.</p>
      </div>
    </div>
  `
})
export class DashboardComponent {}


