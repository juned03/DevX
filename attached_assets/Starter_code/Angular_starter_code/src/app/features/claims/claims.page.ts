import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import claimsSeed from '../../../assets/data/claims.json';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgFor, FormsModule],
  template: `
    <div class="grid cols-2">
      <form class="card" (ngSubmit)="submit()">
        <div style="font-weight:700;margin-bottom:8px">Submit a Claim</div>
        <div style="display:grid;gap:12px">
          <div>
            <label>Policy Number</label>
            <input name="policy" [(ngModel)]="policyNumber" required />
          </div>
          <div>
            <label>Description</label>
            <textarea rows="3" name="description" [(ngModel)]="description" required></textarea>
          </div>
          <div>
            <label>Amount</label>
            <input type="number" name="amount" [(ngModel)]="amount" min="0" step="0.01" required />
          </div>
          <div>
            <button class="btn">Submit Claim</button>
          </div>
        </div>
      </form>
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">Recent Claims</div>
        <table>
          <thead>
            <tr><th>ID</th><th>Policy</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of claims">
              <td>{{c.id}}</td>
              <td>{{c.policyNumber}}</td>
              <td>{{c.amount | number:'1.2-2'}}</td>
              <td><span class="tag" [ngClass]="c.status==='approved'?'ok':c.status==='pending'?'warn':'bad'">{{c.status}}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ClaimsPageComponent {
  claims = claimsSeed as unknown as { id: string; policyNumber: string; amount: number; status: string }[];
  policyNumber = '';
  description = '';
  amount: number | null = null;

  submit() {
    const n = {
      id: 'cl-' + Math.floor(Math.random() * 100000),
      policyNumber: this.policyNumber,
      amount: Number(this.amount || 0),
      status: 'pending'
    };
    this.claims = [n, ...this.claims];
    this.policyNumber = '';
    this.description = '';
    this.amount = null;
  }
}


