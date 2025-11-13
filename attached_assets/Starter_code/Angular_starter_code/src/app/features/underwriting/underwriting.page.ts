import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="grid cols-2">
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">Risk Evaluation</div>
        <div class="grid" style="gap:12px">
          <div>
            <label>Age</label>
            <input type="number" [(ngModel)]="age" />
          </div>
          <div>
            <label>Product</label>
            <select [(ngModel)]="product">
              <option value="auto">Auto</option>
              <option value="home">Home</option>
              <option value="life">Life</option>
            </select>
          </div>
          <div>
            <label>Prior Claims</label>
            <input type="number" [(ngModel)]="priorClaims" />
          </div>
          <div>
            <button class="btn" (click)="evaluate()">Evaluate</button>
          </div>
        </div>
        <div *ngIf="result" style="margin-top:12px">
          <div>Risk Score: <b>{{result.riskScore}}</b></div>
          <div>Decision: <b>{{result.decision}}</b></div>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">Guidelines</div>
        <ul>
          <li>Auto: higher prior claims increases risk</li>
          <li>Home: property age and location are key</li>
          <li>Life: age is primary factor for base risk</li>
        </ul>
      </div>
    </div>
  `
})
export class UnderwritingPageComponent {
  age = 35;
  product: 'auto'|'home'|'life' = 'auto';
  priorClaims = 0;
  result: { riskScore: number; decision: 'approve'|'review'|'decline' } | null = null;

  evaluate() {
    let risk = this.age / 10 + this.priorClaims * 5;
    if (this.product === 'life') risk += 10;
    if (this.product === 'home') risk += 5;
    const decision = risk < 10 ? 'approve' : risk < 20 ? 'review' : 'decline';
    this.result = { riskScore: Math.round(risk), decision };
  }
}


