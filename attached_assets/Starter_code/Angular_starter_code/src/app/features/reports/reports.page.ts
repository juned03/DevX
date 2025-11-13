import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div class="grid cols-2">
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">Analytics</div>
        <p style="color:#9aa3b2">Integrate your charts library (e.g., ngx-charts) here.</p>
      </div>
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">Compliance Notes</div>
        <p style="color:#9aa3b2">Placeholder for regulatory reporting notes and exports.</p>
      </div>
    </div>
  `
})
export class ReportsPageComponent {}


